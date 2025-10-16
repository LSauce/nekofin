import { GroupedStackRoutes } from '@/components/GroupedStackRoutes';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: Platform.OS === 'ios',
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
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
