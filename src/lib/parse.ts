import type { ParsedResult, TestmailEmail } from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function normalizeEmail(value: unknown): TestmailEmail {
  const obj = asRecord(value) ?? {};
  return obj as TestmailEmail;
}

export function parseTestmailResponse(json: unknown): ParsedResult {
  const obj = asRecord(json) ?? {};
  const ok = obj.result === 'success';
  const emails = Array.isArray(obj.emails) ? obj.emails.map(normalizeEmail) : [];
  const count = typeof obj.count === 'number' ? obj.count : emails.length;
  const limit = typeof obj.limit === 'number' ? obj.limit : emails.length;
  const offset = typeof obj.offset === 'number' ? obj.offset : 0;

  return {
    ok,
    message: typeof obj.message === 'string' ? obj.message : null,
    count,
    limit,
    offset,
    emails,
    hasMore: offset + emails.length < count,
  };
}
