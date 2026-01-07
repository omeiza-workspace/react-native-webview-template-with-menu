import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GefixWebView from './Home';
import NotFoundScreen from '../app/not-found';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Root"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Root" component={GefixWebView} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} />
    </Stack.Navigator>
  );
}
