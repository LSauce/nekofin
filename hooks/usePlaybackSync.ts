import { MediaServerInfo } from '@/lib/contexts/MediaServerContext';
import {
  reportPlaybackProgress,
  reportPlaybackStart,
  reportPlaybackStop,
} from '@/services/jellyfin';
import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { useCallback, useEffect, useRef } from 'react';
import { SharedValue } from 'react-native-reanimated';

interface UsePlaybackSyncProps {
  api: Api | null;
  currentServer: MediaServerInfo | null;
  itemDetail: BaseItemDto | null;
  currentTime: SharedValue<number>;
}

export const usePlaybackSync = ({
  api,
  currentServer,
  itemDetail,
  currentTime,
}: UsePlaybackSyncProps) => {
  const syncPlaybackProgress = useCallback(
    (position: number, isPaused: boolean = false) => {
      if (!api || !currentServer || !itemDetail) return;

      console.log('syncPlaybackProgress', position);
      const positionTicks = Math.round(position * 10000);
      reportPlaybackProgress(api, itemDetail.Id!, positionTicks, isPaused);
    },
    [api, currentServer, itemDetail],
  );

  const syncPlaybackStart = useCallback(
    (position: number) => {
      if (!api || !currentServer || !itemDetail) return;

      const positionTicks = Math.round(position * 10000);
      reportPlaybackStart(api, itemDetail.Id!, positionTicks);
    },
    [api, currentServer, itemDetail],
  );

  const syncPlaybackStop = useCallback(
    (position: number) => {
      if (!api || !currentServer || !itemDetail) return;

      const positionTicks = Math.round(position * 10000);
      reportPlaybackStop(api, itemDetail.Id!, positionTicks);
    },
    [api, currentServer, itemDetail],
  );

  useEffect(() => {
    return () => {
      if (api && currentServer && itemDetail) {
        const positionTicks = Math.round(currentTime.value * 10000);
        syncPlaybackStop(positionTicks);
      }
    };
  }, [api, currentServer, itemDetail, syncPlaybackStop, currentTime]);

  return {
    syncPlaybackProgress,
    syncPlaybackStart,
    syncPlaybackStop,
  };
};
