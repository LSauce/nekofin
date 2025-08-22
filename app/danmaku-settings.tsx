import { Header } from '@/components/ui/Header';
import { useThemeColor } from '@/hooks/useThemeColor';
import { defaultSettings, useDanmakuSettings } from '@/lib/contexts/DanmakuSettingsContext';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import {
  Platform,
  PlatformColor,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  type ColorValue,
} from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { useSharedValue } from 'react-native-reanimated';

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const backgroundColorDefault = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const cardBackgroundColor: ColorValue =
    Platform.OS === 'ios'
      ? PlatformColor('secondarySystemGroupedBackground')
      : backgroundColorDefault;
  const secondaryTextColorDefault = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const secondaryTextColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('secondaryLabel') : secondaryTextColorDefault;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: secondaryTextColor }]}>{title}</Text>
      <View style={[styles.groupContainer, { backgroundColor: cardBackgroundColor }]}>
        {children}
      </View>
    </View>
  );
};

const SliderSetting = ({
  title,
  value,
  min,
  max,
  onValueChange,
  formatValue,
  subtitle,
}: {
  title: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
  subtitle?: string;
}) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const secondaryTextColorDefault = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const { accentColor } = useAccentColor();
  const secondaryTextColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('secondaryLabel') : secondaryTextColorDefault;

  const progressValue = useSharedValue((value - min) / (max - min));
  const minValue = useSharedValue(min);
  const maxValue = useSharedValue(max);

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderTitleContainer}>
          <Text style={[styles.settingTitle, { color: textColor }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: secondaryTextColor }]}>{subtitle}</Text>
          )}
        </View>
        <Text style={[styles.sliderValue, { color: accentColor }]}>
          {formatValue ? formatValue(value) : value.toString()}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        containerStyle={{
          overflow: 'hidden',
          borderRadius: 999,
        }}
        progress={progressValue}
        minimumValue={minValue}
        maximumValue={maxValue}
        onValueChange={(progress) => onValueChange(min + progress * (max - min))}
        theme={{
          minimumTrackTintColor: accentColor,
          maximumTrackTintColor: secondaryTextColor as string,
          bubbleBackgroundColor: accentColor,
        }}
      />
    </View>
  );
};

const SwitchSetting = ({
  title,
  value,
  onValueChange,
  subtitle,
  isLast = false,
}: {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  subtitle?: string;
  isLast?: boolean;
}) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const secondaryTextColorDefault = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const secondaryTextColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('secondaryLabel') : secondaryTextColorDefault;
  const separatorColor: ColorValue = Platform.OS === 'ios' ? PlatformColor('separator') : '#eee';

  return (
    <View>
      <View
        style={[
          styles.switchItem,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: separatorColor,
          },
        ]}
      >
        <View style={styles.switchTextContainer}>
          <Text style={[styles.settingTitle, { color: textColor }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: secondaryTextColor }]}>{subtitle}</Text>
          )}
        </View>
        <Switch value={value} onValueChange={onValueChange} />
      </View>
    </View>
  );
};

export default function DanmakuSettingsScreen() {
  const { settings, setSettings } = useDanmakuSettings();

  const backgroundColorDefault = useThemeColor({ light: '#fff', dark: '#000' }, 'background');

  const backgroundColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('systemGroupedBackground') : backgroundColorDefault;
  const separatorColor: ColorValue = Platform.OS === 'ios' ? PlatformColor('separator') : '#eee';

  const updateSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const toggleFilter = (bit: number) => {
    const newFilter = settings.danmakuFilter ^ bit;
    updateSetting('danmakuFilter', newFilter);
  };

  const toggleModeFilter = (bit: number) => {
    const newFilter = settings.danmakuModeFilter ^ bit;
    updateSetting('danmakuModeFilter', newFilter);
  };

  const handleResetToDefault = () => {
    setSettings(defaultSettings);
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor }]}>
        <Header title="弹幕设置" />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <SettingSection title="基础设置">
            <SliderSetting
              title="透明度"
              subtitle="弹幕显示的透明度"
              value={settings.opacity}
              min={0.1}
              max={1.0}
              onValueChange={(value) => updateSetting('opacity', value)}
              formatValue={(value) => `${Math.round(value * 100)}%`}
            />
            <View style={[styles.separator, { backgroundColor: separatorColor }]} />
            <SliderSetting
              title="字体大小"
              subtitle="弹幕文字的大小"
              value={settings.fontSize}
              min={12}
              max={36}
              onValueChange={(value) => updateSetting('fontSize', value)}
              formatValue={(value) => `${value}px`}
            />
            <View style={[styles.separator, { backgroundColor: separatorColor }]} />
            <SliderSetting
              title="显示区域"
              subtitle="弹幕在屏幕上的显示范围"
              value={settings.heightRatio}
              min={0.3}
              max={1.0}
              onValueChange={(value) => updateSetting('heightRatio', value)}
              formatValue={(value) => `${Math.round(value * 100)}%`}
            />
            <View style={[styles.separator, { backgroundColor: separatorColor }]} />
            <SliderSetting
              title="时间偏移"
              subtitle="弹幕显示时间的调整"
              value={settings.curEpOffset}
              min={-10}
              max={10}
              onValueChange={(value) => updateSetting('curEpOffset', value)}
              formatValue={(value) => `${value > 0 ? '+' : ''}${value}s`}
            />
          </SettingSection>

          <SettingSection title="弹幕来源过滤">
            <SwitchSetting
              title="B站弹幕"
              subtitle="显示来自哔哩哔哩的弹幕"
              value={(settings.danmakuFilter & 1) !== 1}
              onValueChange={() => toggleFilter(1)}
            />
            <SwitchSetting
              title="巴哈弹幕"
              subtitle="显示来自巴哈姆特的弹幕"
              value={(settings.danmakuFilter & 2) !== 2}
              onValueChange={() => toggleFilter(2)}
            />
            <SwitchSetting
              title="弹弹Play弹幕"
              subtitle="显示来自弹弹Play的弹幕"
              value={(settings.danmakuFilter & 4) !== 4}
              onValueChange={() => toggleFilter(4)}
            />
            <SwitchSetting
              title="其他来源弹幕"
              subtitle="显示来自其他平台的弹幕"
              value={(settings.danmakuFilter & 8) !== 8}
              onValueChange={() => toggleFilter(8)}
              isLast
            />
          </SettingSection>

          <SettingSection title="弹幕类型过滤">
            <SwitchSetting
              title="底部弹幕"
              subtitle="显示固定在底部的弹幕"
              value={(settings.danmakuModeFilter & 1) !== 1}
              onValueChange={() => toggleModeFilter(1)}
            />
            <SwitchSetting
              title="顶部弹幕"
              subtitle="显示固定在顶部的弹幕"
              value={(settings.danmakuModeFilter & 2) !== 2}
              onValueChange={() => toggleModeFilter(2)}
            />
            <SwitchSetting
              title="滚动弹幕"
              subtitle="显示从右到左滚动的弹幕"
              value={(settings.danmakuModeFilter & 4) !== 4}
              onValueChange={() => toggleModeFilter(4)}
              isLast
            />
          </SettingSection>

          <View style={styles.bottomSpacing} />

          <View style={styles.resetSection}>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: '#FF6B6B' }]}
              onPress={handleResetToDefault}
            >
              <Text style={styles.resetButtonText}>恢复默认设置</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
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
  groupContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
    backgroundColor: '#eee',
  },
  sliderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sliderTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  bottomSpacing: {
    height: 60,
  },
  resetSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
