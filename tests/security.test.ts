import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// oxlint's no-restricted-properties catches `el.innerHTML = x`, but not the
// JSX attribute form `<div innerHTML={x} />`. This covers both.
const RAW_HTML = /\b(innerHTML|outerHTML|insertAdjacentHTML)\b/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => join(dir, f));
}

describe('source code', () => {
  it('never writes raw HTML into the page', () => {
    const offenders = sourceFiles('src').filter((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => RAW_HTML.test(line) && !line.trim().startsWith('//')),
    );
    expect(offenders).toEqual([]);
  });
});
