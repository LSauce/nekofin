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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + interval;
          if (onTick) {
            onTick(newTime);
          }
          return newTime;
        });
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, interval, onTick]);

  const start = useCallback(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + interval;
          if (onTick) {
            onTick(newTime);
          }
          return newTime;
        });
      }, interval);
    }
  }, [interval, isRunning, onTick]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
