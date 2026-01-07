// components/RetryButton.tsx
import React from 'react';
import { Pressable, ActivityIndicator, Text } from 'react-native';

export function RetryButton({
  loading,
  onPress,
}: {
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={{ marginTop: 20 }}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={{ fontWeight: '600' }}>Retry</Text>
      )}
    </Pressable>
  );
}
