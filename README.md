# Refined testmail.app

[![Version](https://img.shields.io/github/package-json/v/pyyupsk/refined-testmailapp?color=a1b858&label=)](https://github.com/pyyupsk/refined-testmailapp/releases)

Render the [testmail.app](https://testmail.app) JSON API as an inbox, right in your browser. Built with [WXT](https://wxt.dev).

## Features

- Email list with sender, subject, tag, and time
- Email detail with a download link for the original `.eml` file
- HTML bodies in a sandboxed frame: no scripts, no forms, no remote images
- "Load more" for inboxes with more than one page
- Raw JSON view with highlighting, collapsible sections, clickable links, and copy

## Usage

Install the extension, then open a testmail.app API URL with your own key and namespace:

```sh
https://api.testmail.app/api/json?apikey=YOUR_KEY&namespace=YOUR_NAMESPACE
```

The extension replaces the raw JSON with an inbox. Click "View raw JSON" to see the original response.

The extension runs only on `api.testmail.app/api/json` pages. It does not store your API key and it sends no data anywhere. See [PRIVACY.md](./PRIVACY.md).

## Install from Source

```bash
bun install
bun run build:chrome   # or build:firefox
```

Load `.output/chrome-mv3` as an unpacked extension in `chrome://extensions`. For Firefox, load any file in `.output/firefox-mv3` as a temporary add-on in `about:debugging`.

## Development

```bash
bun run dev            # Chrome with hot reload
bun run test           # not `bun test`, which skips Vitest
bun run lint
bun run format
```

## Why?

testmail.app is great for end-to-end email tests, but its visual viewer needs a Pro plan. The JSON API works on every plan. This extension gives the JSON API the inbox view it was missing.

This project is not affiliated with testmail.app.

## License

[MIT](./LICENSE) License © 2026 [Pongsakorn Thipayanate](https://github.com/pyyupsk)
