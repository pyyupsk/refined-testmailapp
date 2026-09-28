import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = 'src/components';
const tsxFiles = readdirSync(ROOT, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => join(ROOT, f));

// A component is a function whose name starts with an uppercase letter.
const COMPONENT = /^(?:export\s+)?function\s+[A-Z]\w*\s*\(/gm;

describe('src/components', () => {
  it('has no files directly in the folder, only in sub-categories', () => {
    const flat = readdirSync(ROOT).filter((f) => statSync(join(ROOT, f)).isFile());
    expect(flat).toEqual([]);
  });

  it('uses lower-case file names with at most one hyphen', () => {
    const bad = tsxFiles.filter((f) => !/^[a-z]+(?:-[a-z]+)?\.tsx$/.test(basename(f)));
    expect(bad).toEqual([]);
  });

  it('has at most one component per file', () => {
    const bad = tsxFiles.filter((f) => (readFileSync(f, 'utf8').match(COMPONENT) ?? []).length > 1);
    expect(bad).toEqual([]);
  });
});
