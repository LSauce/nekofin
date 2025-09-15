import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as StatusBar from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function Layout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
    }
    StatusBar.setStatusBarHidden(true);
    return () => {
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('visible');
      }
      StatusBar.setStatusBarHidden(false);
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: '', animation: 'fade' }} />
      <Stack.Screen
        name="content"
        options={{
          headerShown: false,
          autoHideHomeIndicator: true,
          title: '',
          orientation: 'landscape',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
