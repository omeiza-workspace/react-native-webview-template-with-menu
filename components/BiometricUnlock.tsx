import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { fallbackStyles } from '@/styles/fallback';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BiometricUnlockProps {
  onSuccess: () => void;
}

export function BiometricUnlock({ onSuccess }: BiometricUnlockProps) {
  const scheme = useColorScheme();
  const styles = fallbackStyles(scheme);

  const handleUnlock = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to continue',
      fallbackLabel: 'Use device passcode',
    });
    if (result.success) onSuccess();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.message}>Use Face ID / Touch ID to access GEFIX.</Text>
      <TouchableOpacity style={styles.button} onPress={handleUnlock}>
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}
