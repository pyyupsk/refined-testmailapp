import { Show } from 'solid-js';

import { type AuthStatus, authStatus } from '@/lib/format';

const HINTS: Record<string, Record<AuthStatus, string>> = {
  SPF: {
    pass: 'The sending server is allowed to send for this domain',
    fail: 'The sending server is not allowed to send for this domain',
    neutral: 'The domain does not say whether this server is allowed',
    none: 'The sender domain has no SPF record',
  },
  DKIM: {
    pass: 'The DKIM signature is valid',
    fail: 'The DKIM signature is invalid',
    neutral: 'The DKIM result is inconclusive',
    none: 'Not signed with DKIM',
  },
};

export function AuthChip(props: { label: 'SPF' | 'DKIM'; value: string | undefined }) {
  const status = () => authStatus(props.value);
  return (
    <Show when={props.value?.trim()}>
      {(value) => (
        <span class={`rtm-auth rtm-auth-${status()}`} title={HINTS[props.label]?.[status()]}>
          {props.label} {value().toLowerCase()}
        </span>
      )}
    </Show>
  );
}
