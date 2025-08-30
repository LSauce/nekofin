import { useSettingsColors } from '@/hooks/useSettingsColors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export interface SettingsRowProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  imageUri?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  subtitle,
  icon,
  imageUri,
  onPress,
  showArrow = true,
  rightComponent,
  containerStyle,
}) => {
  const { textColor, secondaryTextColor, backgroundColor, accentColor } = useSettingsColors();

  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor }, containerStyle]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.settingImage} contentFit="cover" />
        ) : icon ? (
          <MaterialIcons name={icon} size={24} color={accentColor} style={styles.settingIcon} />
        ) : null}
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
          <MaterialIcons name="chevron-right" size={24} color={secondaryTextColor} />
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
  settingImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
