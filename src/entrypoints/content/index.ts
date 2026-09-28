import { mountApp } from '@/components/app/mount';
import { parseTestmailResponse } from '@/lib/parse';

import './style.css';

function readRawJsonText(): string | null {
  const pre = document.querySelector('pre');
  const text = (pre ?? document.body)?.textContent?.trim();
  return text || null;
}

function waitForLoad(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', () => resolve(), { once: true });
  });
}

export default defineContentScript({
  matches: ['https://api.testmail.app/api/json*'],
  runAt: 'document_start',
  cssInjectionMode: 'ui',
  async main(ctx) {
    // Hide the page before first paint, then wait for the full raw response
    // to load, so the plain JSON never flashes on screen before our UI does.
    document.documentElement.style.visibility = 'hidden';
    try {
      await waitForLoad();

      const raw = readRawJsonText();
      if (!raw) return;

      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }

      const parsed = parseTestmailResponse(data);

      // Mount first, then clean up so a failed mount still shows the raw page.
      const ui = await createShadowRootUi(ctx, {
        name: 'refined-testmailapp',
        position: 'inline',
        anchor: 'body',
        onMount: (container) => mountApp(container, parsed, raw, data),
        onRemove: (dispose) => dispose?.(),
      });
      ui.mount();

      const pre = document.querySelector('pre');
      if (pre) pre.style.display = 'none';

      // The native page can keep a dark background under our content, so we
      // reset it here.
      document.documentElement.style.colorScheme = 'light';
      document.body.style.background = '#fff';
      document.body.style.margin = '0';

      // This also removes another extension's toolbar (JSON Formatter's
      // `.json-formatter-container`).
      for (const selector of ['.json-formatter-container']) {
        document.querySelectorAll(selector).forEach((node) => node.remove());
      }
    } finally {
      document.documentElement.style.visibility = '';
    }
  },
});
