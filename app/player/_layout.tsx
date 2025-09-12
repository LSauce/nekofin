import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as StatusBar from 'expo-status-bar';
import { useEffect } from 'react';

export default function Layout() {
  useEffect(() => {
    NavigationBar.setVisibilityAsync('hidden');
    StatusBar.setStatusBarHidden(true);
    return () => {
      NavigationBar.setVisibilityAsync('visible');
      StatusBar.setStatusBarHidden(false);
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          autoHideHomeIndicator: true,
          title: '',
          orientation: 'landscape',
        }}
      />
    </Stack>
  );
}
