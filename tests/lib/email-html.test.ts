import { describe, expect, it } from 'vitest';
import { buildEmailSrcdoc } from '@/lib/email-html';

describe('buildEmailSrcdoc', () => {
  it('prepends a CSP meta tag that blocks remote resources and form submission', () => {
    const out = buildEmailSrcdoc('<p>hi</p>');
    expect(out).toContain('Content-Security-Policy');
    expect(out).toContain("default-src 'none'");
    expect(out).toContain("form-action 'none'");
    expect(out).toContain("base-uri 'none'");
    expect(out).toContain('name="color-scheme" content="light"');
  });

  it('leaves the original email HTML untouched, no stripping/rewriting', () => {
    const html = '<script>alert(1)</script><img src="https://example.invalid/tracker">';
    const out = buildEmailSrcdoc(html);
    expect(out).toContain(html);
  });
});
