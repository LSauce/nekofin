import { DANDAN_COMMENT_MODE } from '@/services/dandanplay';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import StrokeText from '../StokeText';
import { ActiveBullet } from './DanmakuTypes';

const STROKE_COLOR = '#000';
const STROKE_WIDTH = 0.7;

export function Bullet({
  width,
  data,
  onExpire,
  fontSize,
  fontFamily,
  fontOptions,
  isPlaying,
}: {
  width: number;
  data: ActiveBullet;
  onExpire: (id: number) => void;
  fontSize: number;
  fontFamily: string;
  fontOptions: string;
  isPlaying: boolean;
}) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const originalDurationRef = useRef<number>(data.durationMs);
  const remainingDurationRef = useRef<number>(data.durationMs);
  const remainingToFadeRef = useRef<number>(Math.max(0, data.durationMs - 300));
  const runStartedAtRef = useRef<number | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    originalDurationRef.current = data.durationMs;
    const clampedOffset = Math.max(0, Math.min(data.startOffsetMs || 0, data.durationMs));
    remainingDurationRef.current = Math.max(0, data.durationMs - clampedOffset);
    remainingToFadeRef.current = Math.max(0, data.durationMs - 300 - clampedOffset);
    if (
      data.mode === DANDAN_COMMENT_MODE.Scroll ||
      data.mode === DANDAN_COMMENT_MODE.ScrollBottom
    ) {
      const isLeftScroll = data.mode === DANDAN_COMMENT_MODE.Scroll;
      const totalDistance = isLeftScroll ? -width - 300 : width + 300;
      const progressed = Math.max(0, Math.min(1, clampedOffset / data.durationMs));
      translateX.value = totalDistance * progressed;
    }
  }, [data.durationMs, data.startOffsetMs, data.mode, width, translateX]);

  const scheduleFadeAndRemoval = useCallback(() => {
    if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

    if (remainingDurationRef.current > 0) {
      removeTimeoutRef.current = setTimeout(() => {
        onExpire(data.id);
      }, remainingDurationRef.current + 100);
    }

    if (remainingToFadeRef.current > 0) {
      fadeTimeoutRef.current = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
      }, remainingToFadeRef.current);
    }
  }, [data.id, onExpire, opacity]);

  const startOrResume = useCallback(() => {
    if (runStartedAtRef.current != null) return;
    runStartedAtRef.current = Date.now();
    scheduleFadeAndRemoval();

    if (
      data.mode === DANDAN_COMMENT_MODE.Scroll ||
      data.mode === DANDAN_COMMENT_MODE.ScrollBottom
    ) {
      const isLeftScroll = data.mode === DANDAN_COMMENT_MODE.Scroll;
      const totalDistance = isLeftScroll ? -width - 300 : width + 300;
      const originalDuration = originalDurationRef.current;
      const remaining = remainingDurationRef.current;
      const progressed = Math.max(0, Math.min(1, 1 - remaining / originalDuration));
      const currentTranslate = totalDistance * progressed;
      translateX.value = currentTranslate;
      translateX.value = withTiming(totalDistance, {
        duration: Math.max(0, remaining),
        easing: Easing.linear,
      });
    }
  }, [data.mode, translateX, width, scheduleFadeAndRemoval]);

  const pauseRun = useCallback(() => {
    if (runStartedAtRef.current == null) return;
    const elapsed = Date.now() - runStartedAtRef.current;
    runStartedAtRef.current = null;

    if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

    remainingDurationRef.current = Math.max(0, remainingDurationRef.current - elapsed);
    remainingToFadeRef.current = Math.max(0, remainingToFadeRef.current - elapsed);

    cancelAnimation(translateX);
    cancelAnimation(opacity);
  }, [translateX, opacity]);

  useEffect(() => {
    if (isPlaying) {
      startOrResume();
    } else {
      pauseRun();
    }
    return () => {
      if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [isPlaying, startOrResume, pauseRun]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: data.top,
    left:
      data.mode === DANDAN_COMMENT_MODE.Scroll
        ? width
        : data.mode === DANDAN_COMMENT_MODE.ScrollBottom
          ? -100
          : 0,
    width:
      data.mode === DANDAN_COMMENT_MODE.Top || data.mode === DANDAN_COMMENT_MODE.Bottom
        ? '100%'
        : undefined,
    transform:
      data.mode === DANDAN_COMMENT_MODE.Scroll || data.mode === DANDAN_COMMENT_MODE.ScrollBottom
        ? [{ translateX: translateX.value }]
        : [],
    opacity: opacity.value,
  }));

  const textStyle = useMemo(
    () => [
      {
        fontSize,
        fontFamily: fontFamily.replace(/"/g, ''),
        ...(fontOptions && {
          fontStyle: (fontOptions.includes('italic') ? 'italic' : 'normal') as 'normal' | 'italic',
        }),
        fontWeight: (fontOptions?.includes('bold') ? 'bold' : '600') as 'bold' | '600',
      },
    ],
    [fontSize, fontFamily, fontOptions],
  );

  const isTopOrBottom =
    data.mode === DANDAN_COMMENT_MODE.Top || data.mode === DANDAN_COMMENT_MODE.Bottom;

  return (
    <Animated.View
      style={[style, isTopOrBottom ? styles.centerRow : null]}
      renderToHardwareTextureAndroid
    >
      <StrokeText
        text={data.text}
        style={[textStyle, { color: data.colorHex }]}
        strokeColor={STROKE_COLOR}
        strokeWidth={STROKE_WIDTH}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centerRow: {
    left: 0,
    width: '100%',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
});
