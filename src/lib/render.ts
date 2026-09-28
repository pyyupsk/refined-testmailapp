import { buildEmailSrcdoc } from './email-html';
import { renderJsonView } from './json-view';
import { fetchMore } from './paginate';
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

function initial(label: string): string {
  return label.charAt(0).toUpperCase() || '?';
}

function renderHtmlBody(html: string): HTMLIFrameElement {
  const iframe = el('iframe', { referrerPolicy: 'no-referrer' });
  iframe.setAttribute('sandbox', ''); // no allow-scripts, no allow-same-origin
  iframe.style.cssText = 'width:100%;border:0;height:600px;';
  iframe.srcdoc = buildEmailSrcdoc(html);
  return iframe;
}

function renderDetail(email: TestmailEmail): HTMLElement {
  const container = el('div', { className: 'rtm-detail' });

  container.append(
    el('h2', { className: 'rtm-detail-subject', textContent: email.subject || '(no subject)' }),
  );

  const metaText = el('div', { className: 'rtm-meta-text' }, [
    el('b', { textContent: fromLabel(email) }),
    el('span', { textContent: `to ${toLabel(email)}${email.tag ? ` · ${email.tag}` : ''}` }),
  ]);
  container.append(
    el('div', { className: 'rtm-meta-row' }, [
      el('div', { className: 'rtm-meta-avatar', textContent: initial(fromLabel(email)) }),
      metaText,
    ]),
  );

  if (email.downloadUrl) {
    const link = el('a', {
      href: email.downloadUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      className: 'rtm-pill',
      textContent: 'Download original',
    });
    container.append(el('div', { className: 'rtm-action-row' }, [link]));
  }

  if (typeof email.spam_score === 'number') {
    container.append(el('div', { className: 'rtm-spam', textContent: `Spam score: ${email.spam_score}` }));
  }

  const frameBody = el('div', { className: 'rtm-frame-body' });
  if (email.html) {
    frameBody.append(renderHtmlBody(email.html));
  } else if (email.text) {
    frameBody.append(el('pre', { className: 'rtm-text-body', textContent: email.text }));
  } else {
    frameBody.append(el('div', { className: 'rtm-empty', textContent: '(no body)' }));
  }
  container.append(
    el('div', { className: 'rtm-frame' }, [
      el('div', { className: 'rtm-frame-label' }, [
        el('span', { className: 'rtm-frame-dot' }),
        el('span', { textContent: 'Sandboxed · no scripts, no remote loads' }),
      ]),
      frameBody,
    ]),
  );

  const attachmentCount = Array.isArray(email.attachments) ? email.attachments.length : 0;
  const hasHeaders = Array.isArray(email.headers) && email.headers.length > 0;
  if (attachmentCount > 0 || hasHeaders) {
    const details = el('details', { className: 'rtm-extras' }, [
      el('summary', { textContent: `Attachments (${attachmentCount}), headers` }),
    ]);
    if (hasHeaders) {
      details.append(el('pre', { textContent: (email.headers ?? []).map((h) => h.line).join('\n') }));
    }
    if (attachmentCount > 0) {
      // ponytail: attachment shape unknown. Dumped generically until seen live.
      details.append(el('pre', { textContent: JSON.stringify(email.attachments, null, 2) }));
    }
    container.append(details);
  }

  return container;
}

function renderRow(email: TestmailEmail, onSelect: () => void): HTMLElement {
  const from = fromLabel(email);
  const row = el('button', { className: 'rtm-row', type: 'button' }, [
    el('div', { className: 'rtm-avatar', textContent: initial(from) }),
    el('div', { className: 'rtm-row-main' }, [
      el('div', { className: 'rtm-row-top' }, [
        el('span', { className: 'rtm-row-from', textContent: from }),
        el('span', {
          className: 'rtm-row-time',
          textContent: email.timestamp
            ? new Date(email.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            : '',
        }),
      ]),
      el('div', { className: 'rtm-row-subject', textContent: email.subject || '(no subject)' }),
      ...(email.tag ? [el('span', { className: 'rtm-tag-chip', textContent: email.tag })] : []),
    ]),
  ]);
  row.addEventListener('click', onSelect);
  return row;
}

export function renderApp(initialParsed: ParsedResult, raw: string, rawData: unknown): HTMLElement {
  let state = initialParsed;

  const root = el('div', { className: 'rtm-root' });
  const countEl = el('span', { className: 'rtm-count' });
  const rawToggle = el('button', { type: 'button', className: 'rtm-btn', textContent: 'View raw JSON' });
  const header = el('div', { className: 'rtm-header' }, [
    el('div', { className: 'rtm-brand', textContent: 'Refined testmail.app' }),
    el('div', { className: 'rtm-header-right' }, [countEl, rawToggle]),
  ]);
  const body = el('div', { className: 'rtm-body' });
  const rawView = renderJsonView(rawData, raw);
  rawView.hidden = true;
  root.append(header, body, rawView);

  rawToggle.addEventListener('click', () => {
    const showingRaw = !rawView.hidden;
    rawView.hidden = showingRaw;
    body.hidden = !showingRaw;
    rawToggle.textContent = showingRaw ? 'View raw JSON' : 'View rendered inbox';
  });

  if (!state.ok) {
    body.append(el('div', { className: 'rtm-error', textContent: state.message || 'Request failed.' }));
    return root;
  }

  function updateCount() {
    const rangeStart = state.count === 0 ? 0 : state.offset + 1;
    const rangeEnd = state.offset + state.emails.length;
    countEl.textContent = `${rangeStart}–${rangeEnd} of ${state.count}`;
  }
  updateCount();

  if (state.count === 0) {
    body.append(el('div', { className: 'rtm-empty', textContent: 'No emails found for this query.' }));
    return root;
  }

  const list = el('div', { className: 'rtm-list' });
  const detailSlot = el('div', { className: 'rtm-detail-slot' });
  body.append(list, detailSlot);

  function selectEmail(index: number) {
    const email = state.emails[index];
    if (!email) return;
    list.querySelectorAll('.rtm-row').forEach((r, i) => r.classList.toggle('active', i === index));
    detailSlot.replaceChildren(renderDetail(email));
  }

  const loadMoreBtn = el('button', { type: 'button', className: 'rtm-load-more', textContent: 'Load more' });
  loadMoreBtn.addEventListener('click', async () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading…';
    try {
      const before = state.emails.length;
      state = await fetchMore(state);
      state.emails.slice(before).forEach((email, i) => {
        const index = before + i;
        list.insertBefore(renderRow(email, () => selectEmail(index)), loadMoreBtn);
      });
      updateCount();
      loadMoreBtn.hidden = !state.hasMore;
      loadMoreBtn.textContent = 'Load more';
    } catch {
      loadMoreBtn.textContent = 'Load more failed — retry';
    } finally {
      loadMoreBtn.disabled = false;
    }
  });

  state.emails.forEach((email, index) => list.append(renderRow(email, () => selectEmail(index))));
  list.append(loadMoreBtn);
  loadMoreBtn.hidden = !state.hasMore;

  selectEmail(0);

  return root;
}
