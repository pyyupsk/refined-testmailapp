# Privacy policy

Refined testmail.app does not collect, store, or share any user data.

## What the extension reads

The extension runs only on pages that match `https://api.testmail.app/api/json*`. On those pages, it reads the JSON response that your browser already loaded. It uses that data only to show the inbox on the same page.

## What the extension stores

Nothing. The extension does not use browser storage, cookies, or any server. It does not store your testmail.app API key. Read, unread, and Done states exist only in the open page. A reload clears them.

## Network requests

The extension makes one kind of network request. When you click "Load more", it requests the next page of results from `api.testmail.app`, with the same URL that you opened. The extension sends no data to any other server. It contains no analytics and no tracking.

When you click the `.eml` download link, your browser opens the download URL that testmail.app put in the response. The extension does not make that request itself.

Email bodies pass through a sanitizer, then render in a sandboxed frame with a Content Security Policy that blocks remote resources. Images, tracking pixels, and other remote content in an email do not load.

## Clipboard

The extension writes to your clipboard only on your request, for example the `C` key or a copy button. It never reads from your clipboard.

## Contact

If you have a question about this policy, open an issue at <https://github.com/pyyupsk/refined-testmailapp/issues>.
