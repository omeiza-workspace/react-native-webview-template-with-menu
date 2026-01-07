import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { trackEvent } from "./analytics";
import { updateBackendPushToken, unregisterPushToken } from '@/services/pushTokenService';

let currentToken: string | null = null;

/**
 * Updates the push token and automatically registers it.
 * Refined 2026: Always attempts sync if a token is provided.
 */
export async function setCurrentPushToken(token?: string) {
  currentToken = token ?? null;
  
  if (currentToken) {
    // 1. Sync with Laravel immediately. 
    // The service internally checks for auth_token to ensure safety.
    await updateBackendPushToken(currentToken);
  }
}

export async function handleMessage(event: any) {
  if (!event.nativeEvent.data) return;

  let data;
  try {
    data = JSON.parse(event.nativeEvent.data);
  } catch (e) {
    console.warn("Invalid WebView message format", e);
    return;
  }

  switch (data.type) {
    case 'auth_login':
      if (!data.userId) return;
      
      // 2. Persist Auth State
      await SecureStore.setItemAsync('userId', String(data.userId));
      
      // 3. Immediately Sync Token if available
      if (currentToken) {
        await updateBackendPushToken(currentToken);
      }
      break;

    case 'auth_logout':
      if (currentToken) {
        await unregisterPushToken(currentToken);
      }
      await SecureStore.deleteItemAsync('userId');
      break;

    case 'analytics':
      if (data.event) {
        trackEvent(data.event, data.payload || {});
      }
      break;

    case "external_url":
      // 4. Secure Deep Linking (2026 Standard)
      if (data.url && /^https?:\/\//.test(data.url)) {
        await Linking.openURL(data.url).catch(() => {});
      }
      break;
      
    default:
      console.warn(`Unhandled bridge type: ${data.type}`);
  }
}
