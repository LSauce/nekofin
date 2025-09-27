import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export function useOverlayInsets() {
  const { width, height } = useWindowDimensions();

  const isPortrait = height >= width;

  return useMemo(() => {
    const side = 60;
    const topExtra = isPortrait ? 20 : 0;
    const bottomExtra = isPortrait ? 20 : 0;

    return { side, topExtra, bottomExtra, isPortrait };
  }, [isPortrait]);
}
