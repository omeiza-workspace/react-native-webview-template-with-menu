import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { APP_CONFIG } from '@/config/app';

/**
 * Sends the Native FCM token to Laravel. 
 * Updated for Direct Firebase SDK integration.
 */
export async function updateBackendPushToken(token: string) {
  console.log(Platform.OS)
  // FCM does not apply to web platforms in this native configuration
  if (Platform.OS === 'web') return;

  // Retrieve the auth token stored during login
  const authToken = await SecureStore.getItemAsync('auth_token');
  
  if (!authToken) {
    console.log("[PushTokenService] No auth token found, skipping sync.");
    return;
  }

  try {
    const response = await fetch(`${APP_CONFIG.API_BASE}/push-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        token: token,           // Native FCM token from messaging().getToken()
        platform: Platform.OS,  // 'ios' or 'android'
        guard: 'api',           // Helps Laravel identify the guard if needed
      }),
    });

    // Handle 401 Unauthorized (Session expired)
    if (response.status === 401) {
      console.warn("[PushTokenService] Session expired, cannot sync token.");
      return;
    }

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || 'Failed to register token on server');
    }

    console.log("[PushTokenService] Token synced with Laravel successfully.");
  } catch (error) {
    console.error("[PushTokenService] Backend token sync failed:", error);
  }
}

/**
 * Removes the token from Laravel on logout.
 * Note: If cPanel blocks DELETE, use POST with a custom route.
 */
export async function unregisterPushToken(token: string) {
  if (Platform.OS === 'web') return;

  const authToken = await SecureStore.getItemAsync('auth_token');
  if (!authToken) return;

  try {
    const response = await fetch(`${APP_CONFIG.API_BASE}/push-tokens`, {
      method: 'DELETE', 
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      console.log("[PushTokenService] Token unregistered successfully.");
    }
  } catch (error) {
    console.error("[PushTokenService] Failed to unregister token:", error);
  }
}
