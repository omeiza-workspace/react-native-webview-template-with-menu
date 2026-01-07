import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { updateBackendPushToken } from "@/services/pushTokenService";

/**
 * 1. Global Notification Handler
 * Standard 2026 configuration for iOS 19+ and Android 15+.
 */
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | undefined;
  notification: Notifications.Notification | undefined;
  requestPermissionAndRegister: () => Promise<string | undefined>;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  /**
   * 2. Internal Registration Logic
   * Handles Android Channels, Permissions, and Token Retrieval.
   */
  async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    if (!Device.isDevice || Platform.OS === 'web') return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    // Retrieve Project ID (Mandatory UUID check for 2026)
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error("Project ID not found. Run 'eas project:init'.");
      return;
    }

    try {
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      return token;
    } catch (e) {
      console.error("Token fetch error", e);
      return undefined;
    }
  }

  /**
   * 3. Manual Trigger
   * Used by UI screens (like PushPermissionScreen) to start the flow.
   */
  const requestPermissionAndRegister = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setExpoPushToken(token);
      await updateBackendPushToken(token); // Direct sync to Laravel
    }
    return token;
  };

  /**
   * 4. Lifecycle Management
   * Handles automatic sync on mount and real-time token rotation.
   */
  useEffect(() => {
    // A. Initial Get & Sync
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        updateBackendPushToken(token); 
      }
    });

    // B. Token Refresh Listener
    const tokenSubscription = Notifications.addPushTokenListener((newToken) => {
      setExpoPushToken(newToken.data);
      updateBackendPushToken(newToken.data); 
    });

    // C. Foreground Notification Listener
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    // D. Tap/Interaction Listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("User tapped notification:", response.notification.request.content.data);
    });

    // Cleanup: 2026 standard requires calling .remove()
    return () => {
      tokenSubscription.remove();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification, requestPermissionAndRegister };
};
