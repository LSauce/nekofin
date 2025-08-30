import { useSettingsColors } from '@/hooks/useSettingsColors';
import React from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

type SectionProps = ViewProps & {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
  showSeparators?: boolean;
  separatorColor?: string;
  separatorInsetLeft?: number;
};

export function Section({
  title,
  titleColor,
  showSeparators = true,
  separatorColor,
  separatorInsetLeft = 16 + 24 + 12,
  style,
  children,
  ...rest
}: SectionProps) {
  const childArray = React.Children.toArray(children).filter(Boolean);

  const { textColor, backgroundColor, separatorColor: defaultSeparatorColor } = useSettingsColors();

  const finalSeparatorColor = separatorColor || defaultSeparatorColor;

  return (
    <View style={[styles.section, style]} {...rest}>
      <Text
        style={[styles.sectionTitle, titleColor ? { color: titleColor } : { color: textColor }]}
      >
        {title}
      </Text>
      <View style={[styles.groupContainer, { backgroundColor }]}>
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {showSeparators && index < childArray.length - 1 ? (
              <View
                style={[
                  styles.separator,
                  separatorInsetLeft ? { marginLeft: separatorInsetLeft } : null,
                  { backgroundColor: finalSeparatorColor },
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
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
