import { WebViewNavigation } from 'react-native-webview';
import { Linking } from 'react-native';
import { APP_CONFIG } from '@/config/app';

function normalizeUrl(url: string) {
  // Remove trailing slash for comparison
  return url.replace(/\/$/, '');
}

export function isAllowedNavigation(event: WebViewNavigation) {
  const url = event.url;

  // 1️⃣ Allow all URLs under the main app domain
  if (url.startsWith(APP_CONFIG.APP_URL)) return true;

  // 2️⃣ Open mailto and tel links externally
  if (url.startsWith('mailto:') || url.startsWith('tel:')) {
    Linking.openURL(url);
    return false;
  }

  // 3️⃣ Open any other external URLs in the device browser
  if (/^https?:\/\//.test(url)) {
    Linking.openURL(url);
    return false;
  }

  // 4️⃣ Block everything else (non-http links)
  return false;
}

export function createNavigationGuard() { 
    const appUrl = normalizeUrl(APP_CONFIG.APP_URL);

  return (event: WebViewNavigation) => {
    const url = normalizeUrl(event.url);

    if (url.startsWith(appUrl)) return true;
    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      Linking.openURL(url);
      return false;
    }

    return false;
  };
}
