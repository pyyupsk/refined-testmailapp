import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'Refined testmail.app',
    description: 'Renders testmail.app raw JSON API responses as a readable inbox UI.',
    permissions: [],
    host_permissions: [],
  },
});
