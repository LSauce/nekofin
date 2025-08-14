import { DANDAN_COMMENT_MODE, DandanComment, DandanCommentMode } from '@/services/dandanplay';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type DanmakuLayerProps = {
  currentTimeMs: number;
  isPlaying: boolean;
  comments: DandanComment[];
  density?: number;
  opacity?: number;
  speed?: number;
  fontSize?: number;
  heightRatio?: number;
  danmakuFilter?: number;
  danmakuModeFilter?: number;
  danmakuDensityLimit?: number;
  curEpOffset?: number;
  fontFamily?: string;
  fontOptions?: string;
};

type ActiveBullet = {
  id: number;
  text: string;
  colorHex: string;
  top: number;
  durationMs: number;
  mode: DandanCommentMode;
};

export function DanmakuLayer({
  currentTimeMs,
  isPlaying,
  comments,
  density = 1,
  opacity = 0.7,
  speed = 200,
  fontSize = 18,
  heightRatio = 0.9,
  danmakuFilter = 0,
  danmakuModeFilter = 0,
  danmakuDensityLimit = 0,
  curEpOffset = 0,
  fontFamily = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif',
  fontOptions = '',
}: DanmakuLayerProps) {
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState<ActiveBullet[]>([]);
  const lastSecondRef = useRef<number>(-1);
  const idRef = useRef<number>(1);
  const lineHeight = fontSize + 8;
  const rows = Math.max(6, Math.floor(((height * heightRatio) / lineHeight) * density));

  const layout = useMemo(() => {
    const topRows = Math.max(1, Math.floor(rows * 0.2));
    const bottomRows = Math.max(1, Math.floor(rows * 0.2));
    const scrollRows = Math.max(1, rows - topRows - bottomRows);
    return { topRows, bottomRows, scrollRows };
  }, [rows]);

  // 弹幕过滤和密度控制
  const filteredComments = useMemo(() => {
    if (!comments.length) return [];

    // 应用时间偏移
    const offsetComments = comments.map((c) => ({
      ...c,
      timeInSeconds: c.timeInSeconds + curEpOffset,
    }));

    // 应用弹幕来源过滤
    let filteredBySource = offsetComments;
    if (danmakuFilter > 0) {
      filteredBySource = offsetComments.filter((comment) => {
        const user = comment.user || '';

        // B站弹幕过滤
        if ((danmakuFilter & 1) === 1 && user.includes('[BiliBili]')) {
          return false;
        }

        // 巴哈弹幕过滤
        if ((danmakuFilter & 2) === 2 && user.includes('[Gamer]')) {
          return false;
        }

        // 弹弹Play弹幕过滤
        if ((danmakuFilter & 4) === 4 && user.startsWith('[') && user.endsWith(']')) {
          return false;
        }

        // 其他弹幕过滤
        if (
          (danmakuFilter & 8) === 8 &&
          !user.includes('[BiliBili]') &&
          !user.includes('[Gamer]') &&
          !user.startsWith('[')
        ) {
          return false;
        }

        return true;
      });
    }

    // 应用弹幕模式过滤
    let filteredByMode = filteredBySource;
    if (danmakuModeFilter > 0) {
      filteredByMode = filteredBySource.filter((comment) => {
        // 底部弹幕过滤
        if ((danmakuModeFilter & 1) === 1 && comment.mode === 4) {
          return false;
        }

        // 顶部弹幕过滤
        if ((danmakuModeFilter & 2) === 2 && comment.mode === 5) {
          return false;
        }

        // 滚动弹幕过滤
        if ((danmakuModeFilter & 4) === 4 && (comment.mode === 1 || comment.mode === 6)) {
          return false;
        }

        return true;
      });
    }

    // 应用密度限制
    if (danmakuDensityLimit > 0) {
      const containerWidth = width;
      const containerHeight = height * heightRatio - 18;
      const duration = Math.ceil(containerWidth / speed);
      const lines = Math.floor(containerHeight / fontSize) - 1;

      const limit = (9 - danmakuDensityLimit * 2) * lines;
      const verticalLimit = lines - 1 > 0 ? lines - 1 : 1;

      const timeBuckets: Record<number, number> = {};
      const verticalTimeBuckets: Record<number, number> = {};
      const resultComments: typeof filteredByMode = [];

      filteredByMode.forEach((comment) => {
        const timeIndex = Math.ceil(comment.timeInSeconds / duration);

        if (!timeBuckets[timeIndex]) {
          timeBuckets[timeIndex] = 0;
        }
        if (!verticalTimeBuckets[timeIndex]) {
          verticalTimeBuckets[timeIndex] = 0;
        }

        if (
          comment.mode === DANDAN_COMMENT_MODE.Top ||
          comment.mode === DANDAN_COMMENT_MODE.Bottom
        ) {
          if (verticalTimeBuckets[timeIndex] < verticalLimit) {
            verticalTimeBuckets[timeIndex]++;
            resultComments.push(comment);
          }
        } else {
          if (timeBuckets[timeIndex] < limit) {
            timeBuckets[timeIndex]++;
            resultComments.push(comment);
          }
        }
      });

      return resultComments;
    }

    return filteredByMode;
  }, [
    comments,
    curEpOffset,
    danmakuFilter,
    danmakuModeFilter,
    danmakuDensityLimit,
    width,
    height,
    heightRatio,
    speed,
    fontSize,
  ]);

  useEffect(() => {
    const nowSecond = Math.floor(currentTimeMs / 1000);
    if (!isPlaying) return;
    if (nowSecond === lastSecondRef.current) return;
    lastSecondRef.current = nowSecond;

    const slice = filteredComments.filter((c) => Math.floor(c.timeInSeconds) === nowSecond);
    if (slice.length === 0) return;

    let countScroll = 0;
    let countTop = 0;
    let countBottom = 0;
    const newActive: ActiveBullet[] = [];

    for (const c of slice) {
      if (c.mode === DANDAN_COMMENT_MODE.Top && countTop < layout.topRows) {
        newActive.push({
          id: idRef.current++,
          text: c.text,
          colorHex: c.colorHex,
          top: countTop * lineHeight,
          durationMs: 4000,
          mode: DANDAN_COMMENT_MODE.Top,
        });
        countTop += 1;
        continue;
      }
      if (c.mode === DANDAN_COMMENT_MODE.Bottom && countBottom < layout.bottomRows) {
        const bottomStart = height * heightRatio - layout.bottomRows * lineHeight - 18;
        newActive.push({
          id: idRef.current++,
          text: c.text,
          colorHex: c.colorHex,
          top: bottomStart + countBottom * lineHeight,
          durationMs: 4000,
          mode: DANDAN_COMMENT_MODE.Bottom,
        });
        countBottom += 1;
        continue;
      }
      if (
        (c.mode === DANDAN_COMMENT_MODE.Scroll || c.mode === DANDAN_COMMENT_MODE.ScrollBottom) &&
        countScroll < layout.scrollRows
      ) {
        const scrollStart = layout.topRows * lineHeight;
        const durationMs = Math.max(4000, Math.round(((width + 300) / speed) * 1000));
        newActive.push({
          id: idRef.current++,
          text: c.text,
          colorHex: c.colorHex,
          top: scrollStart + (countScroll % layout.scrollRows) * lineHeight,
          durationMs,
          mode: c.mode,
        });
        countScroll += 1;
      }
      if (newActive.length >= rows) break;
    }

    setActive((prev) => [...prev, ...newActive]);
  }, [
    currentTimeMs,
    isPlaying,
    filteredComments,
    rows,
    layout,
    height,
    width,
    speed,
    lineHeight,
    heightRatio,
  ]);

  const handleExpire = (id: number) => {
    setActive((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents="none">
      {active.map((b) => (
        <Bullet
          key={b.id}
          width={width}
          data={b}
          onExpire={handleExpire}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontOptions={fontOptions}
        />
      ))}
    </View>
  );
}

function Bullet({
  width,
  data,
  onExpire,
  fontSize,
  fontFamily,
  fontOptions,
}: {
  width: number;
  data: ActiveBullet;
  onExpire: (id: number) => void;
  fontSize: number;
  fontFamily: string;
  fontOptions: string;
}) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const endRemove = setTimeout(() => onExpire(data.id), data.durationMs + 100);
    if (data.mode === DANDAN_COMMENT_MODE.Scroll) {
      translateX.value = withTiming(-width - 300, {
        duration: data.durationMs,
        easing: Easing.linear,
      });
    } else if (data.mode === DANDAN_COMMENT_MODE.ScrollBottom) {
      translateX.value = withTiming(width + 300, {
        duration: data.durationMs,
        easing: Easing.linear,
      });
    }
    const fade = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
    }, data.durationMs - 300);
    return () => {
      clearTimeout(fade);
      clearTimeout(endRemove);
    };
  }, [width, data.durationMs, translateX, opacity, data.mode, onExpire, data.id]);

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
      styles.text,
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

  return (
    <Animated.View
      style={[
        style,
        data.mode === DANDAN_COMMENT_MODE.Bottom || data.mode === DANDAN_COMMENT_MODE.Top
          ? styles.centerRow
          : null,
      ]}
    >
      <Text style={[textStyle, { color: data.colorHex }]} numberOfLines={1}>
        {data.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  centerRow: {
    left: 0,
    width: '100%',
    alignItems: 'center',
  },
});

export default DanmakuLayer;
