import HeaderBackButton from '@/components/HeaderBackButton';
import { Stack } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';

export default function HomeLayout() {
  const backgroundColor = useColorScheme() === 'dark' ? 'black' : 'white';

  return (
    <Stack
      screenOptions={{
        headerTransparent: Platform.OS === 'ios',
        headerShadowVisible: false,
        headerBlurEffect: 'prominent',
        headerLeft: HeaderBackButton,
        headerLargeStyle: {
          backgroundColor,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '收藏',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
    </Stack>
  );
}
