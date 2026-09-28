import { createEffect, For, Show } from 'solid-js';

import { AuthChip } from '@/components/ui/auth-chip';
import { emailTime, relativeTime, senderName, snippet } from '@/lib/format';
import type { TestmailEmail } from '@/lib/types';

interface EmailListProps {
  emails: TestmailEmail[];
  keyOf: (email: TestmailEmail) => string;
  isRead: (key: string) => boolean;
  selected: string | null;
  emptyText: string;
  onSelect: (key: string) => void;
}

export function EmailList(props: EmailListProps) {
  let listRef: HTMLUListElement | undefined;

  createEffect(() => {
    const key = props.selected;
    if (!key || !listRef) return;
    listRef.querySelector(`[data-key="${CSS.escape(key)}"]`)?.scrollIntoView({ block: 'nearest' });
  });

  return (
    <Show
      when={props.emails.length > 0}
      fallback={<p class="rtm-list rtm-list-empty">{props.emptyText}</p>}
    >
      <ul ref={(el) => (listRef = el)} class="rtm-list" aria-label="Emails">
        <For each={props.emails}>
          {(email) => {
            const key = props.keyOf(email);
            const ts = emailTime(email);
            return (
              <li>
                <button
                  type="button"
                  class="rtm-row"
                  classList={{
                    'is-unread': !props.isRead(key),
                    'is-selected': props.selected === key,
                  }}
                  data-key={key}
                  aria-current={props.selected === key ? 'true' : undefined}
                  onClick={() => props.onSelect(key)}
                >
                  <span class="rtm-row-top">
                    <span class="rtm-unread-dot" />
                    <span class="rtm-row-from">{senderName(email)}</span>
                    <time class="rtm-row-time" title={ts ? new Date(ts).toLocaleString() : ''}>
                      {ts ? relativeTime(ts, Date.now()) : ''}
                    </time>
                  </span>
                  <span class="rtm-row-subject">{email.subject || '(no subject)'}</span>
                  <span class="rtm-row-snippet">{snippet(email)}</span>
                  <span class="rtm-row-chips">
                    <Show when={email.tag}>
                      <span class="rtm-tag">{email.tag}</span>
                    </Show>
                    <AuthChip label="SPF" value={email.SPF} />
                  </span>
                </button>
              </li>
            );
          }}
        </For>
      </ul>
    </Show>
  );
}
