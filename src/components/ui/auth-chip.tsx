import { authStatus } from '@/lib/format';

export function AuthChip(props: { label: string; value: string | undefined }) {
  const status = () => authStatus(props.value);
  return (
    <span class={`rtm-auth rtm-auth-${status()}`}>
      {props.label} {status() === 'none' ? '—' : (props.value ?? '').toLowerCase()}
    </span>
  );
}
