// app/not-found.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  const scheme = useColorScheme();

  return (
    <View style={[styles.container, { backgroundColor: Colors[scheme].background }]}>
      <Text style={[styles.title, { color: Colors[scheme].textPrimary }]}>
        This screen does not exist.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace('/')} // navigate to home
        style={styles.link}
        accessibilityRole="button"
        accessibilityLabel="Go to home screen"
      >
        <Text style={[styles.linkText, { color: Colors[scheme].primary }]}>
          Go to home screen
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  link: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5, backgroundColor: '#e0e0e0' },
  linkText: { fontSize: 16 },
});

