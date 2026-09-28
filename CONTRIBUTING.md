# Contributing

Thank you for helping. Open an issue before a large change, so the approach is agreed first.

## Setup

You need [Bun](https://bun.sh) and Node.js 22.12 or newer.

```bash
bun install
bun run dev            # Chrome with hot reload
bun run dev:firefox
```

The extension activates on `https://api.testmail.app/api/json` pages. You need a testmail.app API key and a namespace to see real data. Sample responses are in `tests/lib/fixtures/`.

## Checks

Run these before you open a pull request. CI runs the same checks.

```bash
bun run format:check
bun run lint
bun run typecheck
bun run test           # not `bun test`, which skips Vitest
```

## Project layout

- `src/components/<category>/`: Solid components, one component per file. File names are lower case with at most one hyphen, for example `email-list.tsx`.
- `src/lib/`: pure logic with no UI. Every function with real logic has a test in `tests/lib/`.
- `src/entrypoints/content/`: the content script and the stylesheet.

Import across folders with the `@/` alias. The linter rejects `../` imports. A test enforces the component rules.

## Security rules

Email content is untrusted. These rules are not optional:

- Never use `innerHTML`, `outerHTML`, or `insertAdjacentHTML`. A test fails the build if any of them appear in `src`.
- Show email text with normal JSX text, which Solid escapes.
- Show email HTML only through the sanitizer and the sandboxed iframe in `src/components/reader/html-body.tsx`.
- Open an issue to discuss any new permission or host permission before you add it to the manifest.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org) with a one-line subject, for example `fix: keep focus after closing the command bar`. The release notes come from these subjects.
