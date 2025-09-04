import { useIsTablet } from '@/hooks/useIsTablet';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';

export function useGridLayout(type?: 'series' | 'episode') {
  const isTablet = useIsTablet();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width } = dimensions;

  return useMemo(() => {
    const containerPadding = 40;
    const availableWidth = width - containerPadding;

    let targetItemWidth: number;
    let numColumns: number;

    if (isTablet) {
      if (type === 'series') {
        targetItemWidth = 180;
      } else {
        targetItemWidth = 160;
      }
    } else {
      if (type === 'series') {
        targetItemWidth = 120;
      } else {
        targetItemWidth = 160;
      }
    }

    numColumns = Math.floor(availableWidth / targetItemWidth);

    numColumns = Math.max(2, Math.min(numColumns, isTablet ? 8 : 4));

    const totalGap = (numColumns - 1) * 12;
    const itemWidth = (availableWidth - totalGap) / numColumns;

    return {
      numColumns,
      itemWidth,
      gap: 12,
    };
  }, [isTablet, type, width]);
}
