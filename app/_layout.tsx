// app/_layout.tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as SplashScreen from 'expo-splash-screen';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useBackgroundRefresh } from '@/hooks/useBackgroundRefresh';
import { setCurrentPushToken } from '@/utils/messageHandler';
import useCachedResources from '@/hooks/useCachedResources';

// Prevent auto-hide immediately to allow WebView/Auth to initialize
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light';
  const [appIsReady, setAppIsReady] = useState(false);
  
  // 1. Load fonts/assets (Native requirement)
  const isLoadingComplete = useCachedResources();
  
  // 2. Initialize Native Firebase Hooks (Updated variable name)
  const { fcmToken } = usePushNotifications();
  
  // 3. Register background tasks (cPanel friendly refresh logic)
  useBackgroundRefresh();

  useEffect(() => {
    async function prepare() {
      try {
        // Sync the Native FCM Token with our internal bridge/utils
        if (fcmToken) {
          setCurrentPushToken(fcmToken);
        }
      } catch (e) {
        console.warn('[RootLayout] Initialization error:', e);
      } finally {
        // 4. Set app ready ONLY after resources and fonts are loaded
        if (isLoadingComplete) {
          setAppIsReady(true);
        }
      }
    }

    prepare();
  }, [fcmToken, isLoadingComplete]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Small 300ms buffer allows the native view hierarchy to stabilize
      // before we pull the curtain on the splash screen
      await new Promise(resolve => setTimeout(resolve, 300));
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]); 

  // 6. Guard: Prevent Stack mount during resource loading
  if (!isLoadingComplete) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {/* The onLayout event triggers once the View is mounted */}
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Stack
          screenOptions={{
            headerShown: false,
            // Match background to splash color to hide white flickering
            contentStyle: { 
              backgroundColor: Colors[scheme]?.background ?? Colors.light.background 
            },
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}
