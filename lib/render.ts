import { buildEmailSrcdoc } from './email-html';
import type { ParsedResult, TestmailEmail } from './types';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<HTMLElementTagNameMap[K]>,
  children?: Node[],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, props);
  if (children) node.append(...children);
  return node;
}

function addressLabel(
  parsedField: TestmailEmail['from_parsed'],
  rawField: string | undefined,
  fallback: string,
): string {
  const parsed = Array.isArray(parsedField) ? parsedField[0] : parsedField;
  return parsed?.name || parsed?.address || rawField || fallback;
}

function fromLabel(email: TestmailEmail): string {
  return addressLabel(email.from_parsed, email.from, '(unknown sender)');
}

function toLabel(email: TestmailEmail): string {
  return addressLabel(email.to_parsed, email.to, '(unknown recipient)');
}

function renderHtmlBody(html: string): HTMLIFrameElement {
  const iframe = el('iframe', {
    referrerPolicy: 'no-referrer',
  });
  iframe.setAttribute('sandbox', ''); // no allow-scripts, no allow-same-origin
  iframe.style.cssText = 'width:100%;border:0;height:600px;';
  iframe.srcdoc = buildEmailSrcdoc(html);
  return iframe;
}

function renderDetail(email: TestmailEmail): HTMLElement {
  const container = el('div', { className: 'rtm-detail' });

  const subject = el('h2', { textContent: email.subject || '(no subject)' });
  const from = el('div', { className: 'rtm-detail-from', textContent: `From: ${fromLabel(email)}` });
  const to = el('div', { className: 'rtm-detail-to', textContent: `To: ${toLabel(email)}` });
  container.append(subject, from, to);

  if (email.tag) container.append(el('div', { className: 'rtm-tag', textContent: `tag: ${email.tag}` }));

  if (email.downloadUrl) {
    const link = el('a', {
      href: email.downloadUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      textContent: 'Download original (.eml)',
    });
    container.append(el('div', { className: 'rtm-download' }, [link]));
  }

  if (typeof email.spam_score === 'number') {
    container.append(el('div', { className: 'rtm-spam', textContent: `spam score: ${email.spam_score}` }));
  }

  if (Array.isArray(email.headers) && email.headers.length > 0) {
    const table = el('pre', { className: 'rtm-headers' });
    table.textContent = email.headers.map((h) => h.line).join('\n');
    container.append(table);
  }

  if (Array.isArray(email.attachments)) {
    // ponytail: attachment shape unknown. Dumped generically until seen live.
    const dump = el('pre', { className: 'rtm-attachments' });
    dump.textContent = JSON.stringify(email.attachments, null, 2);
    container.append(el('div', { textContent: 'attachments (unconfirmed shape):' }), dump);
  }

  if (email.html) {
    container.append(renderHtmlBody(email.html));
  } else if (email.text) {
    container.append(el('pre', { className: 'rtm-text-body', textContent: email.text }));
  } else {
    container.append(el('div', { className: 'rtm-empty', textContent: '(no body)' }));
  }

  return container;
}

function renderList(emails: TestmailEmail[], onSelect: (index: number) => void): HTMLElement {
  const list = el('div', { className: 'rtm-list' });
  emails.forEach((email, index) => {
    const row = el('button', { className: 'rtm-row', type: 'button' });
    row.append(
      el('span', { className: 'rtm-row-from', textContent: fromLabel(email) }),
      el('span', { className: 'rtm-row-subject', textContent: email.subject || '(no subject)' }),
      el('span', {
        className: 'rtm-row-time',
        textContent: email.timestamp ? new Date(email.timestamp).toLocaleString() : '',
      }),
    );
    row.addEventListener('click', () => onSelect(index));
    list.append(row);
  });
  return list;
}

export function renderApp(parsed: ParsedResult, raw: string): HTMLElement {
  const root = el('div', { className: 'rtm-root' });
  const header = el('div', { className: 'rtm-header' });
  const body = el('div', { className: 'rtm-body' });
  root.append(header, body);

  const rawView = el('pre', { className: 'rtm-raw', textContent: raw, hidden: true });
  root.append(rawView);

  const toggle = el('button', { type: 'button', textContent: 'View raw JSON' });
  toggle.addEventListener('click', () => {
    const showingRaw = !rawView.hidden;
    rawView.hidden = showingRaw;
    body.hidden = !showingRaw;
    toggle.textContent = showingRaw ? 'View raw JSON' : 'View rendered inbox';
  });

  if (!parsed.ok) {
    header.append(el('div', { className: 'rtm-error', textContent: parsed.message || 'Request failed.' }));
    header.append(toggle);
    return root;
  }

  const rangeStart = parsed.count === 0 ? 0 : parsed.offset + 1;
  const rangeEnd = parsed.offset + parsed.emails.length;
  header.append(
    el('span', { textContent: `Showing ${rangeStart}–${rangeEnd} of ${parsed.count}` }),
    toggle,
  );

  if (parsed.count === 0) {
    body.append(el('div', { className: 'rtm-empty', textContent: 'No emails found for this query.' }));
    return root;
  }

  const list = renderList(parsed.emails, (index) => {
    const email = parsed.emails[index];
    if (!email) return;
    const existingDetail = body.querySelector('.rtm-detail');
    existingDetail?.remove();
    body.append(renderDetail(email));
  });
  body.append(list);

  return root;
}
