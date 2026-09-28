import { Icon, type IconName } from '@/components/ui/icon';

export function ActionButton(props: {
  label: string;
  icon: IconName;
  keys: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      class="rtm-btn rtm-btn-ghost"
      title={`${props.label} (${props.keys})`}
      aria-label={props.label}
      aria-keyshortcuts={props.keys}
      onClick={props.onClick}
    >
      <Icon name={props.icon} />
      <span>{props.label}</span>
    </button>
  );
}
