import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { DanmakuSettingsProvider } from '@/lib/contexts/DanmakuSettingsContext';
import { MediaServerProvider } from '@/lib/contexts/MediaServerContext';
import { ThemeColorProvider } from '@/lib/contexts/ThemeColorContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const queryClient = new QueryClient();

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MediaServerProvider>
          <DanmakuSettingsProvider>
            <ThemeColorProvider>
              <BottomSheetModalProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack>
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
                      name="viewall/[type]"
                      options={{
                        headerShown: false,
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
    </QueryClientProvider>
  );
}
