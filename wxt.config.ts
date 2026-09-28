import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  manifest: ({ browser }) => ({
    name: 'Refined testmail.app',
    description: 'Renders testmail.app raw JSON API responses as a readable inbox UI.',
    permissions: [],
    host_permissions: [],
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'refined-testmailapp@fasu.dev',
          // Firefox requires this for new extensions. We collect nothing.
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
