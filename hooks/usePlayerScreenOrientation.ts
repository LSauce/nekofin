import * as NavigationBar from 'expo-navigation-bar';
import { useSegments } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function usePlayerScreenOrientation() {
  const segments = useSegments();

  useEffect(() => {
    if (segments.includes('player' as never)) {
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('hidden');
      }
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      return;
    }

    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('visible');
    }
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, [segments]);
}
