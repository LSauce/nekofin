import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import React, { useContext } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

type PageScrollViewProps = {
  children: React.ReactNode;
  bottomTabBarHeight?: number;
} & ScrollViewProps;

export default function PageScrollView({
  children,
  style,
  bottomTabBarHeight,
  ...rest
}: PageScrollViewProps) {
  const bottomTabBarHeightFromContext = useContext(BottomTabBarHeightContext);

  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      scrollToOverflowEnabled={true}
      nestedScrollEnabled
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingBottom: bottomTabBarHeight ?? bottomTabBarHeightFromContext,
      }}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
