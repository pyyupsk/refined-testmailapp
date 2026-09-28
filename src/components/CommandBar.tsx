import { createEffect, createMemo, createSignal, For, onMount, Show } from 'solid-js';

import { type CommandId, filterCommands } from '@/lib/commands';

import { Kbd } from './Icon';

interface CommandBarProps {
  onRun: (id: CommandId) => void;
  onClose: () => void;
}

export function CommandBar(props: CommandBarProps) {
  const [query, setQuery] = createSignal('');
  const [active, setActive] = createSignal(0);
  const commands = createMemo(() => filterCommands(query()));
  let input: HTMLInputElement | undefined;
  let list: HTMLDivElement | undefined;

  onMount(() => input?.focus());

  createEffect(() => {
    active();
    list?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
  });

  const run = (id: CommandId) => {
    props.onClose();
    props.onRun(id);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const count = commands().length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (count) setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + count) % count);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = commands()[active()];
      if (c) run(c.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      props.onClose();
    }
    e.stopPropagation();
  };

  return (
    <div
      class="rtm-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div class="rtm-palette" role="dialog" aria-modal="true" aria-label="Command bar">
        <input
          ref={(el) => (input = el)}
          type="text"
          class="rtm-palette-input"
          placeholder="Type a command"
          aria-label="Command"
          spellcheck={false}
          value={query()}
          onInput={(e) => {
            setQuery(e.currentTarget.value);
            setActive(0);
          }}
          onKeyDown={handleKeyDown}
        />
        <div ref={(el) => (list = el)} class="rtm-palette-list" role="listbox">
          <Show
            when={commands().length > 0}
            fallback={<p class="rtm-palette-empty">No matching command</p>}
          >
            <For each={commands()}>
              {(c, i) => (
                <div
                  class="rtm-palette-item"
                  classList={{ 'is-active': i() === active() }}
                  role="option"
                  aria-selected={i() === active()}
                  onMouseMove={() => setActive(i())}
                  onClick={() => run(c.id)}
                >
                  <span>{c.label}</span>
                  <Show when={c.keys}>{(keys) => <Kbd keys={keys()} />}</Show>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
}
