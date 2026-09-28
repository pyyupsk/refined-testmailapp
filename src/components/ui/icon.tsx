import ArrowLeft from 'lucide-solid/icons/arrow-left';
import Check from 'lucide-solid/icons/check';
import Copy from 'lucide-solid/icons/copy';
import Download from 'lucide-solid/icons/download';
import Info from 'lucide-solid/icons/info';
import Mail from 'lucide-solid/icons/mail';
import Search from 'lucide-solid/icons/search';
import Send from 'lucide-solid/icons/send';
import X from 'lucide-solid/icons/x';
import { Dynamic } from 'solid-js/web';

// Deep imports keep unused Lucide icons out of the dev bundle too.
const ICONS = {
  back: ArrowLeft,
  check: Check,
  close: X,
  copy: Copy,
  download: Download,
  info: Info,
  mail: Mail,
  plane: Send,
  search: Search,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon(props: { name: IconName }) {
  return (
    <Dynamic
      component={ICONS[props.name]}
      class="rtm-icon"
      size={16}
      stroke-width={1.5}
      aria-hidden="true"
    />
  );
}
