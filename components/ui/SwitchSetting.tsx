import { useSettingsColors } from '@/hooks/useSettingsColors';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

export interface SwitchSettingProps {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  subtitle?: string;
  isLast?: boolean;
}

export const SwitchSetting: React.FC<SwitchSettingProps> = ({
  title,
  value,
  onValueChange,
  subtitle,
  isLast = false,
}) => {
  const { textColor, secondaryTextColor, separatorColor } = useSettingsColors();

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

const styles = StyleSheet.create({
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
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default SwitchSetting;
