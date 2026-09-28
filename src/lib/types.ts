export interface TestmailAddress {
  address: string;
  name: string;
}

// We confirmed this from a live response, not the docs. The attachment shape
// is still unknown. We have only seen it empty.
export interface TestmailEmail {
  id?: string;
  from?: string;
  from_parsed?: TestmailAddress | TestmailAddress[];
  to?: string;
  to_parsed?: TestmailAddress | TestmailAddress[];
  cc?: string;
  cc_parsed?: TestmailAddress | TestmailAddress[];
  envelope_from?: string;
  envelope_to?: string;
  subject?: string;
  text?: string;
  html?: string;
  timestamp?: number;
  date?: number;
  tag?: string;
  namespace?: string;
  messageId?: string;
  downloadUrl?: string;
  dkim?: string;
  SPF?: string;
  sender_ip?: string;
  attachments?: unknown[];
  headers?: { line: string; key: string }[];
  spam_score?: number;
  spam_report?: string;
  [key: string]: unknown;
}

export interface ParsedResult {
  ok: boolean;
  message: string | null;
  count: number;
  limit: number;
  offset: number;
  emails: TestmailEmail[];
  hasMore: boolean;
}
