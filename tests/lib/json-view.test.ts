// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderJsonView } from '@/lib/json-view';

function links(data: unknown): string[] {
  const root = renderJsonView(data, JSON.stringify(data));
  return [...root.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
}

describe('renderJsonView links', () => {
  it('links a URL inside a longer string, without trailing punctuation', () => {
    expect(links({ text: 'see https://example.com/track/TH123). thanks' })).toEqual([
      'https://example.com/track/TH123',
    ]);
  });

  it('links email addresses as mailto, including angle-bracketed ones', () => {
    expect(links({ from: 'Name <contact@fasu.dev>' })).toEqual(['mailto:contact@fasu.dev']);
  });

  it('does not link a messageId even though it looks like an email', () => {
    expect(links({ messageId: '<1a0e352250a.220fe6@fasu.dev>' })).toEqual([]);
  });

  it('keeps JSON escaping for text around links', () => {
    const root = renderJsonView({ t: 'a "q" https://x.io end' }, '');
    expect(root.querySelector('.rtm-j-str')?.textContent).toBe('"a \\"q\\" https://x.io end"');
  });
});
