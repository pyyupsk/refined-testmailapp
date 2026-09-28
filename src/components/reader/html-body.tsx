import { onCleanup, onMount } from 'solid-js';

import { buildEmailSrcdoc } from '@/lib/email-html';
import { sanitizeEmailHtml } from '@/lib/sanitize';

export function HtmlBody(props: { html: string }) {
  let frame: HTMLIFrameElement | undefined;
  const fit = () => {
    const scroller = frame?.closest('.rtm-reader-scroll');
    if (frame && scroller) frame.style.height = `${Math.max(420, scroller.clientHeight - 32)}px`;
  };
  onMount(() => {
    requestAnimationFrame(fit);
    window.addEventListener('resize', fit);
  });
  onCleanup(() => window.removeEventListener('resize', fit));

  return (
    <div class="rtm-frame">
      <iframe
        ref={(el) => (frame = el)}
        sandbox=""
        referrerPolicy="no-referrer"
        title="Email body"
        srcdoc={buildEmailSrcdoc(sanitizeEmailHtml(props.html))}
      />
      <p class="rtm-frame-note">Sanitized and sandboxed · no scripts, forms, or remote images</p>
    </div>
  );
}
