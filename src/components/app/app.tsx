import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';

import { CommandBar } from '@/components/command/command-bar';
import { EmailList } from '@/components/inbox/email-list';
import { Reader, type Tab } from '@/components/reader/reader';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';
import { type CommandId, keyToCommand } from '@/lib/commands';
import { copyTarget, matchesQuery, recipientAddress } from '@/lib/format';
import { renderJsonView } from '@/lib/json-view';
import { fetchMore } from '@/lib/paginate';
import type { ParsedResult, TestmailEmail } from '@/lib/types';

type Folder = 'inbox' | 'done';

interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

interface AppProps {
  initial: ParsedResult;
  raw: string;
  rawData: unknown;
}

function toggled(set: Set<string>, key: string, on: boolean): Set<string> {
  const next = new Set(set);
  if (on) next.add(key);
  else next.delete(key);
  return next;
}

export function App(props: AppProps) {
  const [result, setResult] = createSignal(props.initial);
  const [read, setRead] = createSignal(new Set<string>());
  const [done, setDone] = createSignal(new Set<string>());
  const [folder, setFolder] = createSignal<Folder>('inbox');
  const [query, setQuery] = createSignal('');
  const [selected, setSelected] = createSignal<string | null>(null);
  const [tab, setTab] = createSignal<Tab>('html');
  const [metaOpen, setMetaOpen] = createSignal(false);
  const [rawMode, setRawMode] = createSignal(false);
  const [view, setView] = createSignal<'list' | 'reader'>('list');
  const [paletteOpen, setPaletteOpen] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [toast, setToast] = createSignal<Toast | null>(null);

  const keys = new WeakMap<TestmailEmail, string>();
  const keyOf = (e: TestmailEmail) => {
    let k = keys.get(e);
    if (!k) {
      k = e.id ?? `idx-${result().emails.indexOf(e)}`;
      keys.set(e, k);
    }
    return k;
  };

  const visible = createMemo(() =>
    result().emails.filter(
      (e) => (folder() === 'done') === done().has(keyOf(e)) && matchesQuery(e, query()),
    ),
  );
  const current = createMemo(() => result().emails.find((e) => keyOf(e) === selected()));
  const inboxCount = createMemo(() => result().emails.filter((e) => !done().has(keyOf(e))).length);
  const namespace = new URL(location.href).searchParams.get('namespace') ?? '';
  const isMac = navigator.platform.includes('Mac');

  let searchInput: HTMLInputElement | undefined;
  let scrollEl: HTMLElement | undefined;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let toastId = 0;

  function showToast(message: string, action?: Toast['action']) {
    clearTimeout(toastTimer);
    setToast({ id: ++toastId, message, action });
    toastTimer = setTimeout(() => setToast(null), action ? 5000 : 2200);
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied ${what}`);
    } catch {
      showToast('Could not copy. The browser blocked clipboard access.');
    }
  }

  function select(key: string | null, opts: { open?: boolean; markRead?: boolean } = {}) {
    setSelected(key);
    if (key && opts.markRead !== false) setRead((s) => toggled(s, key, true));
    const email = current();
    if (email) {
      if (tab() === 'html' && !email.html) setTab('text');
      else if (tab() === 'text' && !email.text && email.html) setTab('html');
    }
    if (opts.open) setView('reader');
  }

  function move(step: 1 | -1) {
    const items = visible();
    if (!items.length) return;
    const i = items.findIndex((e) => keyOf(e) === selected());
    const next = items[Math.min(items.length - 1, Math.max(0, i === -1 ? 0 : i + step))];
    if (next) select(keyOf(next));
  }

  function changeFolder(f: Folder) {
    setFolder(f);
    const first = visible()[0];
    select(first ? keyOf(first) : null, { markRead: false });
    setView('list');
  }

  function toggleDone() {
    const email = current();
    if (!email) return;
    const key = keyOf(email);
    const before = visible();
    const index = before.findIndex((e) => keyOf(e) === key);
    const wasDone = done().has(key);
    setDone((s) => toggled(s, key, !wasDone));
    const after = visible();
    const next = after[Math.min(index, after.length - 1)];
    select(next ? keyOf(next) : null, { markRead: false });
    showToast(wasDone ? 'Moved to inbox' : 'Marked as done', {
      label: 'Undo',
      run: () => {
        setDone((s) => toggled(s, key, wasDone));
        select(key, { markRead: false });
      },
    });
  }

  function toggleRead() {
    const key = selected();
    if (!key) return;
    const nowRead = !read().has(key);
    setRead((s) => toggled(s, key, nowRead));
    showToast(nowRead ? 'Marked as read' : 'Marked as unread');
  }

  async function loadMore() {
    if (!result().hasMore || loading()) return;
    setLoading(true);
    try {
      const before = result().emails.length;
      const next = await fetchMore(result());
      setResult(next);
      showToast(`Loaded ${next.emails.length - before} more`);
    } catch {
      showToast('Could not load more emails. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function run(id: CommandId) {
    const email = current();
    switch (id) {
      case 'next':
        return move(1);
      case 'prev':
        return move(-1);
      case 'open':
        if (!selected()) move(1);
        else if (email) select(keyOf(email));
        setView('reader');
        return;
      case 'back':
        if (metaOpen()) return setMetaOpen(false);
        setView('list');
        return;
      case 'page-down':
      case 'page-up':
        scrollEl?.scrollBy({
          top: (id === 'page-down' ? 1 : -1) * scrollEl.clientHeight * 0.85,
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
        return;
      case 'copy': {
        const target = email && copyTarget(email);
        if (!target) return showToast('No code or link found in this email');
        return copy(target.value, target.kind === 'code' ? `code ${target.value}` : 'link');
      }
      case 'copy-address':
        if (email) return copy(recipientAddress(email), 'recipient address');
        return;
      case 'toggle-meta':
        if (email) setMetaOpen((o) => !o);
        return;
      case 'toggle-done':
        return toggleDone();
      case 'toggle-read':
        return toggleRead();
      case 'search':
        setView('list');
        searchInput?.focus();
        searchInput?.select();
        return;
      case 'palette':
        setPaletteOpen(true);
        return;
      case 'tab-html':
        return setTab('html');
      case 'tab-text':
        return setTab('text');
      case 'tab-raw':
        return setTab('raw');
      case 'view-inbox':
        return changeFolder('inbox');
      case 'view-done':
        return changeFolder('done');
      case 'raw-json':
        setRawMode((m) => !m);
        return;
      case 'load-more':
        return void loadMore();
      case 'download':
        if (email?.downloadUrl) window.open(email.downloadUrl, '_blank', 'noopener');
        else showToast('This email has no download link');
        return;
    }
  }

  let pendingG = false;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (paletteOpen()) return;
    const target = e.composedPath()[0];
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    const isPalette = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';

    if (typing && !isPalette) {
      if (target === searchInput && (e.key === 'Escape' || e.key === 'Enter')) {
        if (e.key === 'Enter') {
          const first = visible()[0];
          if (first) select(keyOf(first), { open: true });
        }
        searchInput.blur();
        e.preventDefault();
      }
      return;
    }
    if (rawMode() && !isPalette) return;

    const cmd = keyToCommand(e, pendingG);
    pendingG = cmd === 'g';
    if (!cmd) return;
    e.preventDefault();
    if (cmd !== 'g') run(cmd);
  };

  onMount(() => {
    const first = visible()[0];
    select(first ? keyOf(first) : null, { markRead: false });
    window.addEventListener('keydown', handleKeyDown);
  });
  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
    clearTimeout(toastTimer);
  });

  const emptyText = () => {
    if (query()) return `No emails match “${query()}”.`;
    if (folder() === 'done') return 'Nothing is done yet. Press E on an email to move it here.';
    return 'Inbox zero. Everything is done.';
  };

  const rawView = renderJsonView(props.rawData, props.raw);
  rawView.classList.add('rtm-rawpage');

  return (
    <div class="rtm-root" data-view={view()}>
      <header class="rtm-header">
        <div class="rtm-brand">
          <span class="rtm-brand-mark">
            <Icon name="plane" />
          </span>
          <span class="rtm-brand-name">Refined testmail.app</span>
          <Show when={namespace}>
            <span class="rtm-ns">{namespace}</span>
          </Show>
        </div>
        <label class="rtm-search" hidden={rawMode() || !result().ok}>
          <Icon name="search" />
          <input
            ref={(el) => (searchInput = el)}
            type="search"
            class="rtm-search-input"
            placeholder="Search sender, subject, text"
            aria-label="Search emails"
            spellcheck={false}
            value={query()}
            onInput={(e) => {
              setQuery(e.currentTarget.value);
              const items = visible();
              if (!items.some((x) => keyOf(x) === selected())) {
                select(items[0] ? keyOf(items[0]) : null, { markRead: false });
              }
            }}
          />
          <Kbd keys="/" />
        </label>
        <div class="rtm-header-actions">
          <span
            class="rtm-count"
            title={`${result().emails.length} loaded of ${result().count} in this namespace`}
          >
            {result().emails.length} / {result().count}
          </span>
          <button type="button" class="rtm-btn rtm-btn-ghost" onClick={() => setPaletteOpen(true)}>
            <span>Commands</span>
            <Kbd keys={isMac ? '⌘ K' : 'Ctrl K'} />
          </button>
          <button
            type="button"
            class="rtm-btn rtm-btn-ghost"
            aria-pressed={rawMode()}
            onClick={() => setRawMode((m) => !m)}
          >
            <span>{rawMode() ? 'Inbox' : 'JSON'}</span>
          </button>
        </div>
      </header>

      <div class="rtm-body" hidden={rawMode()}>
        <Show
          when={result().ok}
          fallback={
            <div class="rtm-state">
              <p class="rtm-state-title">The API returned an error</p>
              <p class="rtm-state-text">{result().message || 'Request failed.'}</p>
            </div>
          }
        >
          <section class="rtm-list-pane">
            <div class="rtm-folders">
              <For each={['inbox', 'done'] as const}>
                {(f) => (
                  <button
                    type="button"
                    class="rtm-folder"
                    classList={{ 'is-active': folder() === f }}
                    aria-pressed={folder() === f}
                    onClick={() => changeFolder(f)}
                  >
                    {f === 'inbox' ? `Inbox ${inboxCount()}` : `Done ${done().size}`}
                  </button>
                )}
              </For>
            </div>
            <EmailList
              emails={visible()}
              keyOf={keyOf}
              isRead={(k) => read().has(k)}
              selected={selected()}
              emptyText={emptyText()}
              onSelect={(k) => select(k, { open: true })}
            />
            <Show when={result().hasMore && folder() === 'inbox'}>
              <button
                type="button"
                class="rtm-btn rtm-load-more"
                disabled={loading()}
                onClick={() => void loadMore()}
              >
                <span>{loading() ? 'Loading…' : 'Load more'}</span>
              </button>
            </Show>
          </section>

          <section class="rtm-reader" classList={{ 'is-meta-open': metaOpen() }}>
            <Show
              when={current()}
              keyed
              fallback={
                <div class="rtm-state">
                  <p class="rtm-state-title">No email selected</p>
                  <p class="rtm-state-text">Pick an email from the list, or press J to start.</p>
                </div>
              }
            >
              {(email) => (
                <Reader
                  email={email}
                  tab={tab()}
                  metaOpen={metaOpen()}
                  isRead={read().has(keyOf(email))}
                  isDone={done().has(keyOf(email))}
                  onCommand={run}
                  onTab={setTab}
                  onCopy={(value, label) => void copy(value, label)}
                  setScrollEl={(el) => {
                    scrollEl = el;
                  }}
                />
              )}
            </Show>
          </section>
        </Show>
      </div>

      <div hidden={!rawMode()} class="rtm-rawwrap">
        {rawView}
      </div>

      <div class="rtm-toasts" aria-live="polite">
        <Show when={toast()} keyed>
          {(t) => (
            <div class="rtm-toast">
              <span>{t.message}</span>
              <Show when={t.action}>
                {(action) => (
                  <button
                    type="button"
                    class="rtm-toast-action"
                    onClick={() => {
                      action().run();
                      setToast(null);
                    }}
                  >
                    {action().label}
                  </button>
                )}
              </Show>
            </div>
          )}
        </Show>
      </div>

      <Show when={paletteOpen()}>
        <CommandBar onRun={run} onClose={() => setPaletteOpen(false)} />
      </Show>
    </div>
  );
}
