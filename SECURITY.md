# Security policy

Refined testmail.app shows email content that can be hostile. Test inboxes receive phishing tests, broken HTML, and tracking pixels. A flaw that lets email content run code or load remote resources is a security bug.

## Supported versions

Only the latest release gets security fixes.

## Report a vulnerability

Do not open a public issue. Report it privately through [GitHub security advisories](https://github.com/pyyupsk/refined-testmailapp/security/advisories/new), or by email to <contact@fasu.dev>.

Include:

- The extension version and the browser
- The email content or the API response that triggers the bug, with any real data removed
- What happens, for example a script runs, a remote request goes out, or the page navigates

You will get a reply within 7 days. After a fix is released, the advisory is published with credit to you, unless you ask to stay anonymous.

## In scope

- Script execution from email content
- Remote requests from email content, such as images, stylesheets, or fonts
- Escape from the sandboxed frame
- Anything that reads or leaks the API key in the page URL

## Out of scope

- Bugs in testmail.app itself. Report those to testmail.app.
- Attacks that need a malicious browser extension or local access to the computer
