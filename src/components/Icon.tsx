const ICONS = {
  check: 'M3.5 8.5l3 3 6-7',
  mail: 'M2.5 4.5h11v7h-11z M2.5 4.5l5.5 4 5.5-4',
  copy: 'M5.5 5.5h7v7h-7z M3.5 10.5v-7h7',
  info: 'M8 7.5v4 M8 5v.01 M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z',
  download: 'M8 2.5v8 M4.5 7l3.5 3.5L11.5 7 M3 13.5h10',
  back: 'M10 3.5L5.5 8l4.5 4.5',
  search: 'M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M10.5 10.5L14 14',
  close: 'M4 4l8 8 M12 4l-8 8',
  plane: 'M14 2L2 7.5l4.5 1.5L8 13.5 14 2z M6.5 9L14 2',
} as const;

export type IconName = keyof typeof ICONS;

export function Icon(props: { name: IconName }) {
  return (
    <svg class="rtm-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d={ICONS[props.name]} />
    </svg>
  );
}

export function Kbd(props: { keys: string }) {
  return (
    <span class="rtm-kbd-group">
      {props.keys.split(' ').map((k) => (
        <kbd class="rtm-kbd">{k}</kbd>
      ))}
    </span>
  );
}
