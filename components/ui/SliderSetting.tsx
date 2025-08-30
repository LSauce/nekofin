import { useSettingsColors } from '@/hooks/useSettingsColors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { useSharedValue } from 'react-native-reanimated';

export interface SliderSettingProps {
  title: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
  subtitle?: string;
}

export const SliderSetting: React.FC<SliderSettingProps> = ({
  title,
  value,
  min,
  max,
  onValueChange,
  formatValue,
  subtitle,
}) => {
  const { textColor, secondaryTextColor, accentColor } = useSettingsColors();

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

const styles = StyleSheet.create({
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
});

export default SliderSetting;
