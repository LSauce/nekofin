import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { accentColor } = useAccentColor();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accentColor,
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
        headerTransparent: Platform.OS === 'ios',
        headerBackground: TabBarBackground,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: '首页',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome name="film" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(search)"
        options={{
          title: '搜索',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome name="search" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(favorites)"
        options={{
          title: '收藏',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome name="heart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: '设置',
          headerShown: false,
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
