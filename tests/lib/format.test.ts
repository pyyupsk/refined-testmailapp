import { describe, expect, it } from 'vitest';

import {
  authStatus,
  copyTarget,
  matchesQuery,
  relativeTime,
  senderName,
  snippet,
  splitSignature,
} from '@/lib/format';

const NOW = Date.UTC(2026, 8, 28, 12, 0, 0);

describe('relativeTime', () => {
  it('shows now, minutes, and hours for recent mail', () => {
    expect(relativeTime(NOW - 10_000, NOW)).toBe('now');
    expect(relativeTime(NOW - 5 * 60_000, NOW)).toBe('5m');
    expect(relativeTime(NOW - 3 * 3_600_000, NOW)).toBe('3h');
  });

  it('shows Yesterday, then a weekday, then a date', () => {
    expect(relativeTime(NOW - 30 * 3_600_000, NOW)).toBe('Yesterday');
    expect(relativeTime(NOW - 3 * 86_400_000, NOW)).toMatch(/^[A-Z][a-z]{2}$/);
    expect(relativeTime(NOW - 20 * 86_400_000, NOW)).toMatch(/^Sep \d+$/);
    expect(relativeTime(Date.UTC(2025, 0, 5), NOW)).toContain('2025');
  });
});

describe('senderName', () => {
  it('prefers the parsed name, then address, then raw fields', () => {
    expect(senderName({ from_parsed: [{ name: 'Ann', address: 'a@x.io' }] })).toBe('Ann');
    expect(senderName({ from_parsed: [{ name: '', address: 'a@x.io' }] })).toBe('a@x.io');
    expect(senderName({ envelope_from: 'e@x.io' })).toBe('e@x.io');
  });
});

describe('snippet', () => {
  it('collapses whitespace and truncates', () => {
    expect(snippet({ text: 'Hi\n\n  there' })).toBe('Hi there');
    expect(snippet({ text: 'a'.repeat(200) }, 10)).toBe(`${'a'.repeat(9)}…`);
  });
});

describe('authStatus', () => {
  it('maps SPF and DKIM values', () => {
    expect(authStatus('pass')).toBe('pass');
    expect(authStatus('SoftFail')).toBe('fail');
    expect(authStatus('none')).toBe('none');
    expect(authStatus(undefined)).toBe('none');
    expect(authStatus('neutral')).toBe('neutral');
  });
});

describe('copyTarget', () => {
  it('finds a verification code before a link', () => {
    expect(copyTarget({ text: 'Your verification code is 481203. https://x.io/a' })).toEqual({
      kind: 'code',
      value: '481203',
    });
  });

  it('falls back to the first link, without trailing punctuation', () => {
    expect(copyTarget({ text: 'Track it (https://example.com/t/1).' })).toEqual({
      kind: 'link',
      value: 'https://example.com/t/1',
    });
  });

  it('returns null when there is nothing to copy', () => {
    expect(copyTarget({ text: 'Hello' })).toBeNull();
  });
});

describe('splitSignature', () => {
  it('splits at the "-- " separator', () => {
    expect(splitSignature('Body\n-- \nAnn')).toEqual({ body: 'Body', signature: '-- \nAnn' });
    expect(splitSignature('No signature')).toEqual({ body: 'No signature', signature: '' });
  });
});

describe('matchesQuery', () => {
  const email = { subject: 'Your order shipped', tag: 'billing', text: 'Tracking inside' };

  it('matches every term across fields, case-insensitively', () => {
    expect(matchesQuery(email, '')).toBe(true);
    expect(matchesQuery(email, 'ORDER billing')).toBe(true);
    expect(matchesQuery(email, 'order refund')).toBe(false);
  });
});
