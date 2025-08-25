import { DANDAN_COMMENT_MODE } from '@/services/dandanplay';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, TextStyle } from 'react-native';

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
  const initTranslateX = useMemo(() => {
    const isLeftScroll = data.mode === DANDAN_COMMENT_MODE.Scroll;
    const clampedOffset = Math.max(0, Math.min(data.startOffsetMs || 0, data.durationMs));
    const totalDistance = isLeftScroll ? -width - 300 : width + 300;
    const progressed = Math.max(0, Math.min(1, clampedOffset / data.durationMs));
    return totalDistance * progressed;
  }, [data.mode, data.startOffsetMs, data.durationMs, width]);

  const translateX = useRef(new Animated.Value(initTranslateX)).current;

  const originalDurationRef = useRef<number>(data.durationMs);
  const remainingDurationRef = useRef<number>(data.durationMs);
  const runStartedAtRef = useRef<number | null>(null);
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    originalDurationRef.current = data.durationMs;
    const clampedOffset = Math.max(0, Math.min(data.startOffsetMs || 0, data.durationMs));
    remainingDurationRef.current = Math.max(0, data.durationMs - clampedOffset);
  }, [data.durationMs, data.startOffsetMs, data.mode, width, translateX]);

  const handleExpire = useCallback(() => {
    onExpire(data.id);
  }, [data.id, onExpire]);

  const scheduleFadeAndRemoval = useCallback(() => {
    if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);

    if (remainingDurationRef.current > 0) {
      removeTimeoutRef.current = setTimeout(() => {
        handleExpire();
      }, remainingDurationRef.current);
    } else {
      handleExpire();
    }
  }, [handleExpire]);

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
      const remaining = remainingDurationRef.current;

      if (remaining <= 0) {
        handleExpire();
        return;
      }

      Animated.timing(translateX, {
        toValue: totalDistance,
        duration: Math.max(0, remaining),
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    }
  }, [data.mode, translateX, width, scheduleFadeAndRemoval, handleExpire]);

  const pauseRun = useCallback(() => {
    if (runStartedAtRef.current == null) return;
    const elapsed = Date.now() - runStartedAtRef.current;
    runStartedAtRef.current = null;

    if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);

    remainingDurationRef.current = Math.max(0, remainingDurationRef.current - elapsed);

    translateX.stopAnimation();
  }, [translateX]);

  useEffect(() => {
    if (isPlaying) {
      startOrResume();
    } else {
      pauseRun();
    }
    return () => {
      if (removeTimeoutRef.current) clearTimeout(removeTimeoutRef.current);
    };
  }, [isPlaying, startOrResume, pauseRun, translateX]);

  const style = useMemo(
    () => ({
      position: 'absolute' as const,
      top: data.top,
      left:
        data.mode === DANDAN_COMMENT_MODE.Scroll
          ? width
          : data.mode === DANDAN_COMMENT_MODE.ScrollBottom
            ? -100
            : 0,
      width:
        data.mode === DANDAN_COMMENT_MODE.Top || data.mode === DANDAN_COMMENT_MODE.Bottom
          ? ('100%' as `${number}%`)
          : undefined,
      transform:
        data.mode === DANDAN_COMMENT_MODE.Scroll || data.mode === DANDAN_COMMENT_MODE.ScrollBottom
          ? [{ translateX }]
          : [],
    }),
    [data.top, data.mode, width, translateX],
  );

  const textStyle = useMemo(
    () => [
      {
        fontSize,
        fontFamily: fontFamily.replace(/"/g, ''),
        ...(fontOptions && {
          fontStyle: fontOptions.includes('italic') ? 'italic' : 'normal',
        }),
        fontWeight: fontOptions?.includes('bold') ? 'bold' : '600',
      } as TextStyle,
    ],
    [fontSize, fontFamily, fontOptions],
  );

  const isTopOrBottom =
    data.mode === DANDAN_COMMENT_MODE.Top || data.mode === DANDAN_COMMENT_MODE.Bottom;

  return (
    <Animated.View
      style={[style, isTopOrBottom ? styles.centerRow : null]}
      renderToHardwareTextureAndroid
      needsOffscreenAlphaCompositing={false}
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
