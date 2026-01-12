import { useState, useEffect, useRef, useCallback } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { updateBackendPushToken } from "@/services/pushTokenService";
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  requestPermission,
  getInitialNotification
} from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
  fcmToken: string | undefined;
  notification: Notifications.Notification | undefined;
  requestPermissionAndRegister: () => Promise<string | undefined>;
}

export const usePushNotifications = (): PushNotificationState => {
  const [fcmToken, setFcmToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const registerForPushNotificationsAsync = useCallback(async (): Promise<string | undefined> => {
    if (!Device.isDevice || Platform.OS === 'web') return;

    const messagingInstance = getMessaging(); // Initialize inside the function

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });

      if (Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
    }

    // FIX: Changed 'messaging' to 'messagingInstance'
    const authStatus = await requestPermission(messagingInstance);
    const enabled = authStatus === 1 || authStatus === 2;

    if (enabled) {
      return await getToken(messagingInstance);
    }
    return undefined;
  }, []);

  const requestPermissionAndRegister = useCallback(async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      setFcmToken(token);
      await updateBackendPushToken(token);
    }
    return token;
  }, [registerForPushNotificationsAsync]);

  useEffect(() => {
    if (fcmToken) {
      console.log("----------------------------");
      console.log("FCM_TOKEN_DEBUG:", fcmToken);
      console.log("----------------------------");
    }
  }, [fcmToken]);

  useEffect(() => {
    if (Platform.OS === 'web' || !Device.isDevice) return;

    const messagingInstance = getMessaging();

    const initialRegister = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setFcmToken(token);
        await updateBackendPushToken(token);
      }
    };
    initialRegister();
 
    const unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, async (newToken) => {
      setFcmToken(newToken);
      await updateBackendPushToken(newToken);
    });

    // Inside useEffect in usePushNotifications.ts
    notificationListener.current = Notifications.addNotificationReceivedListener(async (notif) => {
      setNotification(notif);

      // Update the native app icon badge
      const currentBadge = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(currentBadge + 1);
    });

    // Clear badge when user opens the app
    // const subscription = Notifications.addNotificationResponseReceivedListener(() => {
    //   Notifications.setBadgeCountAsync(0);
    // });


   

    // FIX: Changed 'messaging' to 'messagingInstance'
    getInitialNotification(messagingInstance).then(async (remoteMessage) => {
      if (remoteMessage?.data?.url) {
        await SecureStore.setItemAsync('PENDING_DEEPLINK', remoteMessage.data.url as string);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(async (notif) => {
      setNotification(notif);
      
      // Update the native app icon badge
      const currentBadge = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(currentBadge + 1);
    });

    // Clear badge when user opens the app
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      Notifications.setBadgeCountAsync(0);
    });




    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("User tapped notification:", response.notification.request.content.data);
      
      // Clear badge immediately on interaction
      Notifications.setBadgeCountAsync(0);
    });

    const currentNotifListener = notificationListener.current;
    const currentResListener = responseListener.current;

    return () => {
      unsubscribeTokenRefresh();
      currentNotifListener?.remove();
      currentResListener?.remove();
    };
  }, [requestPermissionAndRegister, registerForPushNotificationsAsync]);

  return { fcmToken, notification, requestPermissionAndRegister };
};
