import { useSettingsColors } from '@/hooks/useSettingsColors';
import React from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

type SectionProps = ViewProps & {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
  showSeparators?: boolean;
  separatorInsetLeft?: number;
};

export function Section({
  title,
  titleColor,
  showSeparators = true,
  separatorInsetLeft = 16 + 24 + 12,
  style,
  children,
  ...rest
}: SectionProps) {
  const childArray = React.Children.toArray(children).filter(Boolean);

  const { textColor, secondarySystemGroupedBackground, separatorColor } = useSettingsColors();

  return (
    <View style={[styles.section, style]} {...rest}>
      <Text
        style={[styles.sectionTitle, titleColor ? { color: titleColor } : { color: textColor }]}
      >
        {title}
      </Text>
      <View style={[styles.groupContainer, { backgroundColor: secondarySystemGroupedBackground }]}>
        {childArray.map((child, index) => {
          const key =
            React.isValidElement(child) && child.key != null ? String(child.key) : String(index);
          return (
            <React.Fragment key={key}>
              {child}
              {showSeparators && index < childArray.length - 1 ? (
                <View
                  style={[
                    styles.separator,
                    separatorInsetLeft ? { marginLeft: separatorInsetLeft } : null,
                    { backgroundColor: separatorColor },
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
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
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
