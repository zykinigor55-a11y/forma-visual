import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.plux.assistant',
  appName: 'PLUX',
  webDir: 'www',
  // Native preview loads deployed PLUX; bundle full web assets before App Store release.
  server: {
    url: 'https://plux-v17-friends-preview.onrender.com/?mobile=1&v=1701',
    cleartext: false,
    allowNavigation: ['plux-v17-friends-preview.onrender.com']
  },
  android: { allowMixedContent: false },
  ios: { contentInset: 'never' }
};
export default config;
