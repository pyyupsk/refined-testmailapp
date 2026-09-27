# Refined testmail.app

A browser extension that turns the raw JSON from the testmail.app API into a readable inbox.

testmail.app gives you disposable inboxes for end-to-end tests. Its JSON API is free to use, but the visual email viewer needs a Pro plan. This extension renders that same JSON as an inbox in your browser, on the page you already opened. It needs no account, no server, and no configuration.

This project is not affiliated with testmail.app.

## How it works

1. You open a testmail.app API URL in your browser, with your own `apikey` and `namespace` in the query string:

   ```sh
   https://api.testmail.app/api/json?apikey=YOUR_KEY&namespace=YOUR_NAMESPACE
   ```

2. The extension reads the JSON on that page and replaces it with an inbox: a list of emails on the left and the selected email on the right.

3. Click "View raw JSON" to switch back to the raw response at any time.

The extension only reads the page it is on. It does not store your API key and it does not send data anywhere.

## Features

- Email list with sender, subject, tag, and time.
- Email detail with sender, recipient, and a link to download the original `.eml` file.
- Rendered HTML body inside a sandboxed frame. See Security below.
- "Load more" for inboxes with more emails than one API page returns.
- Raw JSON view with syntax highlighting, collapsible objects, clickable links, and a copy button.

## Security

Email content is untrusted. Test inboxes can receive anything, including phishing simulations and malicious HTML. The extension renders each email body inside an `<iframe>` with an empty `sandbox` attribute and a strict Content Security Policy. This blocks scripts, form submission, top-level navigation, and all remote resource loads, including tracking pixels and remote images.

We confirmed this behavior in Chrome with a live test email. It contained a script tag, a remote tracking image, a form, a meta refresh, and a `javascript:` link. None of them ran or loaded.

Because remote images are blocked, images in HTML emails show as broken. This is intentional.

## Install

### From a store

Store listings are not published yet.

### From source

You need [Bun](https://bun.sh) and Node.js 22.12 or newer.

```sh
bun install
bun run build:chrome    # or build:firefox
```

Then load the unpacked extension:

- Chrome: open `chrome://extensions`, turn on Developer mode, click "Load unpacked", and select `.output/chrome-mv3`.
- Firefox: open `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select any file inside `.output/firefox-mv3`.

## Development

```sh
bun run dev             # Chrome with hot reload
bun run dev:firefox
bun run test
bun run typecheck
bun run zip:chrome      # or zip:firefox, for store upload
```

Run `bun run test`, not `bun test`. The second command runs Bun's own test runner instead of Vitest.

## License

MIT. See [LICENSE](LICENSE).
