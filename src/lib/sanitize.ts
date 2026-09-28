// First layer only. The sandboxed iframe and CSP stay the real boundary.
const REMOVE = [
  'script',
  'noscript',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'base',
  'link',
  'meta',
  'template',
  'portal',
].join(',');

const URL_ATTRS = new Set([
  'href',
  'src',
  'action',
  'formaction',
  'xlink:href',
  'background',
  'poster',
]);
const UNSAFE_URL = /^\s*(?:javascript|vbscript|data:text\/html)/i;

const SIGNATURE_SELECTORS = [
  '.gmail_signature',
  '[data-smartmail="gmail_signature"]',
  '.zmail_signature_below',
  '#Signature',
  '#appendonsend ~ *',
  '.moz-signature',
  '[id^="signature" i]',
  '[class*="signature" i]',
].join(',');

const BASE_STYLE = `
  body { margin: 24px; font: 15px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #1f2328; overflow-wrap: anywhere; }
  img { max-width: 100%; height: auto; }
  pre { white-space: pre-wrap; }
  ${SIGNATURE_SELECTORS} { opacity: 0.55; font-size: 0.9em; }
`;

export function sanitizeEmailHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  for (const node of doc.querySelectorAll(REMOVE)) node.remove();

  for (const node of doc.querySelectorAll('*')) {
    // A snapshot, so removing while looping is safe.
    for (const attrName of node.getAttributeNames()) {
      const name = attrName.toLowerCase();
      const unsafeUrl = URL_ATTRS.has(name) && UNSAFE_URL.test(node.getAttribute(attrName) ?? '');
      if (name.startsWith('on') || name === 'srcdoc' || unsafeUrl) node.removeAttribute(attrName);
    }
  }

  // First, so the email's own CSS still wins.
  const style = doc.createElement('style');
  style.textContent = BASE_STYLE;
  doc.head.prepend(style);

  return `<!doctype html>${new XMLSerializer().serializeToString(doc.documentElement)}`;
}
