export function Kbd(props: { keys: string }) {
  return (
    <span class="rtm-kbd-group" aria-hidden="true">
      {props.keys.split(' ').map((k) => (
        <kbd class="rtm-kbd">{k}</kbd>
      ))}
    </span>
  );
}
