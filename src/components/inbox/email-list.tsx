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
  let listRef: HTMLDivElement | undefined;

  createEffect(() => {
    const key = props.selected;
    if (!key || !listRef) return;
    listRef.querySelector(`[data-key="${CSS.escape(key)}"]`)?.scrollIntoView({ block: 'nearest' });
  });

  return (
    <div ref={(el) => (listRef = el)} class="rtm-list" role="listbox" aria-label="Emails">
      <Show
        when={props.emails.length > 0}
        fallback={<p class="rtm-list-empty">{props.emptyText}</p>}
      >
        <For each={props.emails}>
          {(email) => {
            const key = props.keyOf(email);
            const ts = emailTime(email);
            return (
              <div
                class="rtm-row"
                classList={{
                  'is-unread': !props.isRead(key),
                  'is-selected': props.selected === key,
                }}
                data-key={key}
                role="option"
                aria-selected={props.selected === key}
                onClick={() => props.onSelect(key)}
              >
                <div class="rtm-row-top">
                  <span class="rtm-unread-dot" />
                  <span class="rtm-row-from">{senderName(email)}</span>
                  <time class="rtm-row-time" title={ts ? new Date(ts).toLocaleString() : ''}>
                    {ts ? relativeTime(ts, Date.now()) : ''}
                  </time>
                </div>
                <div class="rtm-row-subject">{email.subject || '(no subject)'}</div>
                <div class="rtm-row-snippet">{snippet(email)}</div>
                <div class="rtm-row-chips">
                  <Show when={email.tag}>
                    <span class="rtm-tag">{email.tag}</span>
                  </Show>
                  <AuthChip label="SPF" value={email.SPF} />
                </div>
              </div>
            );
          }}
        </For>
      </Show>
    </div>
  );
}
