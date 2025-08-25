import PageScrollView from '@/components/PageScrollView';
import { Section } from '@/components/ui/Section';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import {
  Platform,
  PlatformColor,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ColorValue,
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const backgroundColorDefault = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const secondaryTextColorDefault = useThemeColor({ light: '#666', dark: '#999' }, 'text');

  const backgroundColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('systemGroupedBackground') : backgroundColorDefault;
  const cardBackgroundColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('secondarySystemGroupedBackground') : backgroundColor;
  const secondaryTextColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('secondaryLabel') : secondaryTextColorDefault;
  const { currentServer, servers } = useMediaServers();
  const { accentColor, setAccentColor } = useAccentColor();

  const SettingItem = (props: React.ComponentProps<typeof SettingsRow>) => (
    <SettingsRow {...props} />
  );

  const ColorOption = ({ color, isSelected }: { color: string; isSelected: boolean }) => (
    <TouchableOpacity
      style={[
        styles.colorOption,
        { backgroundColor: color },
        isSelected && styles.colorOptionSelected,
      ]}
      onPress={() => setAccentColor(color)}
    >
      {isSelected && <MaterialIcons name="check" size={20} color="#fff" />}
    </TouchableOpacity>
  );

  return (
    <PageScrollView showsVerticalScrollIndicator={false}>
      <Section title="服务器" titleColor={secondaryTextColor}>
        <SettingItem
          title="当前服务器"
          subtitle={currentServer?.name || '未选择'}
          icon="dns"
          onPress={() => router.push('/media')}
          disableBorder
        />
        <SettingItem
          title="服务器列表"
          subtitle={`${servers.length} 个服务器`}
          icon="list"
          onPress={() => router.push('/media')}
          disableBorder
        />
      </Section>

      <Section
        title="外观"
        titleColor={secondaryTextColor}
        groupBackgroundColor={cardBackgroundColor}
      >
        <View style={[styles.settingItem, styles.settingItemNoBorder]}>
          <View style={styles.settingItemLeft}>
            <MaterialIcons
              name="palette"
              size={24}
              color={accentColor}
              style={styles.settingIcon}
            />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: textColor }]}>主题色</Text>
              <Text style={[styles.settingSubtitle, { color: secondaryTextColor }]}>
                选择应用的主题颜色
              </Text>
            </View>
          </View>
          <View style={styles.colorOptions}>
            <View style={styles.colorRow}>
              <ColorOption color="#9C4DFF" isSelected={accentColor === '#9C4DFF'} />
              <ColorOption color="#FF6B6B" isSelected={accentColor === '#FF6B6B'} />
              <ColorOption color="#4ECDC4" isSelected={accentColor === '#4ECDC4'} />
            </View>
            <View style={styles.colorRow}>
              <ColorOption color="#45B7D1" isSelected={accentColor === '#45B7D1'} />
              <ColorOption color="#96CEB4" isSelected={accentColor === '#96CEB4'} />
              <ColorOption color="#FFEAA7" isSelected={accentColor === '#FFEAA7'} />
            </View>
          </View>
        </View>
      </Section>

      <Section title="播放">
        <SettingItem
          title="弹幕设置"
          subtitle="配置弹幕显示选项"
          icon="chat"
          onPress={() => router.push('/danmaku-settings')}
          disableBorder
        />
      </Section>

      <Section title="关于">
        <SettingItem
          title="版本信息"
          subtitle="nekofin v1.0.0"
          icon="info"
          showArrow={false}
          disableBorder
        />
        <SettingItem
          title="开源协议"
          subtitle="MIT License"
          icon="code"
          showArrow={false}
          disableBorder
        />
      </Section>
    </PageScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  settingItemNoBorder: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  colorOptions: {
    flexDirection: 'column',
    gap: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    borderWidth: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16 + 24 + 12,
    backgroundColor: '#eee',
  },
});
