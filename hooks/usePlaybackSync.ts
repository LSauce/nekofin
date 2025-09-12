import { MediaItem, MediaServerInfo } from '@/services/media/types';
import { useCallback, useEffect } from 'react';
import { SharedValue } from 'react-native-reanimated';

import { useMediaAdapter } from './useMediaAdapter';

interface UsePlaybackSyncProps {
  currentServer: MediaServerInfo | null;
  itemDetail: MediaItem | null;
  currentTime: SharedValue<number>;
  playSessionId: string | null;
}

export const usePlaybackSync = ({
  currentServer,
  itemDetail,
  currentTime,
  playSessionId,
}: UsePlaybackSyncProps) => {
  const mediaAdapter = useMediaAdapter();

  const syncPlaybackProgress = useCallback(
    (position: number, isPaused: boolean = false) => {
      if (!currentServer || !itemDetail || !playSessionId) return;

      const positionTicks = Math.round(position);
      mediaAdapter.reportPlaybackProgress({
        itemId: itemDetail.id!,
        positionTicks,
        isPaused,
        PlaySessionId: playSessionId,
      });
    },
    [mediaAdapter, currentServer, itemDetail, playSessionId],
  );

  const syncPlaybackStart = useCallback(
    (position: number) => {
      if (!currentServer || !itemDetail || !playSessionId) return;

      const positionTicks = Math.round(position);
      mediaAdapter.reportPlaybackStart({
        itemId: itemDetail.id!,
        positionTicks,
        PlaySessionId: playSessionId,
      });
    },
    [mediaAdapter, currentServer, itemDetail, playSessionId],
  );

  const syncPlaybackStop = useCallback(
    (position: number) => {
      if (!currentServer || !itemDetail || !playSessionId) return;

      const positionTicks = Math.round(position);
      mediaAdapter.reportPlaybackStop({
        itemId: itemDetail.id!,
        positionTicks,
        PlaySessionId: playSessionId,
      });
    },
    [mediaAdapter, currentServer, itemDetail, playSessionId],
  );

  useEffect(() => {
    return () => {
      if (currentServer && itemDetail && playSessionId) {
        const positionTicks = Math.round(currentTime.value);
        syncPlaybackStop(positionTicks);
      }
    };
  }, [mediaAdapter, currentServer, itemDetail, playSessionId, syncPlaybackStop, currentTime]);

  return {
    syncPlaybackProgress,
    syncPlaybackStart,
    syncPlaybackStop,
  };
};
