import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren, ReactElement } from 'react';
import { Easing, ScrollViewProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

const HEADER_HEIGHT = 450;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor?: { dark: string; light: string };
  headerHeight?: number;
  enableMaskView?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
  contentInsetAdjustmentBehavior?: ScrollViewProps['contentInsetAdjustmentBehavior'];
  contentInset?: ScrollViewProps['contentInset'];
  style?: StyleProp<ViewStyle>;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  headerHeight = HEADER_HEIGHT,
  enableMaskView = false,
  containerStyle,
  contentStyle,
  showsVerticalScrollIndicator = true,
  refreshControl,
  contentInsetAdjustmentBehavior,
  contentInset,
  style,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const linearColor = useThemeColor(
    { light: 'rgba(255,255,255,1)', dark: 'rgba(0,0,0,1)' },
    'background',
  );

  const gradientStartColor = colorScheme === 'light' ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)';

  const { colors, locations } = easeGradient({
    colorStops: {
      0: { color: gradientStartColor },
      1: { color: String(linearColor) },
    },
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    extraColorStopsPerTransition: 24,
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-headerHeight, 0, headerHeight],
            [-headerHeight / 2, 0, headerHeight * 0.75],
          ),
        },
        {
          scale: interpolate(scrollOffset.value, [-headerHeight, 0, headerHeight], [2, 1, 1]),
        },
      ],
    };
  });

  return (
    <ThemedView style={[styles.container, containerStyle]}>
      <Animated.ScrollView
        refreshControl={refreshControl}
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
        contentInset={contentInset}
        style={style}
      >
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: headerBackgroundColor?.[colorScheme], height: headerHeight },
            headerAnimatedStyle,
          ]}
        >
          {headerImage}
        </Animated.View>
        {enableMaskView ? (
          <ThemedView
            style={{
              position: 'relative',
              flex: 1,
              top: -50,
              backgroundColor: 'transparent',
            }}
          >
            <LinearGradient
              colors={colors as unknown as readonly [string, string, ...string[]]}
              locations={locations as unknown as readonly [number, number, ...number[]]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: -180,
                height: 200,
              }}
            />
            <ThemedView style={[styles.content, contentStyle]}>{children}</ThemedView>
          </ThemedView>
        ) : (
          <ThemedView style={[styles.content, contentStyle]}>{children}</ThemedView>
        )}
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
    position: 'relative',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    gap: 16,
  },
});
