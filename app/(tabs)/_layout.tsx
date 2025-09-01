import { Tabs } from '@/components/BottomTabs';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { accentColor } = useAccentColor();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accentColor,
      }}
      initialRouteName="(home)"
    >
      <Tabs.Screen redirect name="index" />
      <Tabs.Screen
        name="(home)"
        options={{
          title: '首页',
          tabBarIcon:
            Platform.OS === 'android'
              ? () => require('@/assets/icons/film.png')
              : ({ focused }) => (focused ? { sfSymbol: 'film.fill' } : { sfSymbol: 'film' }),
        }}
      />
      <Tabs.Screen
        name="(search)"
        options={{
          title: '搜索',
          tabBarIcon:
            Platform.OS === 'android'
              ? () => require('@/assets/icons/search.png')
              : ({ focused }) =>
                  focused ? { sfSymbol: 'magnifyingglass' } : { sfSymbol: 'magnifyingglass' },
        }}
      />
      <Tabs.Screen
        name="(favorites)"
        options={{
          title: '收藏',
          tabBarIcon:
            Platform.OS === 'android'
              ? () => require('@/assets/icons/heart.png')
              : ({ focused }) => (focused ? { sfSymbol: 'heart.fill' } : { sfSymbol: 'heart' }),
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: '设置',
          tabBarIcon:
            Platform.OS === 'android'
              ? () => require('@/assets/icons/settings.png')
              : ({ focused }) =>
                  focused ? { sfSymbol: 'gearshape.fill' } : { sfSymbol: 'gearshape' },
        }}
      />
    </Tabs>
  );
}
