import { For, Show } from 'solid-js';

import { AuthChip } from '@/components/ui/auth-chip';
import { Icon } from '@/components/ui/icon';
import type { CommandId } from '@/lib/commands';
import { emailTime, recipientAddress, relativeTime, senderAddress, senderName } from '@/lib/format';
import { renderJsonView } from '@/lib/json-view';
import type { TestmailEmail } from '@/lib/types';

import { ActionButton } from './action-button';
import { HtmlBody } from './html-body';
import { MetaDrawer } from './meta-drawer';
import { PlainBody } from './plain-body';

export type Tab = 'html' | 'text' | 'raw';

interface ReaderProps {
  email: TestmailEmail;
  tab: Tab;
  metaOpen: boolean;
  isRead: boolean;
  isDone: boolean;
  onCommand: (id: CommandId) => void;
  onTab: (tab: Tab) => void;
  onCopy: (value: string, label: string) => void;
  setScrollEl: (el: HTMLElement) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'html', label: 'HTML' },
  { id: 'text', label: 'Plain text' },
  { id: 'raw', label: 'Raw source' },
];

export function Reader(props: ReaderProps) {
  const ts = () => emailTime(props.email);
  const has = (tab: Tab) =>
    tab === 'raw' || (tab === 'html' ? Boolean(props.email.html) : Boolean(props.email.text));

  return (
    <>
      <div class="rtm-toolbar">
        <button
          type="button"
          class="rtm-btn rtm-btn-ghost rtm-back"
          onClick={() => props.onCommand('back')}
        >
          <Icon name="back" />
          <span>Inbox</span>
        </button>
        <div class="rtm-toolbar-actions">
          <ActionButton
            label={props.isDone ? 'Move to inbox' : 'Done'}
            icon="check"
            keys="E"
            onClick={() => props.onCommand('toggle-done')}
          />
          <ActionButton
            label={props.isRead ? 'Unread' : 'Read'}
            icon="mail"
            keys="U"
            onClick={() => props.onCommand('toggle-read')}
          />
          <ActionButton label="Copy" icon="copy" keys="C" onClick={() => props.onCommand('copy')} />
          <ActionButton
            label="Info"
            icon="info"
            keys="I"
            onClick={() => props.onCommand('toggle-meta')}
          />
          <Show when={props.email.downloadUrl}>
            {(url) => (
              <a
                class="rtm-btn rtm-btn-ghost"
                href={url()}
                target="_blank"
                rel="noopener noreferrer"
                title="Download original .eml"
              >
                <Icon name="download" />
                <span>.eml</span>
              </a>
            )}
          </Show>
        </div>
      </div>

      <div ref={props.setScrollEl} class="rtm-reader-scroll">
        <h1 class="rtm-subject">{props.email.subject || '(no subject)'}</h1>
        <div class="rtm-from">
          <span class="rtm-from-name">{senderName(props.email)}</span>
          <span class="rtm-mono rtm-dim">{senderAddress(props.email)}</span>
          <time class="rtm-mono rtm-dim rtm-from-time">
            {(() => {
              const t = ts();
              return t ? `${new Date(t).toLocaleString()} · ${relativeTime(t, Date.now())}` : '';
            })()}
          </time>
        </div>
        <div class="rtm-to rtm-dim">
          to <span class="rtm-mono">{recipientAddress(props.email)}</span>
        </div>
        <div class="rtm-badges">
          <Show when={props.email.tag}>
            <span class="rtm-tag">{props.email.tag}</span>
          </Show>
          <AuthChip label="SPF" value={props.email.SPF} />
          <AuthChip label="DKIM" value={props.email.dkim} />
        </div>

        <div class="rtm-tabs" role="tablist">
          <For each={TABS}>
            {(t) => (
              <button
                type="button"
                class="rtm-tab"
                role="tab"
                aria-selected={props.tab === t.id}
                disabled={!has(t.id)}
                onClick={() => props.onTab(t.id)}
              >
                {t.label}
              </button>
            )}
          </For>
        </div>

        <Show when={props.tab === 'html'}>
          <Show when={props.email.html} fallback={<p class="rtm-muted">No HTML part.</p>}>
            {(html) => <HtmlBody html={html()} />}
          </Show>
        </Show>
        <Show when={props.tab === 'text'}>
          <Show when={props.email.text} fallback={<p class="rtm-muted">No plain-text part.</p>}>
            {(text) => <PlainBody text={text()} />}
          </Show>
        </Show>
        <Show when={props.tab === 'raw'}>
          {renderJsonView(props.email, JSON.stringify(props.email, null, 2))}
        </Show>
      </div>

      <MetaDrawer
        email={props.email}
        onClose={() => props.onCommand('toggle-meta')}
        onCopy={props.onCopy}
      />
    </>
  );
}
