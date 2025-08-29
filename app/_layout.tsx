import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import 'react-native-reanimated';

import HeaderLeftComponent from '@/components/HeaderLeftComponent';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DanmakuSettingsProvider } from '@/lib/contexts/DanmakuSettingsContext';
import { MediaServerProvider } from '@/lib/contexts/MediaServerContext';
import { ThemeColorProvider } from '@/lib/contexts/ThemeColorContext';
import { storage } from '@/lib/storage';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
      structuralSharing: true,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key: string) => storage.getString(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MediaServerProvider>
          <DanmakuSettingsProvider>
            <ThemeColorProvider>
              <BottomSheetModalProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack
                    screenOptions={{
                      headerTransparent: Platform.OS === 'ios',
                      headerBackground: TabBarBackground,
                      headerBackTitle: '返回',
                      headerLeft: HeaderLeftComponent,
                    }}
                  >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="media/player"
                      options={{
                        headerShown: false,
                        presentation: 'fullScreenModal',
                        autoHideHomeIndicator: true,
                      }}
                    />
                    <Stack.Screen
                      name="danmaku-settings"
                      options={{
                        title: '弹幕设置',
                        headerShown: true,
                      }}
                    />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                </ThemeProvider>
              </BottomSheetModalProvider>
            </ThemeColorProvider>
          </DanmakuSettingsProvider>
        </MediaServerProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}
