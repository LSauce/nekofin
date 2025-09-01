import HeaderBackButton from '@/components/HeaderBackButton';
import { compareVersions } from 'compare-versions';
import { Stack } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';

export default function HomeLayout() {
  const backgroundColor = useColorScheme() === 'dark' ? 'black' : 'white';
  const iosVersion = Platform.OS === 'ios' ? Platform.Version : '';
  const isGreaterThanOrEqual26 = compareVersions(iosVersion, '26.0') >= 0;

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
          title: '首页',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
          headerLargeStyle: {
            backgroundColor: isGreaterThanOrEqual26 ? undefined : backgroundColor,
          },
        }}
      />
      <Stack.Screen
        name="series/[id]"
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerBlurEffect: 'none',
        }}
      />
      <Stack.Screen
        name="season/[id]"
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerBlurEffect: 'none',
        }}
      />
      <Stack.Screen
        name="movie/[id]"
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerBlurEffect: 'none',
        }}
      />
      <Stack.Screen
        name="folder/[id]"
        options={{
          title: '查看全部',
        }}
      />
      <Stack.Screen
        name="viewall/[type]"
        options={{
          title: '查看全部',
        }}
      />
    </Stack>
  );
}
