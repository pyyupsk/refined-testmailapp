import { describe, expect, it } from 'vitest';
import { mergeMore, nextPageUrl } from '../../src/lib/paginate';
import type { ParsedResult } from '../../src/lib/types';

describe('nextPageUrl', () => {
  it('sets offset and limit while preserving other params', () => {
    const url = nextPageUrl('https://api.testmail.app/api/json?apikey=x&namespace=y&offset=0&limit=10', 10, 10);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('apikey')).toBe('x');
    expect(parsed.searchParams.get('namespace')).toBe('y');
    expect(parsed.searchParams.get('offset')).toBe('10');
    expect(parsed.searchParams.get('limit')).toBe('10');
  });

  it('adds offset/limit when absent from the original URL', () => {
    const url = nextPageUrl('https://api.testmail.app/api/json?apikey=x&namespace=y', 20, 10);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('offset')).toBe('20');
  });
});

describe('mergeMore', () => {
  const base: ParsedResult = {
    ok: true,
    message: null,
    count: 15,
    limit: 10,
    offset: 0,
    emails: [{}, {}],
    hasMore: true,
  };

  it('appends emails and recomputes hasMore from the new count', () => {
    const more: ParsedResult = { ok: true, message: null, count: 15, limit: 10, offset: 10, emails: [{}], hasMore: false };
    const merged = mergeMore(base, more);
    expect(merged.emails).toHaveLength(3);
    expect(merged.offset).toBe(0);
    expect(merged.hasMore).toBe(true);
  });

  it('sets hasMore false once every email is loaded', () => {
    const more: ParsedResult = { ok: true, message: null, count: 3, limit: 10, offset: 10, emails: [{}], hasMore: false };
    const merged = mergeMore(base, more);
    expect(merged.emails).toHaveLength(3);
    expect(merged.hasMore).toBe(false);
  });
});
