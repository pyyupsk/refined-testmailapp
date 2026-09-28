// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { sanitizeEmailHtml } from '@/lib/sanitize';

function parse(html: string): Document {
  return new DOMParser().parseFromString(sanitizeEmailHtml(html), 'text/html');
}

describe('sanitizeEmailHtml', () => {
  it('removes scripts, forms, frames, and meta refresh', () => {
    const doc = parse(
      '<p>Hi</p><script>alert(1)</script><form action="https://x.io"><input></form>' +
        '<iframe src="https://x.io"></iframe><meta http-equiv="refresh" content="0;url=https://x.io">',
    );
    expect(doc.querySelector('script, form, input, iframe, meta')).toBeNull();
    expect(doc.body.textContent).toContain('Hi');
  });

  it('strips event handlers and javascript: URLs but keeps normal links', () => {
    const doc = parse(
      '<a href="javascript:alert(1)" onclick="x()">bad</a><a href="https://ok.io">good</a>',
    );
    const [bad, good] = [...doc.querySelectorAll('a')];
    expect(bad?.hasAttribute('href')).toBe(false);
    expect(bad?.hasAttribute('onclick')).toBe(false);
    expect(good?.getAttribute('href')).toBe('https://ok.io');
  });

  it('adds base styles first, including signature de-emphasis', () => {
    const doc = parse('<head><style>body{color:red}</style></head><p>x</p>');
    const styles = [...doc.querySelectorAll('style')].map((s) => s.textContent ?? '');
    expect(styles[0]).toContain('.gmail_signature');
    expect(styles[1]).toBe('body{color:red}');
  });
});
