import { useState } from 'react';
import { SharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export function useCurrentTime({ time }: { time: SharedValue<number> }) {
  const [currentTime, setCurrentTime] = useState(0);

  useAnimatedReaction(
    () => time.value,
    (newTime) => {
      scheduleOnRN(setCurrentTime, newTime);
    },
  );

  return currentTime;
}
