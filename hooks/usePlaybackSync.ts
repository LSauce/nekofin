import { MediaItem, MediaServerInfo } from '@/services/media/types';
import { useCallback, useEffect } from 'react';
import { SharedValue } from 'react-native-reanimated';

import { useMediaAdapter } from './useMediaAdapter';

interface UsePlaybackSyncProps {
  currentServer: MediaServerInfo | null;
  itemDetail: MediaItem | null;
  currentTime: SharedValue<number>;
}

export const usePlaybackSync = ({
  currentServer,
  itemDetail,
  currentTime,
}: UsePlaybackSyncProps) => {
  const mediaAdapter = useMediaAdapter();

  const syncPlaybackProgress = useCallback(
    (position: number, isPaused: boolean = false) => {
      if (!currentServer || !itemDetail) return;

      const positionTicks = Math.round(position);
      mediaAdapter.reportPlaybackProgress(itemDetail.id!, positionTicks, isPaused);
    },
    [mediaAdapter, currentServer, itemDetail],
  );

  const syncPlaybackStart = useCallback(
    (position: number) => {
      if (!currentServer || !itemDetail) return;

      const positionTicks = Math.round(position);
      mediaAdapter.reportPlaybackStart(itemDetail.id!, positionTicks);
    },
    [mediaAdapter, currentServer, itemDetail],
  );

  const syncPlaybackStop = useCallback(
    (position: number) => {
      if (!currentServer || !itemDetail) return;

      const positionTicks = Math.round(position);
      mediaAdapter.reportPlaybackStop(itemDetail.id!, positionTicks);
    },
    [mediaAdapter, currentServer, itemDetail],
  );

  useEffect(() => {
    return () => {
      if (currentServer && itemDetail) {
        const positionTicks = Math.round(currentTime.value);
        syncPlaybackStop(positionTicks);
      }
    };
  }, [mediaAdapter, currentServer, itemDetail, syncPlaybackStop, currentTime]);

  return {
    syncPlaybackProgress,
    syncPlaybackStart,
    syncPlaybackStop,
  };
};
