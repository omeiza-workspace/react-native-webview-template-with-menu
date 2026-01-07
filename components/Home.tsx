import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Linking, Platform, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';

import { APP_CONFIG } from '@/config/app';
import { webViewStyles } from '@/styles/webview';
import { OfflineFallback } from './OfflineFallback';
import { SkeletonLoader } from './SkeletonLoader';
import { useNetwork } from '@/hooks/useNetwork';
import { useBackendProbe } from '@/hooks/useBackendProbe';
import { useNotificationRouting } from '@/hooks/useNotificationRouting';

export default function Home() {
  const webViewRef = useRef<WebView | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const insets = useSafeAreaInsets();
  const isOnline = useNetwork();
  const { serverOk, retrying, retry } = useBackendProbe(isOnline);

  // 1. Deep Linking & Notification Routing
  const { onWebViewLoadEnd } = useNotificationRouting(webViewRef);

  // 2. Android Hardware Back Button Handling
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [canGoBack]);

  // 3. Optimized Navigation Guard
  const onShouldStartLoadWithRequest = useCallback((request: any) => {
    const { url, isMainFrame } = request;

    // Allow assets, iframes, and background auth requests
    if (!isMainFrame) return true;

    try {
      const allowedOrigin = new URL(APP_CONFIG.APP_URL).origin;
      const reqUrl = new URL(url);

      // Allow internal navigation
      if (reqUrl.origin === allowedOrigin) return true;

      // Handle External Links (System browser)
      const externalSchemes = ['mailto:', 'tel:', 'sms:'];
      if (externalSchemes.some(scheme => url.startsWith(scheme))) {
        Linking.openURL(url).catch((_err) => console.warn('Could not open scheme', _err));
        return false;
      }

      if (/^https?:\/\//.test(url)) {
        Linking.openURL(url).catch((_err) => console.warn('Could not open URL', _err));
        return false;
      }
    } catch (e) {
      console.warn('Navigation guard URL parse error', e);
      return true; // Fallback: allow if parsing fails
    }

    return false;
  }, []);

  // 4. JS Bridge Message Handler
  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'OPEN_EXTERNAL' && data.url) {
        Linking.openURL(data.url).catch((_err) => {});
      }
    } catch (e) {
      console.warn('Bridge message parsing error', e);
    }
  };

  // 5. Error Handling & Retry Logic
  const handleManualRetry = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    } else {
      retry();
    }
  };

  // 6. Navigation State Change
  const onNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  // 7. Initial Loading & Offline States
  if (isOnline === null || (isOnline && serverOk === null)) {
    return <SkeletonLoader />;
  }

  if (isOnline === false || serverOk === false) {
    return (
      <OfflineFallback
        message={isOnline === false ? "No Internet Connection" : "Service unavailable"}
        loading={retrying}
        onRetry={handleManualRetry}
      />
    );
  }

  return (
    <View
      style={[
        webViewStyles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: '#000',
        },
      ]}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: APP_CONFIG.APP_URL }}
        style={webViewStyles.webView}
        cacheEnabled={true}
        userAgent={`GefixApp-${Platform.OS}-2026`} 
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={true}
        onLoadEnd={onWebViewLoadEnd}
        renderLoading={() => <SkeletonLoader />}
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}


        onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            // Alert the error description for immediate debugging on device
            alert(`Load Failed: ${nativeEvent.description}`);
        }}
        
        injectedJavaScriptBeforeContentLoaded={`
          (function() {
            var appOrigin = "${new URL(APP_CONFIG.APP_URL).origin}";
            if (window.location.origin !== appOrigin && window.location.origin !== 'null') return;

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                    registration.unregister();
                    }
                });
            }
                
            window.isNativeApp = true;
            window.GEFIX = {
              postMessage: function(data) {
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
              }
            };

            document.addEventListener('click', function(e) {
              const a = e.target.closest('a');
              if (a && a.href) {
                const isExternal = !a.href.startsWith(appOrigin);
                const isNewTab = a.target === '_blank';
                if (isExternal || isNewTab) {
                  e.preventDefault();
                  window.GEFIX.postMessage({ type: 'OPEN_EXTERNAL', url: a.href });
                }
              }
            }, true);
          })();
          true;
        `}
        
        // 2026 Best Practices
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        bounces={false}
        overScrollMode="never"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      />
    </View>
  );
}
