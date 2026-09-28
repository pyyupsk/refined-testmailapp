import type { TestmailAddress, TestmailEmail } from './types';

function firstParsed(field: TestmailAddress | TestmailAddress[] | undefined) {
  return Array.isArray(field) ? field[0] : field;
}

export function senderName(email: TestmailEmail): string {
  const parsed = firstParsed(email.from_parsed);
  return parsed?.name || parsed?.address || email.from || email.envelope_from || 'Unknown sender';
}

export function senderAddress(email: TestmailEmail): string {
  return firstParsed(email.from_parsed)?.address || email.envelope_from || email.from || '';
}

export function recipientAddress(email: TestmailEmail): string {
  return firstParsed(email.to_parsed)?.address || email.envelope_to || email.to || '';
}

export function emailTime(email: TestmailEmail): number | undefined {
  return email.timestamp ?? email.date;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(ts: number, now: number): string {
  const diff = now - ts;
  if (diff < MINUTE) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 2 * DAY) return 'Yesterday';
  const date = new Date(ts);
  if (diff < 7 * DAY) return date.toLocaleDateString('en-US', { weekday: 'short' });
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function snippet(email: TestmailEmail, max = 140): string {
  const source = email.text ?? '';
  const flat = source.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export type AuthStatus = 'pass' | 'fail' | 'neutral' | 'none';

export function authStatus(value: string | undefined): AuthStatus {
  const v = (value ?? '').trim().toLowerCase();
  if (v === 'pass') return 'pass';
  if (v === 'fail' || v === 'softfail' || v === 'permerror' || v === 'temperror') return 'fail';
  if (v === '' || v === 'none') return 'none';
  return 'neutral';
}

const CODE_RE = /\b(?:code|otp|pin|passcode|verification)\b[^0-9]{0,40}(\d{4,8})\b/i;
const URL_RE = /https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:]/;

// The C shortcut: a verification code, else the first link.
export function copyTarget(email: TestmailEmail): { kind: 'code' | 'link'; value: string } | null {
  const text = email.text ?? '';
  const code = text.match(CODE_RE)?.[1] ?? email.subject?.match(CODE_RE)?.[1];
  if (code) return { kind: 'code', value: code };
  const url = text.match(URL_RE)?.[0];
  if (url) return { kind: 'link', value: url };
  return null;
}

// RFC 3676 signature separator.
export function splitSignature(text: string): { body: string; signature: string } {
  const match = /\n-- ?\n/.exec(text);
  if (!match) return { body: text, signature: '' };
  return { body: text.slice(0, match.index), signature: text.slice(match.index + 1) };
}

export function matchesQuery(email: TestmailEmail, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    senderName(email),
    senderAddress(email),
    recipientAddress(email),
    email.subject,
    email.tag,
    email.text,
  ]
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((term) => haystack.includes(term));
}
