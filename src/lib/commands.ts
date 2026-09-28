export type CommandId =
  | 'next'
  | 'prev'
  | 'open'
  | 'back'
  | 'page-down'
  | 'page-up'
  | 'copy'
  | 'copy-address'
  | 'toggle-meta'
  | 'toggle-done'
  | 'toggle-read'
  | 'search'
  | 'palette'
  | 'tab-html'
  | 'tab-text'
  | 'tab-raw'
  | 'view-inbox'
  | 'view-done'
  | 'raw-json'
  | 'load-more'
  | 'download';

export interface Command {
  id: CommandId;
  label: string;
  keys?: string;
}

export const COMMANDS: Command[] = [
  { id: 'copy', label: 'Copy code or first link', keys: 'C' },
  { id: 'copy-address', label: 'Copy recipient address' },
  { id: 'toggle-done', label: 'Mark as done / move back to inbox', keys: 'E' },
  { id: 'toggle-read', label: 'Toggle read / unread', keys: 'U' },
  { id: 'toggle-meta', label: 'Show technical metadata', keys: 'I' },
  { id: 'tab-html', label: 'Show HTML body', keys: '1' },
  { id: 'tab-text', label: 'Show plain text', keys: '2' },
  { id: 'tab-raw', label: 'Show raw source', keys: '3' },
  { id: 'search', label: 'Search emails', keys: '/' },
  { id: 'next', label: 'Next email', keys: 'J' },
  { id: 'prev', label: 'Previous email', keys: 'K' },
  { id: 'view-inbox', label: 'Go to inbox', keys: 'G I' },
  { id: 'view-done', label: 'Go to done', keys: 'G D' },
  { id: 'load-more', label: 'Load more emails' },
  { id: 'download', label: 'Download original .eml' },
  { id: 'raw-json', label: 'Toggle raw JSON response' },
];

export interface KeyInput {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

// `pendingG`: the previous key was a lone "g".
export function keyToCommand(e: KeyInput, pendingG = false): CommandId | 'g' | null {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') return 'palette';
  if (e.metaKey || e.ctrlKey || e.altKey) return null;

  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (pendingG) {
    if (key === 'i') return 'view-inbox';
    if (key === 'd') return 'view-done';
    return null;
  }

  switch (key) {
    case 'j':
    case 'ArrowDown':
      return 'next';
    case 'k':
    case 'ArrowUp':
      return 'prev';
    case 'o':
    case 'Enter':
      return 'open';
    case 'Escape':
      return 'back';
    case ' ':
      return e.shiftKey ? 'page-up' : 'page-down';
    case 'c':
      return 'copy';
    case 'i':
      return 'toggle-meta';
    case 'e':
      return 'toggle-done';
    case 'u':
      return 'toggle-read';
    case '/':
      return 'search';
    case '1':
      return 'tab-html';
    case '2':
      return 'tab-text';
    case '3':
      return 'tab-raw';
    case 'g':
      return 'g';
    default:
      return null;
  }
}

export function filterCommands(query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMANDS;
  return COMMANDS.filter((c) => q.split(/\s+/).every((t) => c.label.toLowerCase().includes(t)));
}
