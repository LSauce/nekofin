import HeaderBackButton from '@/components/HeaderBackButton';
import { isGreaterThanOrEqual26 } from '@/lib/utils';
import { Stack } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';

export default function HomeLayout() {
  const backgroundColor = useColorScheme() === 'dark' ? 'black' : 'white';

  return (
    <Stack
      screenOptions={{
        headerTransparent: Platform.OS === 'ios',
        headerShadowVisible: false,
        headerBlurEffect: isGreaterThanOrEqual26 ? undefined : 'prominent',
        headerLeft: HeaderBackButton,
        headerLargeStyle: {
          backgroundColor: isGreaterThanOrEqual26 ? undefined : backgroundColor,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '搜索',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
    </Stack>
  );
}
