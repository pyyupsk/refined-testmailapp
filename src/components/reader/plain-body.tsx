import { createMemo, Show } from 'solid-js';

import { splitSignature } from '@/lib/format';

export function PlainBody(props: { text: string }) {
  const parts = createMemo(() => splitSignature(props.text));
  return (
    <div class="rtm-plain">
      <pre class="rtm-plain-body">{parts().body}</pre>
      <Show when={parts().signature}>
        <pre class="rtm-plain-sig">{parts().signature}</pre>
      </Show>
    </div>
  );
}
