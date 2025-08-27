import HeaderLeftComponent from '@/components/HeaderLeftComponent';
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
        headerLeft: HeaderLeftComponent,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '首页',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
          headerLargeTitleStyle: {
            fontSize: 24,
          },
          headerLargeStyle: {
            backgroundColor,
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
