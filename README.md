# Refined testmail.app

[![Version](https://img.shields.io/github/v/release/pyyupsk/refined-testmailapp?color=a1b858&label=)](https://github.com/pyyupsk/refined-testmailapp/releases)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/jgnnjkddobpnplpahhcofmlcancheboi?label=Chrome)](https://chromewebstore.google.com/detail/jgnnjkddobpnplpahhcofmlcancheboi)
[![Firefox Add-ons](https://img.shields.io/amo/v/refined-testmail-app?label=Firefox)](https://addons.mozilla.org/firefox/addon/refined-testmail-app/)

Render the [testmail.app](https://testmail.app) JSON API as an inbox, right in your browser. Built with [WXT](https://wxt.dev) and [Solid](https://www.solidjs.com).

## Features

- Two-pane inbox: an email list on the left and a reading pane on the right, stacked on small screens
- Rows with sender, subject, snippet, tag, SPF result, and relative time
- Search across sender, recipient, subject, tag, and text
- Read and unread states, and a Done folder with undo
- Reading pane tabs for the HTML body, the plain text, and the raw source
- Technical metadata drawer with From, To, Message-ID, SPF, DKIM, and sender IP
- Keyboard shortcuts and a command bar
- "Load more" for inboxes with more than one page
- Raw JSON view with highlighting, collapsible sections, clickable links, and copy

## Usage

Install the extension, then open a testmail.app API URL with your own key and namespace:

```sh
https://api.testmail.app/api/json?apikey=YOUR_KEY&namespace=YOUR_NAMESPACE
```

The extension replaces the raw JSON with an inbox. Click "JSON" in the header to see the original response.

Read, unread, and Done states live in the page only. A reload resets them.

### Keyboard shortcuts

| Key                     | Action                                                    |
| ----------------------- | --------------------------------------------------------- |
| `J` / `K`, `↓` / `↑`    | Next or previous email                                    |
| `O`, `Enter`            | Open the selected email                                   |
| `Space` / `Shift+Space` | Scroll the reading pane down or up                        |
| `C`                     | Copy the verification code, or the first link             |
| `I`                     | Show or hide the metadata drawer                          |
| `E`                     | Move to Done, or back to the inbox                        |
| `U`                     | Mark as read or unread                                    |
| `1` / `2` / `3`         | HTML, plain text, or raw source tab                       |
| `/`                     | Search                                                    |
| `G I` / `G D`           | Go to the inbox or the Done folder                        |
| `Ctrl+K`, `⌘K`          | Command bar                                               |
| `Esc`                   | Close the drawer, or go back to the list on small screens |

## Security

Test inboxes can receive anything, including phishing tests and hostile HTML. The extension handles email content in three layers:

1. The HTML body passes through a sanitizer that removes scripts, forms, frames, event handlers, and `javascript:` links.
2. The result renders in an `<iframe>` with an empty `sandbox` attribute, so no script can run.
3. A Content Security Policy in the frame blocks all remote resources, including tracking pixels and remote images.

Images in HTML emails show as broken. This is intentional.

The extension runs only on `api.testmail.app/api/json` pages. It does not store your API key and it sends no data anywhere. See [PRIVACY.md](./PRIVACY.md).

## Install

- [Chrome Web Store](https://chromewebstore.google.com/detail/jgnnjkddobpnplpahhcofmlcancheboi)
- [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/refined-testmail-app/)

To install a build by hand, download the Chrome or Firefox zip from the [latest release](https://github.com/pyyupsk/refined-testmailapp/releases/latest). In Chrome, unzip it, open `chrome://extensions`, turn on Developer mode, and click "Load unpacked". In Firefox, open `about:debugging#/runtime/this-firefox` and load the zip as a temporary add-on.

### From source

The `main` branch holds work that is not released yet. To build a released version, check out its tag first. You need [Bun](https://bun.sh) and Node.js 22.12 or newer.

```bash
git checkout v0.1.0
bun install
bun run build:chrome   # or build:firefox
```

Load `.output/chrome-mv3` as an unpacked extension in Chrome, or any file in `.output/firefox-mv3` as a temporary add-on in Firefox.

When you report a bug, include the version, or the commit hash if you built from `main`.

## Development

```bash
bun run dev            # Chrome with hot reload
bun run dev:firefox
bun run test           # not `bun test`, which skips Vitest
bun run typecheck
bun run lint
bun run format
```

UI components live in `src/components/<category>/`, with one component per file and lower-case file names. Pure logic lives in `src/lib/`, and its tests live in `tests/lib/`. Import across folders with the `@/` alias. The linter rejects `../` imports.

## Why?

testmail.app is great for end-to-end email tests, but its visual viewer needs a Pro plan. The JSON API works on every plan. This extension gives the JSON API the inbox view it was missing.

This project is not affiliated with testmail.app.

## License

[MIT](./LICENSE) License © 2026 [Pongsakorn Thipayanate](https://github.com/pyyupsk)
