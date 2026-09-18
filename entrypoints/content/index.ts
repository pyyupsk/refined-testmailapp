import { parseTestmailResponse } from '../../lib/parse';
import { renderApp } from '../../lib/render';
import './style.css';

function readRawJsonText(): string | null {
  const pre = document.querySelector('pre');
  const text = (pre ?? document.body)?.textContent?.trim();
  return text || null;
}

export default defineContentScript({
  matches: ['https://api.testmail.app/api/json*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx) {
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
      onMount: (container) => container.append(renderApp(parsed, raw)),
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
  },
});
