import { getCommentsByEpisodeId, searchAnimesByKeyword } from '@/services/dandanplay';
import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models/device-profile';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api';
import uuid from 'react-native-uuid';

import { storage } from './storage';

export const ticksToSeconds = (ticks: number) => {
  return ticks / 10000000;
};

export type StreamInfo = {
  url: string;
};

export const getStreamInfo = async ({
  api,
  itemId,
  mediaSourceId,
  userId,
  deviceProfile,
  subtitleStreamIndex,
  startTimeTicks,
  maxStreamingBitrate,
  audioStreamIndex,
}: {
  api: Api;
  itemId: string;
  mediaSourceId?: string;
  userId: string;
  deviceProfile?: DeviceProfile;
  subtitleStreamIndex?: number;
  startTimeTicks?: number;
  maxStreamingBitrate?: number;
  audioStreamIndex?: number;
}): Promise<StreamInfo | null> => {
  if (!api || !userId || !itemId) {
    return null;
  }

  const res = await getMediaInfoApi(api).getPlaybackInfo(
    {
      itemId,
    },
    {
      method: 'POST',
      data: {
        userId,
        deviceProfile,
        subtitleStreamIndex,
        startTimeTicks,
        isPlayback: true,
        autoOpenLiveStream: true,
        maxStreamingBitrate,
        audioStreamIndex,
        mediaSourceId,
      },
    },
  );

  const mediaSource = res.data.MediaSources?.[0];

  const searchParams = new URLSearchParams({
    static: 'true',
    container: 'mp4',
    api_key: api.accessToken,
    mediaSourceId: mediaSource?.Id || '',
    subtitleStreamIndex: subtitleStreamIndex?.toString() || '',
    audioStreamIndex: audioStreamIndex?.toString() || '',
    maxStreamingBitrate: maxStreamingBitrate?.toString() || '',
    userId: userId || '',
  });

  const url = `${api.basePath}/Videos/${itemId}/stream?${searchParams.toString()}`;

  return {
    url,
  };
};

export enum VideoPlayer {
  // NATIVE, //todo: changes will make this a lot more easier to implement if we want. delete if not wanted
  VLC_3 = 0,
  VLC_4 = 1,
}

export const getDeviceId = () => {
  const deviceId = storage.getString('deviceId');
  if (!deviceId) {
    const newDeviceId = uuid.v4();
    storage.set('deviceId', newDeviceId);
    return newDeviceId;
  }
  return deviceId;
};

export const getCommentsByItem = async (item: BaseItemDto, originalTitle?: string | null) => {
  const seriesName = item.SeriesName;
  const seasonNumber = item.ParentIndexNumber ?? 1;
  const episodeNumber = item.IndexNumber;
  const seriesId = item.SeriesId;

  let animes = await searchAnimesByKeyword(seriesName ?? '');
  if (animes.length === 0) {
    animes = await searchAnimesByKeyword(originalTitle ?? '');
  }
  if (animes.length === 0) {
    return [];
  }
  console.log(item.OriginalTitle, seriesName, animes);
  const anime = animes[seasonNumber - 1];
  console.log(anime);
  if (anime && episodeNumber) {
    const comments = await getCommentsByEpisodeId(anime.episodes[episodeNumber - 1].episodeId);
    return comments;
  }
};
