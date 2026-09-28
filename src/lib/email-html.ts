// This blocks remote loads, form submission, and <base> rewrites in email
// HTML. Enforcement inside an iframe srcdoc is not confirmed, so test it by
// hand in each browser.
const EMAIL_CSP = [
  "default-src 'none'",
  'img-src data: blob:',
  "style-src 'unsafe-inline'",
  'font-src data:',
  'media-src data: blob:',
  "form-action 'none'",
  "base-uri 'none'",
].join('; ');

export function buildEmailSrcdoc(html: string): string {
  // This turns off auto-dark repaint. Without it, content rendered as
  // near-black fills.
  return (
    `<meta http-equiv="Content-Security-Policy" content="${EMAIL_CSP}">` +
    '<meta name="color-scheme" content="light">' +
    html
  );
}
