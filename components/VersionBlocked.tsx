import React from 'react';
import { View, Text } from 'react-native';
import { fallbackStyles } from '@/styles/fallback';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export function VersionBlocked() {

  const scheme = useColorScheme(); // 'light' | 'dark'
  const styles = fallbackStyles(scheme);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: Colors[scheme].danger }]}>Update Required</Text>
      <Text style={styles.message}>
        Please update the app to continue using GEFIX.
      </Text>
    </View>
  );
}
