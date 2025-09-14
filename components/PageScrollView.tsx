import React from 'react';
import { Platform, ScrollView, ScrollViewProps } from 'react-native';

type PageScrollViewProps = {
  children: React.ReactNode;
  bottomTabBarHeight?: number;
} & ScrollViewProps;

export default function PageScrollView({
  children,
  style,
  bottomTabBarHeight = 20,
  ...rest
}: PageScrollViewProps) {
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      scrollToOverflowEnabled={true}
      nestedScrollEnabled
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingBottom: bottomTabBarHeight + (Platform.OS === 'android' ? 100 : 0),
      }}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
