import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
// import { Platform } from 'react-native'; // 1. Restore Platform
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as SplashScreen from 'expo-splash-screen';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useBackgroundRefresh } from '@/hooks/useBackgroundRefresh';
import { setCurrentPushToken } from '@/utils/messageHandler';
import useCachedResources from '@/hooks/useCachedResources'; // 2. Add resource hook

// Prevent auto-hide immediately
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light';
  const [appIsReady, setAppIsReady] = useState(false);
  
  // Load fonts/assets first
  const isLoadingComplete = useCachedResources();
  
  // Initialize native hooks
  const { expoPushToken } = usePushNotifications();
  
  // 3. Register background tasks ONLY on mobile
  
    useBackgroundRefresh();
  

  useEffect(() => {
    async function prepare() {
      try {
        if (expoPushToken) {
          setCurrentPushToken(expoPushToken);
        }
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        // 4. Set ready only if fonts are also loaded
        if (isLoadingComplete) {
          setAppIsReady(true);
        }
      }
    }

    prepare();
  }, [expoPushToken, isLoadingComplete]);

  useEffect(() => {
    if (appIsReady) {
      // 5. Hide splash with a slight delay if on iOS 19+ 
      // to ensure WebView has painted its first frame
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {});
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [appIsReady]);

  // 6. Prevent rendering the Stack until fonts are loaded 
  // to avoid "font-missing" crashes on native
  if (!isLoadingComplete) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { 
            backgroundColor: Colors[scheme]?.background ?? Colors.light.background 
          },
        }}
      />
    </SafeAreaProvider>
  );
}
