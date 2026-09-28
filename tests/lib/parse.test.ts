import { describe, expect, it } from 'vitest';
import { parseTestmailResponse } from '../../src/lib/parse';
import emptyFixture from '../fixtures/empty.json';
import failureFixture from '../fixtures/failure.json';
import malformedFixture from '../fixtures/malformed.json';
import partialFieldsFixture from '../fixtures/partial-fields.json';
import successFixture from '../fixtures/success.json';

describe('parseTestmailResponse against sanitized fixtures', () => {
  it('parses a success response with two emails', () => {
    const r = parseTestmailResponse(successFixture);
    expect(r.ok).toBe(true);
    expect(r.emails).toHaveLength(2);
    expect(r.emails[0]?.subject).toBe('Welcome');
    expect(r.hasMore).toBe(false);
  });

  it('parses an empty inbox', () => {
    const r = parseTestmailResponse(emptyFixture);
    expect(r.ok).toBe(true);
    expect(r.count).toBe(0);
    expect(r.emails).toEqual([]);
  });

  it('parses a failure response', () => {
    const r = parseTestmailResponse(failureFixture);
    expect(r.ok).toBe(false);
    expect(r.message).toBe('Invalid apikey.');
  });

  it('does not throw on a malformed (non-envelope) response', () => {
    expect(() => parseTestmailResponse(malformedFixture)).not.toThrow();
  });

  // A real sample had no from, from_parsed, html, messageId, or to_parsed fields.
  it('parses a real response with several fields absent', () => {
    const r = parseTestmailResponse(partialFieldsFixture);
    expect(r.ok).toBe(true);
    const [email] = r.emails;
    expect(email?.from).toBeUndefined();
    expect(email?.html).toBeUndefined();
    expect(email?.to).toBe('l33ut.test@inbox.testmail.app');
    expect(email?.text).toContain('l33ut.test@inbox.testmail.app');
    expect(email?.downloadUrl).toContain('.eml');
  });
});

describe('parseTestmailResponse', () => {
  it('maps a success response and computes hasMore', () => {
    const r = parseTestmailResponse({
      result: 'success',
      message: null,
      count: 5,
      limit: 2,
      offset: 0,
      emails: [
        { from: 'a@x.com', timestamp: 1 },
        { from: 'b@x.com', timestamp: 2 },
      ],
    });
    expect(r.ok).toBe(true);
    expect(r.hasMore).toBe(true);
  });

  it('treats result:"fail" as not ok', () => {
    const r = parseTestmailResponse({ result: 'fail', message: 'bad apikey' });
    expect(r.ok).toBe(false);
    expect(r.emails).toEqual([]);
    expect(r.message).toBe('bad apikey');
  });

  it('handles missing optional fields without throwing', () => {
    const r = parseTestmailResponse({
      result: 'success',
      count: 1,
      limit: 1,
      offset: 0,
      emails: [{ from: 'a@x.com', timestamp: 1 }],
    });
    expect(r.emails[0]?.headers).toBeUndefined();
  });

  it('hasMore is false when offset + emails reaches count', () => {
    const r = parseTestmailResponse({ result: 'success', count: 2, limit: 10, offset: 0, emails: [{}, {}] });
    expect(r.hasMore).toBe(false);
  });

  it('does not throw on malformed/non-object input', () => {
    expect(() => parseTestmailResponse(null)).not.toThrow();
    expect(() => parseTestmailResponse('not an object')).not.toThrow();
    expect(parseTestmailResponse(null).ok).toBe(false);
  });

  it('ignores non-object entries inside emails', () => {
    const r = parseTestmailResponse({ result: 'success', count: 1, limit: 1, offset: 0, emails: ['garbage'] });
    expect(r.emails).toEqual([{}]);
  });
});
