import { DANDAN_COMMENT_MODE, DandanComment, DandanCommentMode } from '@/services/dandanplay';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
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
  startOffsetMs: number;
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
  const lastTimeMsRef = useRef<number>(-1);
  const idRef = useRef<number>(1);
  const scheduledTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lineHeight = fontSize + 8;
  const rows = Math.max(6, Math.floor(((height * heightRatio) / lineHeight) * density));

  const layout = useMemo(() => {
    const topRows = Math.max(1, Math.floor(rows * 0.2));
    const bottomRows = Math.max(1, Math.floor(rows * 0.2));
    const scrollRows = Math.max(1, rows - topRows - bottomRows);
    return { topRows, bottomRows, scrollRows };
  }, [rows]);

  const rowMinGapPx = 50;
  const MAX_DELAY_MS = 200;
  const scrollLaneNextAvailableRef = useRef<number[]>([]);
  const topLaneNextAvailableRef = useRef<number[]>([]);
  const bottomLaneNextAvailableRef = useRef<number[]>([]);

  const ensureLanes = useCallback(() => {
    if (scrollLaneNextAvailableRef.current.length !== layout.scrollRows) {
      scrollLaneNextAvailableRef.current = new Array(layout.scrollRows).fill(0);
    }
    if (topLaneNextAvailableRef.current.length !== layout.topRows) {
      topLaneNextAvailableRef.current = new Array(layout.topRows).fill(0);
    }
    if (bottomLaneNextAvailableRef.current.length !== layout.bottomRows) {
      bottomLaneNextAvailableRef.current = new Array(layout.bottomRows).fill(0);
    }
  }, [layout.scrollRows, layout.topRows, layout.bottomRows]);

  const estimateTextWidth = useCallback(
    (text: string): number => {
      let cjkCount = 0;
      let otherCount = 0;
      for (let i = 0; i < text.length; i++) {
        const ch = text.charCodeAt(i);
        if (
          (ch >= 0x4e00 && ch <= 0x9fff) ||
          (ch >= 0x3400 && ch <= 0x4dbf) ||
          (ch >= 0x20000 && ch <= 0x2a6df)
        ) {
          cjkCount++;
        } else {
          otherCount++;
        }
      }
      const cjkWidth = cjkCount * fontSize;
      const otherWidth = otherCount * fontSize * 0.6;
      return Math.min(width * 2, cjkWidth + otherWidth + 16);
    },
    [fontSize, width],
  );

  const getEarliestScrollRow = useCallback((): { rowIndex: number; availMs: number } | null => {
    ensureLanes();
    let idx = -1;
    let val = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < layout.scrollRows; i++) {
      const a = scrollLaneNextAvailableRef.current[i] ?? 0;
      if (a < val) {
        val = a;
        idx = i;
      }
    }
    return idx === -1 ? null : { rowIndex: idx, availMs: val };
  }, [ensureLanes, layout.scrollRows]);

  const getEarliestTopRow = useCallback((): { rowIndex: number; availMs: number } | null => {
    ensureLanes();
    let idx = -1;
    let val = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < layout.topRows; i++) {
      const a = topLaneNextAvailableRef.current[i] ?? 0;
      if (a < val) {
        val = a;
        idx = i;
      }
    }
    return idx === -1 ? null : { rowIndex: idx, availMs: val };
  }, [ensureLanes, layout.topRows]);

  const getEarliestBottomRow = useCallback((): { rowIndex: number; availMs: number } | null => {
    ensureLanes();
    let idx = -1;
    let val = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < layout.bottomRows; i++) {
      const a = bottomLaneNextAvailableRef.current[i] ?? 0;
      if (a < val) {
        val = a;
        idx = i;
      }
    }
    return idx === -1 ? null : { rowIndex: idx, availMs: val };
  }, [ensureLanes, layout.bottomRows]);

  const pickScrollRow = useCallback(
    (
      tMs: number,
      text: string,
    ): { rowIndex: number; nextAvailableMs: number; scheduledMs: number } | null => {
      ensureLanes();
      const v = Math.max(50, speed);
      const textWidth = estimateTextWidth(text);
      const deltaMs = Math.ceil(((textWidth + rowMinGapPx) / v) * 1000);

      let chosen = -1;
      let bestAvail = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < layout.scrollRows; i++) {
        const avail = scrollLaneNextAvailableRef.current[i] ?? 0;
        if (avail <= tMs && avail < bestAvail) {
          bestAvail = avail;
          chosen = i;
        }
      }
      if (chosen === -1) {
        const earliest = getEarliestScrollRow();
        if (!earliest) return null;
        const waitMs = earliest.availMs - tMs;
        if (waitMs > 0 && waitMs <= MAX_DELAY_MS) {
          return {
            rowIndex: earliest.rowIndex,
            nextAvailableMs: earliest.availMs + deltaMs,
            scheduledMs: earliest.availMs,
          };
        }
        return null;
      }
      return { rowIndex: chosen, nextAvailableMs: tMs + deltaMs, scheduledMs: tMs };
    },
    [ensureLanes, layout.scrollRows, estimateTextWidth, speed, getEarliestScrollRow],
  );

  const pickTopRow = useCallback(
    (tMs: number): { rowIndex: number; nextAvailableMs: number; scheduledMs: number } | null => {
      ensureLanes();
      const deltaMs = 4000;
      let chosen = -1;
      let bestAvail = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < layout.topRows; i++) {
        const avail = topLaneNextAvailableRef.current[i] ?? 0;
        if (avail <= tMs && avail < bestAvail) {
          bestAvail = avail;
          chosen = i;
        }
      }
      if (chosen === -1) {
        const earliest = getEarliestTopRow();
        if (!earliest) return null;
        const waitMs = earliest.availMs - tMs;
        if (waitMs > 0 && waitMs <= MAX_DELAY_MS) {
          return {
            rowIndex: earliest.rowIndex,
            nextAvailableMs: earliest.availMs + deltaMs,
            scheduledMs: earliest.availMs,
          };
        }
        return null;
      }
      return { rowIndex: chosen, nextAvailableMs: tMs + deltaMs, scheduledMs: tMs };
    },
    [ensureLanes, layout.topRows, getEarliestTopRow],
  );

  const pickBottomRow = useCallback(
    (tMs: number): { rowIndex: number; nextAvailableMs: number; scheduledMs: number } | null => {
      ensureLanes();
      const deltaMs = 4000;
      let chosen = -1;
      let bestAvail = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < layout.bottomRows; i++) {
        const avail = bottomLaneNextAvailableRef.current[i] ?? 0;
        if (avail <= tMs && avail < bestAvail) {
          bestAvail = avail;
          chosen = i;
        }
      }
      if (chosen === -1) {
        const earliest = getEarliestBottomRow();
        if (!earliest) return null;
        const waitMs = earliest.availMs - tMs;
        if (waitMs > 0 && waitMs <= MAX_DELAY_MS) {
          return {
            rowIndex: earliest.rowIndex,
            nextAvailableMs: earliest.availMs + deltaMs,
            scheduledMs: earliest.availMs,
          };
        }
        return null;
      }
      return { rowIndex: chosen, nextAvailableMs: tMs + deltaMs, scheduledMs: tMs };
    },
    [ensureLanes, layout.bottomRows, getEarliestBottomRow],
  );

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
    if (!isPlaying) return;
    if (currentTimeMs === lastTimeMsRef.current) return;
    const prevMs = lastTimeMsRef.current < 0 ? currentTimeMs : lastTimeMsRef.current;
    lastTimeMsRef.current = currentTimeMs;

    if (currentTimeMs < prevMs) {
      // 回退：重置所有行的可用时间
      ensureLanes();
      for (let i = 0; i < scrollLaneNextAvailableRef.current.length; i++) {
        scrollLaneNextAvailableRef.current[i] = 0;
      }
      for (let i = 0; i < topLaneNextAvailableRef.current.length; i++) {
        topLaneNextAvailableRef.current[i] = 0;
      }
      for (let i = 0; i < bottomLaneNextAvailableRef.current.length; i++) {
        bottomLaneNextAvailableRef.current[i] = 0;
      }
    }

    const fromMs = Math.min(prevMs, currentTimeMs);
    const toMs = Math.max(prevMs, currentTimeMs);
    const slice = filteredComments
      .filter((c) => {
        const tMs = Math.round(c.timeInSeconds * 1000);
        return tMs > fromMs && tMs <= toMs;
      })
      .sort((a, b) => a.timeInSeconds - b.timeInSeconds);
    if (slice.length === 0) return;

    const windowMs = toMs - fromMs;
    if (windowMs > 300) {
      const newActive: ActiveBullet[] = [];
      for (const c of slice) {
        const tMs = Math.round(c.timeInSeconds * 1000);
        if (c.mode === DANDAN_COMMENT_MODE.Top) {
          const picked = pickTopRow(tMs);
          if (picked) {
            const { rowIndex, nextAvailableMs, scheduledMs } = picked;
            topLaneNextAvailableRef.current[rowIndex] = nextAvailableMs;
            if (scheduledMs === tMs) {
              const startOffsetMs = Math.max(0, toMs - scheduledMs);
              if (startOffsetMs < 4000) {
                newActive.push({
                  id: idRef.current++,
                  text: c.text,
                  colorHex: c.colorHex,
                  top: rowIndex * lineHeight,
                  durationMs: 4000,
                  mode: DANDAN_COMMENT_MODE.Top,
                  startOffsetMs,
                });
              }
            } else {
              const fireDelay = Math.max(0, scheduledMs - fromMs);
              const tid = setTimeout(() => {
                setActive((prev) => [
                  ...prev,
                  {
                    id: idRef.current++,
                    text: c.text,
                    colorHex: c.colorHex,
                    top: rowIndex * lineHeight,
                    durationMs: 4000,
                    mode: DANDAN_COMMENT_MODE.Top,
                    startOffsetMs: 0,
                  },
                ]);
              }, fireDelay);
              scheduledTimeoutsRef.current.push(tid);
            }
          }
          continue;
        }
        if (c.mode === DANDAN_COMMENT_MODE.Bottom) {
          const picked = pickBottomRow(tMs);
          if (picked) {
            const { rowIndex, nextAvailableMs, scheduledMs } = picked;
            bottomLaneNextAvailableRef.current[rowIndex] = nextAvailableMs;
            const bottomStart = height * heightRatio - layout.bottomRows * lineHeight - 18;
            if (scheduledMs === tMs) {
              const startOffsetMs = Math.max(0, toMs - scheduledMs);
              if (startOffsetMs < 4000) {
                newActive.push({
                  id: idRef.current++,
                  text: c.text,
                  colorHex: c.colorHex,
                  top: bottomStart + rowIndex * lineHeight,
                  durationMs: 4000,
                  mode: DANDAN_COMMENT_MODE.Bottom,
                  startOffsetMs,
                });
              }
            } else {
              const fireDelay = Math.max(0, scheduledMs - fromMs);
              const tid = setTimeout(() => {
                setActive((prev) => [
                  ...prev,
                  {
                    id: idRef.current++,
                    text: c.text,
                    colorHex: c.colorHex,
                    top: bottomStart + rowIndex * lineHeight,
                    durationMs: 4000,
                    mode: DANDAN_COMMENT_MODE.Bottom,
                    startOffsetMs: 0,
                  },
                ]);
              }, fireDelay);
              scheduledTimeoutsRef.current.push(tid);
            }
          }
          continue;
        }
        if (c.mode === DANDAN_COMMENT_MODE.Scroll || c.mode === DANDAN_COMMENT_MODE.ScrollBottom) {
          const picked = pickScrollRow(tMs, c.text);
          if (picked) {
            const { rowIndex, nextAvailableMs, scheduledMs } = picked;
            scrollLaneNextAvailableRef.current[rowIndex] = nextAvailableMs;
            const scrollStart = layout.topRows * lineHeight;
            const durationMs = Math.max(4000, Math.round(((width + 300) / speed) * 1000));
            if (scheduledMs === tMs) {
              const startOffsetMs = Math.max(0, toMs - scheduledMs);
              if (startOffsetMs < durationMs) {
                newActive.push({
                  id: idRef.current++,
                  text: c.text,
                  colorHex: c.colorHex,
                  top: scrollStart + rowIndex * lineHeight,
                  durationMs,
                  mode: c.mode,
                  startOffsetMs,
                });
              }
            } else {
              const fireDelay = Math.max(0, scheduledMs - fromMs);
              const tid = setTimeout(() => {
                setActive((prev) => [
                  ...prev,
                  {
                    id: idRef.current++,
                    text: c.text,
                    colorHex: c.colorHex,
                    top: scrollStart + rowIndex * lineHeight,
                    durationMs,
                    mode: c.mode,
                    startOffsetMs: 0,
                  },
                ]);
              }, fireDelay);
              scheduledTimeoutsRef.current.push(tid);
            }
          }
        }
        if (newActive.length >= rows) break;
      }
      if (newActive.length > 0) setActive((prev) => [...prev, ...newActive]);
    } else {
      for (const c of slice) {
        const tMs = Math.round(c.timeInSeconds * 1000);
        const delay = Math.max(0, tMs - fromMs);

        const timeoutId = setTimeout(() => {
          if (!isPlaying) return;

          if (c.mode === DANDAN_COMMENT_MODE.Top) {
            const picked = pickTopRow(tMs);
            if (picked) {
              const { rowIndex, nextAvailableMs, scheduledMs } = picked;
              topLaneNextAvailableRef.current[rowIndex] = nextAvailableMs;
              const extraDelay = Math.max(0, scheduledMs - tMs);
              if (extraDelay === 0) {
                setActive((prev) => [
                  ...prev,
                  {
                    id: idRef.current++,
                    text: c.text,
                    colorHex: c.colorHex,
                    top: rowIndex * lineHeight,
                    durationMs: 4000,
                    mode: DANDAN_COMMENT_MODE.Top,
                    startOffsetMs: 0,
                  },
                ]);
              } else {
                const tid2 = setTimeout(() => {
                  setActive((prev) => [
                    ...prev,
                    {
                      id: idRef.current++,
                      text: c.text,
                      colorHex: c.colorHex,
                      top: rowIndex * lineHeight,
                      durationMs: 4000,
                      mode: DANDAN_COMMENT_MODE.Top,
                      startOffsetMs: 0,
                    },
                  ]);
                }, extraDelay);
                scheduledTimeoutsRef.current.push(tid2);
              }
            }
            return;
          }

          if (c.mode === DANDAN_COMMENT_MODE.Bottom) {
            const picked = pickBottomRow(tMs);
            if (picked) {
              const { rowIndex, nextAvailableMs, scheduledMs } = picked;
              bottomLaneNextAvailableRef.current[rowIndex] = nextAvailableMs;
              const bottomStart = height * heightRatio - layout.bottomRows * lineHeight - 18;
              const extraDelay = Math.max(0, scheduledMs - tMs);
              if (extraDelay === 0) {
                setActive((prev) => [
                  ...prev,
                  {
                    id: idRef.current++,
                    text: c.text,
                    colorHex: c.colorHex,
                    top: bottomStart + rowIndex * lineHeight,
                    durationMs: 4000,
                    mode: DANDAN_COMMENT_MODE.Bottom,
                    startOffsetMs: 0,
                  },
                ]);
              } else {
                const tid2 = setTimeout(() => {
                  setActive((prev) => [
                    ...prev,
                    {
                      id: idRef.current++,
                      text: c.text,
                      colorHex: c.colorHex,
                      top: bottomStart + rowIndex * lineHeight,
                      durationMs: 4000,
                      mode: DANDAN_COMMENT_MODE.Bottom,
                      startOffsetMs: 0,
                    },
                  ]);
                }, extraDelay);
                scheduledTimeoutsRef.current.push(tid2);
              }
            }
            return;
          }

          if (
            c.mode === DANDAN_COMMENT_MODE.Scroll ||
            c.mode === DANDAN_COMMENT_MODE.ScrollBottom
          ) {
            const picked = pickScrollRow(tMs, c.text);
            if (picked) {
              const { rowIndex, nextAvailableMs, scheduledMs } = picked;
              scrollLaneNextAvailableRef.current[rowIndex] = nextAvailableMs;
              const scrollStart = layout.topRows * lineHeight;
              const durationMs = Math.max(4000, Math.round(((width + 300) / speed) * 1000));
              const extraDelay = Math.max(0, scheduledMs - tMs);
              if (extraDelay === 0) {
                setActive((prev) => [
                  ...prev,
                  {
                    id: idRef.current++,
                    text: c.text,
                    colorHex: c.colorHex,
                    top: scrollStart + rowIndex * lineHeight,
                    durationMs,
                    mode: c.mode,
                    startOffsetMs: 0,
                  },
                ]);
              } else {
                const tid2 = setTimeout(() => {
                  setActive((prev) => [
                    ...prev,
                    {
                      id: idRef.current++,
                      text: c.text,
                      colorHex: c.colorHex,
                      top: scrollStart + rowIndex * lineHeight,
                      durationMs,
                      mode: c.mode,
                      startOffsetMs: 0,
                    },
                  ]);
                }, extraDelay);
                scheduledTimeoutsRef.current.push(tid2);
              }
            }
          }
        }, delay);

        scheduledTimeoutsRef.current.push(timeoutId);
      }
    }

    return () => {
      if (scheduledTimeoutsRef.current.length > 0) {
        for (const t of scheduledTimeoutsRef.current) clearTimeout(t);
        scheduledTimeoutsRef.current = [];
      }
    };
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
    ensureLanes,
    pickTopRow,
    pickBottomRow,
    pickScrollRow,
  ]);

  const handleExpire = useCallback((id: number) => {
    setActive((prev) => prev.filter((b) => b.id !== id));
  }, []);

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
          isPlaying={isPlaying}
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
