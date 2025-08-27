import { useCallback, useEffect, useRef, useState } from 'react';

type TimerOptions = {
  interval?: number;
  isRunning?: boolean;
  initialTime?: number;
  onTick?: (time: number) => void;
};

export function usePreciseTimer({
  interval = 100,
  isRunning = false,
  initialTime = 0,
  onTick,
}: TimerOptions) {
  const [time, setTime] = useState(initialTime);
  const animationFrameRef = useRef<number | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  const step = useCallback(
    (timestamp: number) => {
      if (!startTimestampRef.current) {
        startTimestampRef.current = timestamp;
        lastTickTimeRef.current = timestamp;
      }

      if (timestamp >= lastTickTimeRef.current + interval) {
        lastTickTimeRef.current = timestamp;
        setTime((prevTime) => {
          const newTime = prevTime + interval;
          if (onTick) {
            onTick(newTime);
          }
          return newTime;
        });
      }

      if (isRunning) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    },
    [interval, isRunning, onTick],
  );

  useEffect(() => {
    if (isRunning) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimestampRef.current = null;
      lastTickTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(step);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRunning, step]);

  const start = useCallback(() => {
    if (!isRunning) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimestampRef.current = null;
      lastTickTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(step);
    }
  }, [isRunning, step]);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const sync = useCallback((newTime: number) => {
    setTime(newTime);
  }, []);

  return {
    time,
    start,
    stop,
    sync,
  };
}
