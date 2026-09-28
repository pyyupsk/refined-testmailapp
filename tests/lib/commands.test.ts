import { describe, expect, it } from 'vitest';

import { filterCommands, keyToCommand, type KeyInput } from '@/lib/commands';

function key(k: string, mods: Partial<KeyInput> = {}): KeyInput {
  return { key: k, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods };
}

describe('keyToCommand', () => {
  it('maps navigation keys', () => {
    expect(keyToCommand(key('j'))).toBe('next');
    expect(keyToCommand(key('ArrowUp'))).toBe('prev');
    expect(keyToCommand(key('Enter'))).toBe('open');
    expect(keyToCommand(key(' '))).toBe('page-down');
    expect(keyToCommand(key(' ', { shiftKey: true }))).toBe('page-up');
  });

  it('maps action keys regardless of case', () => {
    expect(keyToCommand(key('C'))).toBe('copy');
    expect(keyToCommand(key('i'))).toBe('toggle-meta');
    expect(keyToCommand(key('e'))).toBe('toggle-done');
    expect(keyToCommand(key('u'))).toBe('toggle-read');
  });

  it('opens the command bar on Cmd+K and Ctrl+K only', () => {
    expect(keyToCommand(key('k', { metaKey: true }))).toBe('palette');
    expect(keyToCommand(key('K', { ctrlKey: true }))).toBe('palette');
    expect(keyToCommand(key('c', { metaKey: true }))).toBeNull();
  });

  it('handles the g-prefixed view shortcuts', () => {
    expect(keyToCommand(key('g'))).toBe('g');
    expect(keyToCommand(key('d'), true)).toBe('view-done');
    expect(keyToCommand(key('x'), true)).toBeNull();
  });
});

describe('filterCommands', () => {
  it('returns every command for an empty query and filters by all terms', () => {
    expect(filterCommands('').length).toBeGreaterThan(5);
    expect(filterCommands('raw source').map((c) => c.id)).toEqual(['tab-raw']);
  });
});
