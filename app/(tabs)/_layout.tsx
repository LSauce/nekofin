import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const { accentColor } = useAccentColor();

  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index" hidden />
      <NativeTabs.Trigger name="(home)">
        <Label>首页</Label>
        <Icon
          drawable="film"
          sf={{ default: 'film', selected: 'film.fill' }}
          selectedColor={accentColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="(search)"
        options={{
          role: 'search',
        }}
      >
        <Label>搜索</Label>
        <Icon
          drawable="search"
          sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }}
          selectedColor={accentColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(favorites)">
        <Label>收藏</Label>
        <Icon
          drawable="heart"
          sf={{ default: 'heart', selected: 'heart.fill' }}
          selectedColor={accentColor}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <Label>设置</Label>
        <Icon
          drawable="settings"
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          selectedColor={accentColor}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
