import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { Icon, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { accentColor } = useAccentColor();

  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index" hidden />
      <NativeTabs.Trigger
        name="(home)"
        options={{
          title: '首页',
        }}
      >
        <Icon
          {...(Platform.OS === 'android' && { src: require('@/assets/icons/film.png') })}
          sf={{ default: 'film', selected: 'film.fill' }}
          selectedColor={accentColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(search)"
        options={{
          title: '搜索',
          role: 'search',
        }}
      >
        <Icon
          {...(Platform.OS === 'android' && { src: require('@/assets/icons/search.png') })}
          sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }}
          selectedColor={accentColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(favorites)"
        options={{
          title: '收藏',
        }}
      >
        <Icon
          {...(Platform.OS === 'android' && { src: require('@/assets/icons/heart.png') })}
          sf={{ default: 'heart', selected: 'heart.fill' }}
          selectedColor={accentColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(settings)"
        options={{
          title: '设置',
        }}
      >
        <Icon
          {...(Platform.OS === 'android' && { src: require('@/assets/icons/settings.png') })}
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          selectedColor={accentColor}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
