import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import {
  Platform,
  PlatformColor,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type ViewProps,
} from 'react-native';

type SectionProps = ViewProps & {
  title: string;
  titleColor?: ColorValue;
  groupBackgroundColor?: ColorValue;
  children: React.ReactNode;
  showSeparators?: boolean;
  separatorColor?: ColorValue;
  separatorInsetLeft?: number;
};

const separatorColorDefault: ColorValue =
  Platform.OS === 'ios' ? PlatformColor('separator') : '#eee';
const groupBackgroundColorDefault: ColorValue =
  Platform.OS === 'ios' ? PlatformColor('secondarySystemGroupedBackground') : '#fff';

export function Section({
  title,
  titleColor,
  groupBackgroundColor = groupBackgroundColorDefault,
  showSeparators = true,
  separatorColor = separatorColorDefault,
  separatorInsetLeft = 16 + 24 + 12,
  style,
  children,
  ...rest
}: SectionProps) {
  const childArray = React.Children.toArray(children).filter(Boolean);

  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const groupBackgroundColorWithTheme = useThemeColor(
    { light: groupBackgroundColorDefault, dark: '#000' },
    'background',
  );

  return (
    <View style={[styles.section, style]} {...rest}>
      <Text
        style={[styles.sectionTitle, titleColor ? { color: titleColor } : { color: textColor }]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.groupContainer,
          groupBackgroundColor
            ? { backgroundColor: groupBackgroundColor }
            : { backgroundColor: groupBackgroundColorWithTheme },
        ]}
      >
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {showSeparators && index < childArray.length - 1 ? (
              <View
                style={[
                  styles.separator,
                  separatorInsetLeft ? { marginLeft: separatorInsetLeft } : null,
                  separatorColor ? { backgroundColor: separatorColor } : null,
                ]}
              />
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </View>
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
  groupContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
