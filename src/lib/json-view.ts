// Matches http(s) URLs and bare email addresses anywhere inside a string.
// Trailing punctuation is excluded so "https://x.com)." links to https://x.com.
const LINK_RE = /(https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:])|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<HTMLElementTagNameMap[K]>,
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (children) node.append(...children);
  return node;
}

function span(cls: string, text: string): HTMLSpanElement {
  return el('span', { className: cls, textContent: text });
}

function link(href: string, text: string): HTMLAnchorElement {
  return el('a', { href, target: '_blank', rel: 'noopener noreferrer', textContent: text });
}

// Builds the JSON-escaped string with links inlined. Escaping is applied to
// the non-link segments only, so a URL stays clickable as written.
function renderString(value: string, key: string | number | undefined): Node {
  const out = el('span', { className: 'rtm-j-str' }, ['"']);
  // Message-IDs look like emails but have no destination; never link them.
  const linkable = key !== 'messageId';
  let last = 0;
  for (const m of linkable ? value.matchAll(LINK_RE) : []) {
    const [text, url, email] = m;
    out.append(JSON.stringify(value.slice(last, m.index)).slice(1, -1));
    out.append(link(url ? url : `mailto:${email}`, text));
    last = m.index + text.length;
  }
  out.append(JSON.stringify(value.slice(last)).slice(1, -1), '"');
  return out;
}

function renderPrimitive(value: unknown, key: string | number | undefined): Node {
  if (value === null) return span('rtm-j-null', 'null');
  if (typeof value === 'boolean') return span('rtm-j-bool', String(value));
  if (typeof value === 'number') return span('rtm-j-num', String(value));
  return renderString(String(value), key);
}

function renderContainer(value: object, depth: number): Node {
  const isArray = Array.isArray(value);
  const entries = isArray ? (value as unknown[]).map((v, i) => [i, v] as const) : Object.entries(value);
  const [open, close] = isArray ? ['[', ']'] : ['{', '}'];

  if (entries.length === 0) return span('rtm-j-bracket', open + close);

  const details = el('details', { className: 'rtm-j-block', open: depth < 3 });
  details.append(
    el('summary', { className: 'rtm-j-summary' }, [
      span('rtm-j-arrow', ''),
      span('rtm-j-bracket', open),
      span('rtm-j-count', `${entries.length} ${isArray ? 'items' : 'keys'}`),
      span('rtm-j-bracket rtm-j-bracket-close', close),
    ]),
  );

  const body = el('div', { className: 'rtm-j-body' });
  entries.forEach(([key, val], i) => {
    const line = el('div', { className: 'rtm-j-line' });
    if (!isArray) {
      line.append(span('rtm-j-key', JSON.stringify(key)), span('rtm-j-punct', ': '));
    }
    line.append(renderValue(val, depth + 1, key));
    if (i < entries.length - 1) line.append(span('rtm-j-punct', ','));
    body.append(line);
  });
  details.append(body, span('rtm-j-bracket', close));
  return details;
}

function renderValue(value: unknown, depth: number, key?: string | number): Node {
  return typeof value === 'object' && value !== null
    ? renderContainer(value, depth)
    : renderPrimitive(value, key);
}

export function renderJsonView(data: unknown, raw: string): HTMLElement {
  const copyBtn = el('button', { type: 'button', className: 'rtm-btn rtm-j-copy', textContent: 'Copy JSON' });
  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(raw);
    copyBtn.textContent = 'Copied';
    setTimeout(() => (copyBtn.textContent = 'Copy JSON'), 1500);
  });

  return el('div', { className: 'rtm-json' }, [
    el('div', { className: 'rtm-j-toolbar' }, [copyBtn]),
    el('div', { className: 'rtm-j-tree' }, [renderValue(data, 0)]),
  ]);
}
