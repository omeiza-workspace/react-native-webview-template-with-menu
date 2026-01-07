import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fallbackStyles } from '@/styles/fallback';

export function PushPermissionScreen({ onGranted }: { onGranted?: () => void }) {
  const scheme = useColorScheme();
  const styles = fallbackStyles(scheme);
  
  // Use the central hook instead of the deleted file
  const { requestPermissionAndRegister } = usePushNotifications();

  const handlePress = async () => {
    const token = await requestPermissionAndRegister();
    if (token && onGranted) {
      onGranted();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enable Notifications</Text>
      <Text style={styles.message}>Stay updated with alerts from GEFIX.</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Allow Notifications</Text>
      </TouchableOpacity>
    </View>
  );
}
