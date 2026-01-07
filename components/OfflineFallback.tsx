import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { fallbackStyles } from '@/styles/fallback';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getLastError } from '@/utils/errorStore';

interface Props {
  title?: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
}

export function OfflineFallback({
  title = 'Connection issue',
  message,
  loading,
  onRetry,
}: Props) {
  const scheme = useColorScheme();
  const styles = fallbackStyles(scheme);
  const debugError = getLastError();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {message && <Text style={styles.message}>{message}</Text>}

      {onRetry && (
        <Pressable
          onPress={loading ? undefined : onRetry}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            {loading ? 'Retrying…' : 'Retry'}
          </Text>
        </Pressable>
      )}

      {__DEV__ && debugError && (
        <Text style={{ marginTop: 12, fontSize: 12 }}>
          Debug: {debugError}
        </Text>
      )}
    </View>
  );
}
