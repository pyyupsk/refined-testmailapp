import { createMemo, For, onCleanup, onMount, Show } from 'solid-js';

import type { CommandId } from '@/lib/commands';
import { buildEmailSrcdoc } from '@/lib/email-html';
import {
  emailTime,
  recipientAddress,
  relativeTime,
  senderAddress,
  senderName,
  splitSignature,
} from '@/lib/format';
import { renderJsonView } from '@/lib/json-view';
import { sanitizeEmailHtml } from '@/lib/sanitize';
import type { TestmailEmail } from '@/lib/types';

import { AuthChip } from './EmailList';
import { Icon, type IconName } from './Icon';

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

function HtmlBody(props: { html: string }) {
  let frame: HTMLIFrameElement | undefined;
  const fit = () => {
    const scroller = frame?.closest('.rtm-reader-scroll');
    if (frame && scroller) frame.style.height = `${Math.max(420, scroller.clientHeight - 32)}px`;
  };
  onMount(() => {
    requestAnimationFrame(fit);
    window.addEventListener('resize', fit);
  });
  onCleanup(() => window.removeEventListener('resize', fit));

  return (
    <div class="rtm-frame">
      <iframe
        ref={(el) => (frame = el)}
        sandbox=""
        referrerPolicy="no-referrer"
        title="Email body"
        srcdoc={buildEmailSrcdoc(sanitizeEmailHtml(props.html))}
      />
      <p class="rtm-frame-note">Sanitized and sandboxed · no scripts, forms, or remote images</p>
    </div>
  );
}

function PlainBody(props: { text: string }) {
  const parts = createMemo(() => splitSignature(props.text));
  return (
    <div class="rtm-plain">
      <pre class="rtm-plain-body">{parts().body}</pre>
      <Show when={parts().signature}>
        <pre class="rtm-plain-sig">{parts().signature}</pre>
      </Show>
    </div>
  );
}

function MetaDrawer(props: {
  email: TestmailEmail;
  onClose: () => void;
  onCopy: (value: string, label: string) => void;
}) {
  const rows = createMemo(() => {
    const e = props.email;
    const ts = emailTime(e);
    return [
      ['From', `${senderName(e)} <${senderAddress(e)}>`, true],
      ['To', recipientAddress(e), true],
      ['Envelope from', e.envelope_from, true],
      ['Envelope to', e.envelope_to, true],
      ['Date', ts ? new Date(ts).toISOString() : undefined, true],
      ['Message-ID', e.messageId, true],
      ['SPF', e.SPF, false],
      ['DKIM', e.dkim, false],
      ['Sender IP', e.sender_ip, true],
      ['Tag', e.tag, true],
      ['Namespace', e.namespace, true],
      ['ID', e.id, true],
      ...(typeof e.spam_score === 'number'
        ? [['Spam score', String(e.spam_score), false] as const]
        : []),
    ] as const;
  });

  return (
    <aside class="rtm-meta">
      <div class="rtm-meta-head">
        <h3>Technical metadata</h3>
        <button
          type="button"
          class="rtm-icon-btn"
          aria-label="Close metadata"
          onClick={props.onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <dl>
        <For each={rows()}>
          {([label, value, copyable]) => {
            const shown = value && value.trim() ? value : '—';
            return (
              <div class="rtm-meta-row">
                <dt>{label}</dt>
                <dd>{shown}</dd>
                <Show when={copyable && shown !== '—'}>
                  <button
                    type="button"
                    class="rtm-icon-btn"
                    title={`Copy ${label}`}
                    aria-label={`Copy ${label}`}
                    onClick={() => props.onCopy(shown, label)}
                  >
                    <Icon name="copy" />
                  </button>
                </Show>
              </div>
            );
          }}
        </For>
      </dl>
    </aside>
  );
}

function Action(props: { label: string; icon: IconName; keys: string; onClick: () => void }) {
  return (
    <button
      type="button"
      class="rtm-btn rtm-btn-ghost"
      title={`${props.label} (${props.keys})`}
      onClick={props.onClick}
    >
      <Icon name={props.icon} />
      <span>{props.label}</span>
    </button>
  );
}

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
          <Action
            label={props.isDone ? 'Move to inbox' : 'Done'}
            icon="check"
            keys="E"
            onClick={() => props.onCommand('toggle-done')}
          />
          <Action
            label={props.isRead ? 'Unread' : 'Read'}
            icon="mail"
            keys="U"
            onClick={() => props.onCommand('toggle-read')}
          />
          <Action label="Copy" icon="copy" keys="C" onClick={() => props.onCommand('copy')} />
          <Action
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
