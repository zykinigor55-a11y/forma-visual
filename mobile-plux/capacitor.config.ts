import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.plux.assistant',
  appName: 'PLUX',
  webDir: 'www',
  // Native preview loads deployed PLUX; bundle full web assets before App Store release.
  server: {
    url: 'https://plux-v12-2-2k-fixed.onrender.com/?mobile=1&v=1301',
    cleartext: false,
    allowNavigation: ['plux-v12-2-2k-fixed.onrender.com']
  },
  android: { allowMixedContent: false },
  ios: { contentInset: 'never' }
};
export default config;
