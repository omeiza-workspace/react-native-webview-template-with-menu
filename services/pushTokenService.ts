import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { APP_CONFIG } from '@/config/app';

/**
 * Sends the token to Laravel. 
 * Shared by the hook (on refresh) and the layout (on login).
 */
export async function updateBackendPushToken(token: string) {
  if (Platform.OS === 'web') return;

  // 2026 Best Practice: Check for auth before syncing
  const authToken = await SecureStore.getItemAsync('auth_token');
  if (!authToken) {
    console.log("No auth token found, skipping push token sync.");
    return;
  }

  try {
    const response = await fetch(`${APP_CONFIG.API_BASE}/push-tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        platform: Platform.OS,
      }),
    });

    if (!response.ok) throw new Error('Failed to register token on server');
    console.log("Push token synced with Laravel successfully.");
  } catch (error) {
    console.error("Backend token sync failed:", error);
  }
}

/**
 * Removes the token from Laravel on logout.
 */
export async function unregisterPushToken(token: string) {
  const authToken = await SecureStore.getItemAsync('auth_token');
  if (!authToken) return;

  await fetch(`${APP_CONFIG.API_BASE}/push-tokens`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
}
