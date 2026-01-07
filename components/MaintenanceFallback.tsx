import React from 'react';
import { View, Text } from 'react-native';
import { fallbackStyles } from '@/styles/fallback';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function MaintenanceFallback() {
  const scheme = useColorScheme();
  const styles = fallbackStyles(scheme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Under Maintenance</Text>
      <Text style={styles.message}>
        We are performing scheduled maintenance. Please try again later.
      </Text>
    </View>
  );
}
