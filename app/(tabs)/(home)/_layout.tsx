import { Stack } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';

export default function HomeLayout() {
  const backgroundColor = useColorScheme() === 'dark' ? 'black' : 'white';

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '首页',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
          headerTransparent: Platform.OS === 'ios',
          headerLargeTitleStyle: {
            fontSize: 24,
          },
          headerBlurEffect: 'prominent',
          headerLargeStyle: {
            backgroundColor,
          },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
