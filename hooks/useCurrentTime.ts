import { useState } from 'react';
import { runOnJS, SharedValue, useAnimatedReaction } from 'react-native-reanimated';

export function useCurrentTime({ time }: { time: SharedValue<number> }) {
  const [currentTime, setCurrentTime] = useState(0);

  useAnimatedReaction(
    () => time.value,
    (newTime) => {
      runOnJS(setCurrentTime)(newTime);
    },
  );

  return currentTime;
}
