import { type CommandId, filterCommands, keyToCommand } from './commands';
import { el, icon, type IconName } from './dom';
import { buildEmailSrcdoc } from './email-html';
import {
  authStatus,
  copyTarget,
  emailTime,
  matchesQuery,
  recipientAddress,
  relativeTime,
  senderAddress,
  senderName,
  snippet,
  splitSignature,
} from './format';
import { renderJsonView } from './json-view';
import { fetchMore } from './paginate';
import { sanitizeEmailHtml } from './sanitize';
import type { ParsedResult, TestmailEmail } from './types';

type Folder = 'inbox' | 'done';
type Tab = 'html' | 'text' | 'raw';

function setLabel(b: HTMLElement, text: string) {
  const span = b.querySelector('span');
  if (span) span.textContent = text;
}

function button(label: string, iconName: IconName | null, className = 'rtm-btn') {
  const b = el('button', { type: 'button', className });
  if (iconName) b.append(icon(iconName));
  b.append(el('span', { textContent: label }));
  return b;
}

function kbd(keys: string) {
  return el(
    'span',
    { className: 'rtm-kbd-group' },
    keys.split(' ').map((k) => el('kbd', { className: 'rtm-kbd', textContent: k })),
  );
}

function authChip(label: string, value: string | undefined) {
  const status = authStatus(value);
  return el('span', {
    className: `rtm-auth rtm-auth-${status}`,
    textContent: `${label} ${status === 'none' ? '—' : (value ?? '').toLowerCase()}`,
  });
}

function namespaceFromUrl(): string {
  return new URL(location.href).searchParams.get('namespace') ?? '';
}

export function renderApp(initial: ParsedResult, raw: string, rawData: unknown): HTMLElement {
  let result = initial;
  const keyOf = new WeakMap<TestmailEmail, string>();
  const assignKeys = () => result.emails.forEach((e, i) => keyOf.set(e, e.id ?? `idx-${i}`));
  assignKeys();

  const read = new Set<string>();
  const done = new Set<string>();
  let folder: Folder = 'inbox';
  let query = '';
  let selected: string | null = null;
  let tab: Tab = 'html';
  let metaOpen = false;
  let rawMode = false;
  let pendingG = false;

  const key = (e: TestmailEmail) => keyOf.get(e) ?? '';
  const visible = () =>
    result.emails.filter((e) => (folder === 'done') === done.has(key(e)) && matchesQuery(e, query));
  const current = () => result.emails.find((e) => key(e) === selected);
  const root = el('div', { className: 'rtm-root', dataset: { view: 'list' } });

  const searchInput = el('input', {
    type: 'search',
    className: 'rtm-search-input',
    placeholder: 'Search sender, subject, text',
    spellcheck: false,
  });
  searchInput.setAttribute('aria-label', 'Search emails');
  const search = el('label', { className: 'rtm-search' }, [icon('search'), searchInput, kbd('/')]);

  const countEl = el('span', { className: 'rtm-count' });
  const paletteBtn = button('Commands', null, 'rtm-btn rtm-btn-ghost');
  paletteBtn.append(kbd(navigator.platform.includes('Mac') ? '⌘ K' : 'Ctrl K'));
  const rawBtn = button('JSON', null, 'rtm-btn rtm-btn-ghost');
  rawBtn.setAttribute('aria-pressed', 'false');

  const ns = namespaceFromUrl();
  const header = el('header', { className: 'rtm-header' }, [
    el('div', { className: 'rtm-brand' }, [
      el('span', { className: 'rtm-brand-mark' }, [icon('plane')]),
      el('span', { className: 'rtm-brand-name', textContent: 'Refined testmail.app' }),
      ...(ns ? [el('span', { className: 'rtm-ns', textContent: ns })] : []),
    ]),
    search,
    el('div', { className: 'rtm-header-actions' }, [countEl, paletteBtn, rawBtn]),
  ]);

  const body = el('div', { className: 'rtm-body' });
  const rawView = renderJsonView(rawData, raw);
  rawView.classList.add('rtm-rawpage');
  rawView.hidden = true;
  const toastRegion = el('div', { className: 'rtm-toasts' });
  toastRegion.setAttribute('aria-live', 'polite');
  root.append(header, body, rawView, toastRegion);
  function toast(message: string, action?: { label: string; run: () => void }) {
    const t = el('div', { className: 'rtm-toast' }, [el('span', { textContent: message })]);
    if (action) {
      const b = el('button', { type: 'button', className: 'rtm-toast-action' }, [action.label]);
      b.addEventListener('click', () => {
        action.run();
        t.remove();
      });
      t.append(b);
    }
    toastRegion.replaceChildren(t);
    setTimeout(() => t.remove(), action ? 5000 : 2200);
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied ${what}`);
    } catch {
      toast('Could not copy. The browser blocked clipboard access.');
    }
  }

  if (!result.ok) {
    body.append(
      el('div', { className: 'rtm-state' }, [
        el('p', { className: 'rtm-state-title', textContent: 'The API returned an error' }),
        el('p', { className: 'rtm-state-text', textContent: result.message || 'Request failed.' }),
      ]),
    );
    search.hidden = true;
    wireRawToggle();
    return root;
  }
  const inboxTab = el('button', { type: 'button', className: 'rtm-folder' });
  const doneTab = el('button', { type: 'button', className: 'rtm-folder' });
  inboxTab.addEventListener('click', () => setFolder('inbox'));
  doneTab.addEventListener('click', () => setFolder('done'));
  const listEl = el('div', { className: 'rtm-list' });
  listEl.setAttribute('role', 'listbox');
  listEl.setAttribute('aria-label', 'Emails');
  const loadMoreBtn = button('Load more', null, 'rtm-btn rtm-load-more');
  const listPane = el('section', { className: 'rtm-list-pane' }, [
    el('div', { className: 'rtm-folders' }, [inboxTab, doneTab]),
    listEl,
    loadMoreBtn,
  ]);

  const readerPane = el('section', { className: 'rtm-reader' });
  body.append(listPane, readerPane);

  function renderRow(email: TestmailEmail): HTMLElement {
    const k = key(email);
    const ts = emailTime(email);
    const unread = !read.has(k);
    const row = el('div', {
      className: `rtm-row${unread ? ' is-unread' : ''}${k === selected ? ' is-selected' : ''}`,
      dataset: { key: k },
    });
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', String(k === selected));
    row.append(
      el('div', { className: 'rtm-row-top' }, [
        el('span', { className: 'rtm-unread-dot' }),
        el('span', { className: 'rtm-row-from', textContent: senderName(email) }),
        el('time', {
          className: 'rtm-row-time',
          textContent: ts ? relativeTime(ts, Date.now()) : '',
          title: ts ? new Date(ts).toLocaleString() : '',
        }),
      ]),
      el('div', { className: 'rtm-row-subject', textContent: email.subject || '(no subject)' }),
      el('div', { className: 'rtm-row-snippet', textContent: snippet(email) }),
      el('div', { className: 'rtm-row-chips' }, [
        ...(email.tag ? [el('span', { className: 'rtm-tag', textContent: email.tag })] : []),
        authChip('SPF', email.SPF),
      ]),
    );
    row.addEventListener('click', () => select(k, { open: true }));
    return row;
  }

  function renderList() {
    const items = visible();
    const inboxCount = result.emails.filter((e) => !done.has(key(e))).length;
    inboxTab.textContent = `Inbox ${inboxCount}`;
    doneTab.textContent = `Done ${done.size}`;
    inboxTab.classList.toggle('is-active', folder === 'inbox');
    doneTab.classList.toggle('is-active', folder === 'done');
    inboxTab.setAttribute('aria-pressed', String(folder === 'inbox'));
    doneTab.setAttribute('aria-pressed', String(folder === 'done'));

    if (items.length === 0) {
      const text = query
        ? `No emails match “${query}”.`
        : folder === 'done'
          ? 'Nothing is done yet. Press E on an email to move it here.'
          : 'Inbox zero. Everything is done.';
      listEl.replaceChildren(el('p', { className: 'rtm-list-empty', textContent: text }));
    } else {
      listEl.replaceChildren(...items.map(renderRow));
    }
    loadMoreBtn.hidden = !result.hasMore || folder === 'done';
    countEl.textContent = `${result.emails.length} / ${result.count}`;
    countEl.title = `${result.emails.length} loaded of ${result.count} in this namespace`;
  }
  let scrollEl: HTMLElement | null = null;
  let metaEl: HTMLElement | null = null;

  function metaRow(label: string, value: string | undefined, copyable = true) {
    const v = value && value.trim() ? value : '—';
    const row = el('div', { className: 'rtm-meta-row' }, [
      el('dt', { textContent: label }),
      el('dd', { textContent: v }),
    ]);
    if (copyable && v !== '—') {
      const b = el('button', { type: 'button', className: 'rtm-icon-btn', title: `Copy ${label}` });
      b.setAttribute('aria-label', `Copy ${label}`);
      b.append(icon('copy'));
      b.addEventListener('click', () => copy(v, label));
      row.append(b);
    }
    return row;
  }

  function renderMeta(email: TestmailEmail) {
    const ts = emailTime(email);
    const close = el('button', { type: 'button', className: 'rtm-icon-btn' });
    close.setAttribute('aria-label', 'Close metadata');
    close.append(icon('close'));
    close.addEventListener('click', () => setMeta(false));
    return el('aside', { className: 'rtm-meta' }, [
      el('div', { className: 'rtm-meta-head' }, [
        el('h3', { textContent: 'Technical metadata' }),
        close,
      ]),
      el('dl', {}, [
        metaRow('From', `${senderName(email)} <${senderAddress(email)}>`),
        metaRow('To', recipientAddress(email)),
        metaRow('Envelope from', email.envelope_from),
        metaRow('Envelope to', email.envelope_to),
        metaRow('Date', ts ? new Date(ts).toISOString() : undefined),
        metaRow('Message-ID', email.messageId),
        metaRow('SPF', email.SPF, false),
        metaRow('DKIM', email.dkim, false),
        metaRow('Sender IP', email.sender_ip),
        metaRow('Tag', email.tag),
        metaRow('Namespace', email.namespace),
        metaRow('ID', email.id),
        ...(typeof email.spam_score === 'number'
          ? [metaRow('Spam score', String(email.spam_score), false)]
          : []),
      ]),
    ]);
  }

  function renderBody(email: TestmailEmail): HTMLElement {
    if (tab === 'raw') {
      return renderJsonView(email, JSON.stringify(email, null, 2));
    }
    if (tab === 'text') {
      if (!email.text)
        return el('p', { className: 'rtm-muted', textContent: 'No plain-text part.' });
      const { body: text, signature } = splitSignature(email.text);
      return el('div', { className: 'rtm-plain' }, [
        el('pre', { className: 'rtm-plain-body', textContent: text }),
        ...(signature ? [el('pre', { className: 'rtm-plain-sig', textContent: signature })] : []),
      ]);
    }
    if (!email.html) return el('p', { className: 'rtm-muted', textContent: 'No HTML part.' });
    const frame = el('iframe', { referrerPolicy: 'no-referrer', title: 'Email body' });
    frame.setAttribute('sandbox', ''); // no scripts, no same-origin access
    frame.srcdoc = buildEmailSrcdoc(sanitizeEmailHtml(email.html));
    return el('div', { className: 'rtm-frame' }, [
      frame,
      el('p', {
        className: 'rtm-frame-note',
        textContent: 'Sanitized and sandboxed · no scripts, forms, or remote images',
      }),
    ]);
  }

  function fitFrame() {
    const frame = readerPane.querySelector('iframe');
    if (frame && scrollEl) frame.style.height = `${Math.max(420, scrollEl.clientHeight - 32)}px`;
  }

  function renderReader() {
    const email = current();
    if (!email) {
      readerPane.replaceChildren(
        el('div', { className: 'rtm-state' }, [
          el('p', { className: 'rtm-state-title', textContent: 'No email selected' }),
          el('p', {
            className: 'rtm-state-text',
            textContent: 'Pick an email from the list, or press J to start.',
          }),
        ]),
      );
      scrollEl = null;
      return;
    }
    const k = key(email);
    if (tab === 'html' && !email.html) tab = 'text';
    if (tab === 'text' && !email.text && email.html) tab = 'html';

    const back = button('Inbox', 'back', 'rtm-btn rtm-btn-ghost rtm-back');
    back.addEventListener('click', () => run('back'));

    const action = (id: CommandId, label: string, iconName: IconName, keys: string) => {
      const b = button(label, iconName, 'rtm-btn rtm-btn-ghost');
      b.title = `${label} (${keys})`;
      b.addEventListener('click', () => run(id));
      return b;
    };
    const toolbar = el('div', { className: 'rtm-toolbar' }, [
      back,
      el('div', { className: 'rtm-toolbar-actions' }, [
        action('toggle-done', done.has(k) ? 'Move to inbox' : 'Done', 'check', 'E'),
        action('toggle-read', read.has(k) ? 'Unread' : 'Read', 'mail', 'U'),
        action('copy', 'Copy', 'copy', 'C'),
        action('toggle-meta', 'Info', 'info', 'I'),
        ...(email.downloadUrl
          ? [
              el(
                'a',
                {
                  className: 'rtm-btn rtm-btn-ghost',
                  href: email.downloadUrl,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  title: 'Download original .eml',
                },
                [icon('download'), el('span', { textContent: '.eml' })],
              ),
            ]
          : []),
      ]),
    ]);

    const ts = emailTime(email);
    const tabs = el('div', { className: 'rtm-tabs' });
    tabs.setAttribute('role', 'tablist');
    for (const [id, label, has] of [
      ['html', 'HTML', Boolean(email.html)],
      ['text', 'Plain text', Boolean(email.text)],
      ['raw', 'Raw source', true],
    ] as const) {
      const t = el('button', { type: 'button', className: 'rtm-tab', textContent: label });
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', String(tab === id));
      t.disabled = !has;
      t.addEventListener('click', () => setTab(id));
      tabs.append(t);
    }

    scrollEl = el('div', { className: 'rtm-reader-scroll' }, [
      el('h1', { className: 'rtm-subject', textContent: email.subject || '(no subject)' }),
      el('div', { className: 'rtm-from' }, [
        el('span', { className: 'rtm-from-name', textContent: senderName(email) }),
        el('span', { className: 'rtm-mono rtm-dim', textContent: senderAddress(email) }),
        el('time', {
          className: 'rtm-mono rtm-dim rtm-from-time',
          textContent: ts
            ? `${new Date(ts).toLocaleString()} · ${relativeTime(ts, Date.now())}`
            : '',
        }),
      ]),
      el('div', { className: 'rtm-to rtm-dim' }, [
        el('span', { textContent: 'to ' }),
        el('span', { className: 'rtm-mono', textContent: recipientAddress(email) }),
      ]),
      el('div', { className: 'rtm-badges' }, [
        ...(email.tag ? [el('span', { className: 'rtm-tag', textContent: email.tag })] : []),
        authChip('SPF', email.SPF),
        authChip('DKIM', email.dkim),
      ]),
      tabs,
      renderBody(email),
    ]);

    metaEl = renderMeta(email);
    readerPane.classList.toggle('is-meta-open', metaOpen);
    readerPane.replaceChildren(toolbar, scrollEl, metaEl);
    requestAnimationFrame(fitFrame);
  }
  function select(k: string | null, opts: { open?: boolean; markRead?: boolean } = {}) {
    selected = k;
    if (k && opts.markRead !== false) read.add(k);
    renderList();
    renderReader();
    if (opts.open) root.dataset.view = 'reader';
    listEl.querySelector('.is-selected')?.scrollIntoView({ block: 'nearest' });
  }

  function move(step: 1 | -1) {
    const items = visible();
    if (items.length === 0) return;
    const i = items.findIndex((e) => key(e) === selected);
    const next = items[Math.min(items.length - 1, Math.max(0, i === -1 ? 0 : i + step))];
    if (next) select(key(next));
  }

  function setFolder(f: Folder) {
    folder = f;
    const first = visible()[0];
    select(first ? key(first) : null, { markRead: false });
    root.dataset.view = 'list';
  }

  function setTab(t: Tab) {
    tab = t;
    renderReader();
  }

  function setMeta(open: boolean) {
    metaOpen = open;
    readerPane.classList.toggle('is-meta-open', open);
    if (open) metaEl?.querySelector('button')?.focus();
  }

  function toggleDone() {
    const email = current();
    if (!email) return;
    const k = key(email);
    const items = visible();
    const i = items.findIndex((e) => key(e) === k);
    const wasDone = done.has(k);
    if (wasDone) done.delete(k);
    else done.add(k);
    const after = visible();
    const next = after[Math.min(i, after.length - 1)];
    select(next ? key(next) : null, { markRead: false });
    toast(wasDone ? 'Moved to inbox' : 'Marked as done', {
      label: 'Undo',
      run: () => {
        if (wasDone) done.add(k);
        else done.delete(k);
        select(k, { markRead: false });
      },
    });
  }

  function toggleRead() {
    const k = selected;
    if (!k) return;
    const nowRead = !read.has(k);
    if (nowRead) read.add(k);
    else read.delete(k);
    renderList();
    renderReader();
    toast(nowRead ? 'Marked as read' : 'Marked as unread');
  }

  async function loadMore() {
    if (!result.hasMore || loadMoreBtn.disabled) return;
    loadMoreBtn.disabled = true;
    setLabel(loadMoreBtn, 'Loading…');
    try {
      const before = result.emails.length;
      result = await fetchMore(result);
      assignKeys();
      renderList();
      toast(`Loaded ${result.emails.length - before} more`);
    } catch {
      toast('Could not load more emails. Try again.');
    } finally {
      loadMoreBtn.disabled = false;
      setLabel(loadMoreBtn, 'Load more');
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
        if (!selected) move(1);
        root.dataset.view = 'reader';
        return;
      case 'back':
        if (metaOpen) return setMeta(false);
        root.dataset.view = 'list';
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
        if (!target) return toast('No code or link found in this email');
        return copy(target.value, target.kind === 'code' ? `code ${target.value}` : 'link');
      }
      case 'copy-address':
        if (email) return copy(recipientAddress(email), 'recipient address');
        return;
      case 'toggle-meta':
        if (email) setMeta(!metaOpen);
        return;
      case 'toggle-done':
        return toggleDone();
      case 'toggle-read':
        return toggleRead();
      case 'search':
        root.dataset.view = 'list';
        searchInput.focus();
        searchInput.select();
        return;
      case 'palette':
        return openPalette();
      case 'tab-html':
        return setTab('html');
      case 'tab-text':
        return setTab('text');
      case 'tab-raw':
        return setTab('raw');
      case 'view-inbox':
        return setFolder('inbox');
      case 'view-done':
        return setFolder('done');
      case 'raw-json':
        return toggleRawMode();
      case 'load-more':
        return void loadMore();
      case 'download':
        if (email?.downloadUrl) window.open(email.downloadUrl, '_blank', 'noopener');
        else toast('This email has no download link');
        return;
    }
  }
  let palette: HTMLElement | null = null;
  let returnFocus: Element | null = null;

  function choose(id: CommandId) {
    closePalette();
    run(id);
  }

  function openPalette() {
    if (palette) return;
    returnFocus =
      root.getRootNode() instanceof ShadowRoot
        ? (root.getRootNode() as ShadowRoot).activeElement
        : null;
    let active = 0;
    const input = el('input', {
      type: 'text',
      className: 'rtm-palette-input',
      placeholder: 'Type a command',
      spellcheck: false,
    });
    input.setAttribute('aria-label', 'Command');
    const list = el('div', { className: 'rtm-palette-list' });
    list.setAttribute('role', 'listbox');

    const draw = () => {
      const cmds = filterCommands(input.value);
      active = Math.min(active, Math.max(0, cmds.length - 1));
      list.replaceChildren(
        ...(cmds.length
          ? cmds.map((c, i) => {
              const item = el(
                'div',
                { className: `rtm-palette-item${i === active ? ' is-active' : ''}` },
                [el('span', { textContent: c.label }), ...(c.keys ? [kbd(c.keys)] : [])],
              );
              item.setAttribute('role', 'option');
              item.setAttribute('aria-selected', String(i === active));
              item.addEventListener('mousemove', () => {
                if (active !== i) {
                  active = i;
                  draw();
                }
              });
              item.addEventListener('click', () => choose(c.id));
              return item;
            })
          : [el('p', { className: 'rtm-palette-empty', textContent: 'No matching command' })]),
      );
      list.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
    };

    input.addEventListener('input', () => {
      active = 0;
      draw();
    });
    input.addEventListener('keydown', (e) => {
      const cmds = filterCommands(input.value);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active =
          (active + (e.key === 'ArrowDown' ? 1 : -1) + cmds.length) % Math.max(1, cmds.length);
        draw();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const c = cmds[active];
        if (c) choose(c.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
      e.stopPropagation();
    });

    const dialog = el('div', { className: 'rtm-palette' }, [input, list]);
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Command bar');
    palette = el('div', { className: 'rtm-scrim' }, [dialog]);
    palette.addEventListener('mousedown', (e) => {
      if (e.target === palette) closePalette();
    });
    root.append(palette);
    draw();
    input.focus();
  }

  function closePalette() {
    palette?.remove();
    palette = null;
    if (returnFocus instanceof HTMLElement) returnFocus.focus();
  }
  function toggleRawMode() {
    rawMode = !rawMode;
    rawView.hidden = !rawMode;
    body.hidden = rawMode;
    search.hidden = rawMode;
    rawBtn.setAttribute('aria-pressed', String(rawMode));
    setLabel(rawBtn, rawMode ? 'Inbox' : 'JSON');
  }

  function wireRawToggle() {
    rawBtn.addEventListener('click', toggleRawMode);
    paletteBtn.addEventListener('click', openPalette);
  }
  function onKey(e: KeyboardEvent) {
    if (palette) return; // the command bar input handles its own keys
    const target = e.composedPath()[0];
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    const isPalette = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';

    if (typing && !isPalette) {
      if (e.key === 'Escape' && target === searchInput) {
        searchInput.blur();
        e.preventDefault();
      } else if (e.key === 'Enter' && target === searchInput) {
        const first = visible()[0];
        if (first) select(key(first), { open: true });
        searchInput.blur();
        e.preventDefault();
      }
      return;
    }
    if (rawMode && !isPalette) return;

    const cmd = keyToCommand(e, pendingG);
    pendingG = cmd === 'g';
    if (!cmd || cmd === 'g') {
      if (cmd === 'g') e.preventDefault();
      return;
    }
    e.preventDefault();
    run(cmd);
  }

  searchInput.addEventListener('input', () => {
    query = searchInput.value;
    const items = visible();
    if (!items.some((x) => key(x) === selected)) {
      select(items[0] ? key(items[0]) : null, { markRead: false });
    } else {
      renderList();
    }
  });
  loadMoreBtn.addEventListener('click', () => void loadMore());
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', fitFrame);
  wireRawToggle();

  const first = visible()[0];
  select(first ? key(first) : null, { markRead: false });

  return root;
}
