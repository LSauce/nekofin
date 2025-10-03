import { GroupedStackRoutes } from '@/components/GroupedStackRoutes';
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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '',
          headerTransparent: true,
        }}
      />
      {GroupedStackRoutes()}
      <Stack.Screen
        name="folder/[id]"
        options={{
          title: '查看全部',
        }}
      />
      <Stack.Screen
        name="view-all/[type]"
        options={{
          title: '查看全部',
        }}
      />
    </Stack>
  );
}
