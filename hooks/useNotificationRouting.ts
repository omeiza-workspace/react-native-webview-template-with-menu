import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { WebView } from 'react-native-webview';
import { APP_CONFIG } from '@/config/app';

const PENDING_DEEPLINK_KEY = 'PENDING_DEEPLINK';

export function useNotificationRouting(webViewRef: React.RefObject<WebView | null>) {
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);

  // 1. FIX: Call the hook UNCONDITIONALLY at the top level
  // This satisfies the Rules of Hooks. 
  // It will naturally return null/undefined on Web or if no notification exists.
  const lastResponse = Notifications.useLastNotificationResponse();

  const handleUrlFromNotification = useCallback(async (
    response: Notifications.NotificationResponse
  ) => {
    // 2. SAFETY: Exit early if on Web to prevent native property access errors
    if (Platform.OS === 'web') return;

    const data = response.notification.request.content.data as { url?: string };
    const rawUrl = data?.url;

    if (typeof rawUrl !== 'string') return;
    const targetUrl = normalizeUrl(rawUrl);

    const webViewInstance = webViewRef.current;

    if (!webViewInstance || !isWebViewLoaded) {
      await SecureStore.setItemAsync(PENDING_DEEPLINK_KEY, targetUrl);
      return;
    }

    navigateWebView(webViewInstance, targetUrl);
  }, [isWebViewLoaded, webViewRef]);

  // 3. Logic only triggers if a valid response exists and we are not on Web
  useEffect(() => {
    if (Platform.OS !== 'web' && lastResponse) {
      handleUrlFromNotification(lastResponse);
    }
  }, [lastResponse, handleUrlFromNotification]);

  useEffect(() => {
    const replay = async () => {
      const webViewInstance = webViewRef.current;
      if (isWebViewLoaded && webViewInstance) {
        const pending = await SecureStore.getItemAsync(PENDING_DEEPLINK_KEY);
        if (pending) {
          navigateWebView(webViewInstance, pending);
          await SecureStore.deleteItemAsync(PENDING_DEEPLINK_KEY);
        }
      }
    };
    replay();
  }, [isWebViewLoaded, webViewRef]);

  const onWebViewLoadEnd = () => setIsWebViewLoaded(true);

  return { onWebViewLoadEnd };
}

// Helpers
function normalizeUrl(rawUrl: string): string {
  if (rawUrl.startsWith('http')) return rawUrl;
  const baseUrl = APP_CONFIG.APP_URL.endsWith('/') ? APP_CONFIG.APP_URL.slice(0, -1) : APP_CONFIG.APP_URL;
  const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${baseUrl}${path}`;
}

function navigateWebView(webView: WebView, url: string) {
  const js = `
    (function() {
      if (window.location.href !== ${JSON.stringify(url)}) {
        window.location.replace(${JSON.stringify(url)});
      }
    })();
    true; 
  `;
  webView.injectJavaScript(js);
}
