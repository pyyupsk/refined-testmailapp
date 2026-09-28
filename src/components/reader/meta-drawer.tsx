import { createMemo, For, Show } from 'solid-js';

import { Icon } from '@/components/ui/icon';
import { emailTime, recipientAddress, senderAddress, senderName } from '@/lib/format';
import type { TestmailEmail } from '@/lib/types';

export function MetaDrawer(props: {
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
