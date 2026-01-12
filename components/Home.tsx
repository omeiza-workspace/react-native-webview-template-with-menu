import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Linking, Platform, BackHandler, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';

import { APP_CONFIG } from '@/config/app';
import { webViewStyles } from '@/styles/webview';
import { OfflineFallback } from './OfflineFallback';
import { SkeletonLoader } from './SkeletonLoader';
import { useNetwork } from '@/hooks/useNetwork';
import { useBackendProbe } from '@/hooks/useBackendProbe';
import { useNotificationRouting } from '@/hooks/useNotificationRouting';
import { usePushNotifications } from '@/hooks/usePushNotifications';

import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { updateBackendPushToken } from '@/services/pushTokenService';
import * as SecureStore from 'expo-secure-store';
import { INJECTED_JAVASCRIPT } from '@/constants/WebViewScripts';

export default function Home() {
  const webViewRef = useRef<WebView | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const insets = useSafeAreaInsets();
  const isOnline = useNetwork();
  const { serverOk, retrying, retry } = useBackendProbe(isOnline);
  
  // 1. Hook into our Push System
  const { notification } = usePushNotifications(); // Get the current notification state

  // 1. Deep Linking & Notification Routing
  const { onWebViewLoadEnd } = useNotificationRouting(webViewRef, isLoaded);

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

   // 4. PRESERVED: Instant Bell Update (Native -> Web)
  // When a push arrives, tell the website to refresh the bell icon immediately
  useEffect(() => {
    if (notification && webViewRef.current) {
      const cmd = JSON.stringify({ type: 'REFRESH_NOTIFICATIONS' });
      webViewRef.current.postMessage(cmd);
      console.log("[Bridge] Triggered web notification refresh");
    }
  }, [notification]);


  // 3. Optimized Navigation Guard
  const onShouldStartLoadWithRequest = useCallback((request: any) => {
    const { url } = request;

    try {
      const allowedOrigin = new URL(APP_CONFIG.APP_URL).origin;
      const reqUrl = new URL(url);

      // Allow internal navigation
      if (reqUrl.origin === allowedOrigin) return true;

      // Handle External Links (System browser)
      const externalSchemes = ['mailto:', 'tel:', 'sms:', 'whatsapp:'];
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
  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'OPEN_EXTERNAL' && data.url) {
        Linking.openURL(data.url).catch((_err) => { });
      }

      if (data.type === 'AUTH_SUCCESS') {
        // Save to SecureStore immediately
        const apiToken = data.payload.token;
        await SecureStore.setItemAsync('auth_token', apiToken);

        // NOW the "No auth token found" error will disappear!
        console.log("Token saved! Syncing FCM now...");
        const messaging = getMessaging();
        const fcmToken = await getToken(messaging);
        await updateBackendPushToken(fcmToken);
      }

      // Updated to 2026 Modular Firebase Syntax
      if (data.type === 'SYNC_PUSH_TOKEN') {
        const messaging = getMessaging();
        const token = await getToken(messaging);
        await updateBackendPushToken(token);
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

    // Log the URL whenever it changes to catch the 404 target
    console.log("----------------------------");
    console.log("WEBVIEW_CURRENT_URL:", navState.url);
    console.log("----------------------------");
  };


  const handleLoadEnd = () => {
    setIsLoaded(true);
    onWebViewLoadEnd();
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
        onLoadEnd={handleLoadEnd}
        renderLoading={() => <SkeletonLoader />}
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}


        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          // Alert the error description for immediate debugging on device
          // alert(`Load Failed: ${nativeEvent.description}`);
          Alert.alert('Load Failed', nativeEvent.description);
        }}

        injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}

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
