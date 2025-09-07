import { getCommentsByEpisodeId, searchAnimesByKeyword } from '@/services/dandanplay';
import { Api } from '@jellyfin/sdk';
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { getMediaInfoApi } from '@jellyfin/sdk/lib/utils/api';
import { compareVersions } from 'compare-versions';
import { Platform } from 'react-native';
import uuid from 'react-native-uuid';

import download from '../profiles/download';
import { storage } from '../storage';

export const iosVersion = Platform.OS === 'ios' ? Platform.Version : '0';

export const isGreaterThanOrEqual26 = compareVersions(iosVersion, '26.0') >= 0;

export const ticksToSeconds = (ticks: number) => {
  return ticks / 10000000;
};

export const formatDurationFromTicks = (ticks?: number | null) => {
  if (!ticks) return '';
  const totalSeconds = Math.floor(ticksToSeconds(ticks));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export type StreamInfo = {
  url: string | null;
  sessionId: string | null;
  mediaSource: MediaSourceInfo | undefined;
};

interface StreamResult {
  url: string;
  sessionId: string | null;
  mediaSource: MediaSourceInfo | undefined;
}

const getPlaybackUrl = (
  api: Api,
  itemId: string,
  mediaSource: MediaSourceInfo | undefined,
  params: {
    subtitleStreamIndex?: number;
    audioStreamIndex?: number;
    deviceId?: string | null;
    startTimeTicks?: number;
    maxStreamingBitrate?: number;
    userId: string;
    playSessionId?: string | null;
    container?: string;
    static?: string;
  },
): string => {
  let transcodeUrl = mediaSource?.TranscodingUrl;

  if (transcodeUrl) {
    if (params.subtitleStreamIndex === -1) {
      transcodeUrl = transcodeUrl.replace('SubtitleMethod=Encode', 'SubtitleMethod=Hls');
    }

    console.log('Video is being transcoded:', transcodeUrl);
    return `${api.basePath}${transcodeUrl}`;
  }

  const streamParams = new URLSearchParams({
    static: params.static || 'true',
    container: params.container || 'mp4',
    mediaSourceId: mediaSource?.Id || '',
    subtitleStreamIndex: params.subtitleStreamIndex?.toString() || '',
    audioStreamIndex: params.audioStreamIndex?.toString() || '',
    deviceId: params.deviceId || api.deviceInfo.id,
    api_key: api.accessToken,
    startTimeTicks: params.startTimeTicks?.toString() || '0',
    maxStreamingBitrate: params.maxStreamingBitrate?.toString() || '',
    userId: params.userId,
  });

  if (params.playSessionId) {
    streamParams.append('playSessionId', params.playSessionId);
  }

  const directPlayUrl = `${api.basePath}/Videos/${itemId}/stream?${streamParams.toString()}`;

  console.log('Video is being direct played:', directPlayUrl);
  return directPlayUrl;
};

const getDownloadUrl = (
  api: Api,
  itemId: string,
  mediaSource: MediaSourceInfo | undefined,
  sessionId: string | null | undefined,
  params: {
    subtitleStreamIndex?: number;
    audioStreamIndex?: number;
    deviceId?: string | null;
    startTimeTicks?: number;
    maxStreamingBitrate?: number;
    userId: string;
    playSessionId?: string | null;
  },
): StreamResult => {
  let downloadMediaSource = mediaSource;
  if (mediaSource?.TranscodingUrl) {
    downloadMediaSource = {
      ...mediaSource,
      TranscodingUrl: mediaSource.TranscodingUrl.replace('master.m3u8', 'stream'),
    };
  }

  let url = getPlaybackUrl(api, itemId, downloadMediaSource, {
    ...params,
    container: 'ts',
    static: 'false',
  });

  if (!mediaSource?.TranscodingUrl) {
    const urlObj = new URL(url);
    const downloadParams = {
      subtitleMethod: 'Embed',
      enableSubtitlesInManifest: 'true',
      allowVideoStreamCopy: 'true',
      allowAudioStreamCopy: 'true',
    };

    Object.entries(downloadParams).forEach(([key, value]) => {
      urlObj.searchParams.append(key, value);
    });

    url = urlObj.toString();
  }

  return {
    url,
    sessionId: sessionId || null,
    mediaSource,
  };
};

export const getStreamInfo = async ({
  api,
  item,
  userId,
  startTimeTicks = 0,
  maxStreamingBitrate,
  playSessionId,
  deviceProfile,
  audioStreamIndex = 0,
  subtitleStreamIndex = undefined,
  mediaSourceId,
  deviceId,
}: {
  api: Api | null | undefined;
  item: BaseItemDto | null | undefined;
  userId: string | null | undefined;
  startTimeTicks: number;
  maxStreamingBitrate?: number;
  playSessionId?: string | null;
  deviceProfile: any;
  audioStreamIndex?: number;
  subtitleStreamIndex?: number;
  height?: number;
  mediaSourceId?: string | null;
  deviceId?: string | null;
}): Promise<StreamInfo | null> => {
  if (!api || !userId || !item?.Id) {
    console.warn('Missing required parameters for getStreamInfo');
    return null;
  }

  let mediaSource: MediaSourceInfo | undefined;
  let sessionId: string | null | undefined;

  if (item.Type === BaseItemKind.Program) {
    console.log('Item is of type program...');
    const res = await getMediaInfoApi(api).getPlaybackInfo(
      {
        userId,
        itemId: item.ChannelId!,
      },
      {
        method: 'POST',
        params: {
          startTimeTicks: 0,
          isPlayback: true,
          autoOpenLiveStream: true,
          maxStreamingBitrate,
          audioStreamIndex,
        },
        data: {
          deviceProfile,
        },
      },
    );

    sessionId = res.data.PlaySessionId || null;
    mediaSource = res.data.MediaSources?.[0];
    const url = getPlaybackUrl(api, item.ChannelId!, mediaSource, {
      subtitleStreamIndex,
      audioStreamIndex,
      deviceId,
      startTimeTicks: 0,
      maxStreamingBitrate,
      userId,
    });

    console.log('Debug: url', url);

    return {
      url,
      sessionId: sessionId || null,
      mediaSource,
    };
  }

  const res = await getMediaInfoApi(api).getPlaybackInfo(
    {
      itemId: item.Id!,
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

  if (res.status !== 200) {
    console.error('Error getting playback info:', res.status, res.statusText);
  }

  sessionId = res.data.PlaySessionId || null;
  mediaSource = res.data.MediaSources?.[0];

  const url = getPlaybackUrl(api, item.Id!, mediaSource, {
    subtitleStreamIndex,
    audioStreamIndex,
    deviceId,
    startTimeTicks,
    maxStreamingBitrate,
    userId,
    playSessionId: playSessionId || undefined,
  });

  return {
    url,
    sessionId: sessionId || null,
    mediaSource,
  };
};

export const getDownloadStreamInfo = async ({
  api,
  item,
  userId,
  maxStreamingBitrate,
  audioStreamIndex = 0,
  subtitleStreamIndex = undefined,
  mediaSourceId,
  deviceId,
}: {
  api: Api | null | undefined;
  item: BaseItemDto | null | undefined;
  userId: string | null | undefined;
  maxStreamingBitrate?: number;
  audioStreamIndex?: number;
  subtitleStreamIndex?: number;
  mediaSourceId?: string | null;
  deviceId?: string | null;
}): Promise<StreamInfo | null> => {
  if (!api || !userId || !item?.Id) {
    console.warn('Missing required parameters for getDownloadStreamInfo');
    return null;
  }

  const res = await getMediaInfoApi(api).getPlaybackInfo(
    {
      itemId: item.Id!,
    },
    {
      method: 'POST',
      data: {
        userId,
        deviceProfile: download,
        subtitleStreamIndex,
        startTimeTicks: 0,
        isPlayback: true,
        autoOpenLiveStream: true,
        maxStreamingBitrate,
        audioStreamIndex,
        mediaSourceId,
      },
    },
  );

  if (res.status !== 200) {
    console.error('Error getting playback info:', res.status, res.statusText);
  }

  const sessionId = res.data.PlaySessionId || null;
  const mediaSource = res.data.MediaSources?.[0];

  return getDownloadUrl(api, item.Id!, mediaSource, sessionId, {
    subtitleStreamIndex,
    audioStreamIndex,
    deviceId,
    startTimeTicks: 0,
    maxStreamingBitrate,
    userId,
    playSessionId: sessionId || undefined,
  });
};

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
  const anime = animes[seasonNumber - 1];
  if (anime && episodeNumber) {
    const comments = await getCommentsByEpisodeId(anime.episodes[episodeNumber - 1].episodeId);
    return comments;
  }
};

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}
