import { Stack } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';

export default function Layout() {
  return (
    <>
      <SystemBars hidden />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            autoHideHomeIndicator: true,
            title: '',
            animation: 'fade',
          }}
        />
      </Stack>
    </>
  );
}
