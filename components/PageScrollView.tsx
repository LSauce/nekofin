import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { HeaderHeightContext } from '@react-navigation/elements';
import React, { useContext } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PageScrollViewProps = {
  children: React.ReactNode;
  headerHeight?: number;
  bottomTabBarHeight?: number;
} & ScrollViewProps;

export default function PageScrollView({
  children,
  style,
  headerHeight,
  bottomTabBarHeight,
  ...rest
}: PageScrollViewProps) {
  const insets = useSafeAreaInsets();
  const headerHeightFromContext = useContext(HeaderHeightContext);
  const bottomTabBarHeightFromContext = useContext(BottomTabBarHeightContext);

  return (
    <ScrollView
      style={[
        {
          flex: 1,
          paddingTop: headerHeight ?? headerHeightFromContext ?? insets.top,
          paddingBottom: bottomTabBarHeight ?? bottomTabBarHeightFromContext,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
