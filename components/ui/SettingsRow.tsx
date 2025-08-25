import { useThemeColor } from '@/hooks/useThemeColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Platform,
  PlatformColor,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ColorValue,
} from 'react-native';

export interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
  disableBorder?: boolean;
  containerStyle?: any;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  showArrow = true,
  rightComponent,
  disableBorder = false,
  containerStyle,
}) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const secondaryTextColorDefault = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const { accentColor } = useAccentColor();

  const cardBackgroundColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('secondarySystemGroupedBackground') : 'transparent';
  const secondaryTextColor: ColorValue =
    Platform.OS === 'ios' ? PlatformColor('secondaryLabel') : secondaryTextColorDefault;

  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: cardBackgroundColor },
        Platform.OS === 'ios' && disableBorder ? styles.settingItemNoBorder : null,
        containerStyle,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <MaterialIcons
          name={icon as any}
          size={24}
          color={accentColor}
          style={styles.settingIcon}
        />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: textColor }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.settingSubtitle, { color: secondaryTextColor }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.settingItemRight}>
        {rightComponent}
        {showArrow && onPress ? (
          <MaterialIcons name="chevron-right" size={24} color={secondaryTextColor as any} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});

export default SettingsRow;
