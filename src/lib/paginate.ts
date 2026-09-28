import { parseTestmailResponse } from './parse';
import type { ParsedResult } from './types';

export function nextPageUrl(href: string, offset: number, limit: number): string {
  const url = new URL(href);
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('limit', String(limit));
  return url.toString();
}

export function mergeMore(base: ParsedResult, more: ParsedResult): ParsedResult {
  const emails = [...base.emails, ...more.emails];
  return {
    ok: base.ok,
    message: base.message,
    count: more.count,
    limit: base.limit,
    offset: base.offset,
    emails,
    hasMore: base.offset + emails.length < more.count,
  };
}

// Same-origin request to api.testmail.app (the page we're already on), so it
// needs no host_permissions.
export async function fetchMore(base: ParsedResult): Promise<ParsedResult> {
  const offset = base.offset + base.emails.length;
  const url = nextPageUrl(location.href, offset, base.limit || 10);
  const res = await fetch(url);
  const json = await res.json();
  return mergeMore(base, parseTestmailResponse(json));
}
