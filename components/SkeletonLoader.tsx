// components/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, ActivityIndicator} from 'react-native';
import { webViewStyles } from '@/styles/webview';

export function SkeletonLoader() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ padding: 24 }}>
        {/* <ActivityIndicator size="large" /> */}
      <Animated.View
        style={{
          height: 20,
          borderRadius: 6,
          backgroundColor: '#ccc',
          opacity,
          marginBottom: 12,
        }}
      />
      <Animated.View
        style={{
          height: 20,
          width: '80%',
          borderRadius: 6,
          backgroundColor: '#ccc',
          opacity,
        }}
      />
    </View>
  );
}
