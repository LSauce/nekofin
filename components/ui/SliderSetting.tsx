import { getSystemColor } from '@/constants/SystemColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSettingsColors } from '@/hooks/useSettingsColors';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { useSharedValue } from 'react-native-reanimated';

import { SettingsRow } from './SettingsRow';

export interface SliderSettingProps {
  title: string;
  value: number;
  min: number;
  max: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  formatValue?: (value: number) => string;
  subtitle?: string;
  step?: number;
}

export const SliderSetting: React.FC<SliderSettingProps> = ({
  title,
  value,
  min,
  max,
  onValueChange,
  onSlidingComplete,
  formatValue,
  subtitle,
  step = 0.01,
}) => {
  const theme = useColorScheme() ?? 'light';
  const { accentColor } = useSettingsColors();

  const progressValue = useSharedValue((value - min) / (max - min));
  const minValue = useSharedValue(min);
  const maxValue = useSharedValue(max);

  useEffect(() => {
    progressValue.value = (value - min) / (max - min);
  }, [value, min, max, progressValue]);

  const maximumTrackTintColor = getSystemColor('systemGray5', theme);

  const calculateValue = (progress: number) => {
    const rawValue = min + progress * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  };

  return (
    <View style={styles.container}>
      <SettingsRow
        title={title}
        subtitle={subtitle}
        showArrow={false}
        rightComponent={
          <Text style={[styles.valueText, { color: accentColor }]}>
            {formatValue ? formatValue(value) : value.toString()}
          </Text>
        }
        containerStyle={styles.rowContainer}
      />
      <View style={styles.sliderWrapper}>
        <Slider
          style={styles.slider}
          containerStyle={{
            overflow: 'hidden',
            borderRadius: 999,
          }}
          progress={progressValue}
          minimumValue={minValue}
          maximumValue={maxValue}
          bubble={(progress) => {
            const calculatedValue = calculateValue(progress);
            return formatValue ? formatValue(calculatedValue) : calculatedValue.toString();
          }}
          bubbleTextStyle={{
            fontFamily: 'Roboto',
          }}
          onValueChange={(progress) => {
            progressValue.value = progress;
            onValueChange?.(progress);
          }}
          onSlidingComplete={(progress) => {
            const calculatedValue = calculateValue(progress);
            onSlidingComplete?.(calculatedValue);
          }}
          theme={{
            minimumTrackTintColor: accentColor,
            maximumTrackTintColor: maximumTrackTintColor,
            bubbleBackgroundColor: accentColor,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  sliderWrapper: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 20,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
});

export default SliderSetting;
