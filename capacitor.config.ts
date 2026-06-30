import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finwise.app',
  appName: 'FinWise',
  webDir: 'capacitor-assets',

  // 🚀 PRODUCTION BUILD (App Store):
  // The app loads from the deployed Vercel URL
  server: { url: 'https://financialliteracy-nine.vercel.app' },

  // 🧪 FOR LOCAL TESTING:
  // Run `npm run dev` in one terminal, then uncomment:
  // server: { url: 'http://localhost:3000' },

  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
  },
};

export default config;
