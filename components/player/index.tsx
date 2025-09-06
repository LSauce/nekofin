import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { generateDeviceProfile } from '@/lib/profiles/native';
import { getCommentsByItem, getStreamInfo } from '@/lib/utils';
import { getEpisodesBySeason, getItemDetail } from '@/services/jellyfin';
import { useQuery } from '@tanstack/react-query';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  LibVlcPlayerView,
  LibVlcPlayerViewRef,
  Position,
  type MediaInfo,
  type Tracks,
} from 'expo-libvlc-player';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { usePlaybackSync } from '../../hooks/usePlaybackSync';
import { Controls } from './Controls';
import { DanmakuLayer } from './DanmakuLayer';

const LoadingIndicator = () => {
  return (
    <View style={[StyleSheet.absoluteFill, styles.bufferingOverlay]} pointerEvents="none">
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
};

export const VideoPlayer = ({ itemId }: { itemId: string }) => {
  const { currentServer, currentApi: api } = useMediaServers();
  const router = useRouter();

  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [initialTime, setInitialTime] = useState<number>(-1);
  const [selectedTracks, setSelectedTracks] = useState<Tracks | undefined>(undefined);
  const [isBackground, setIsBackground] = useState(false);

  const player = useRef<LibVlcPlayerViewRef>(null);
  const currentTime = useSharedValue(0);

  const { data: itemDetail } = useQuery({
    queryKey: ['itemDetail', itemId, currentServer?.userId],
    queryFn: async () => {
      if (!api || !currentServer) return null;
      const response = await getItemDetail(api, itemId, currentServer.userId);
      return response.data;
    },
    enabled: !!api && !!itemId && !!currentServer,
  });

  const { syncPlaybackProgress, syncPlaybackStart } = usePlaybackSync({
    api,
    currentServer,
    itemDetail: itemDetail ?? null,
    currentTime,
  });

  const { data: seriesInfo } = useQuery({
    queryKey: ['seriesInfo', itemDetail?.SeriesId, currentServer?.userId],
    queryFn: async () => {
      if (!api || !currentServer || !itemDetail?.SeriesId) return null;
      const response = await getItemDetail(api, itemDetail.SeriesId, currentServer.userId);
      return response.data;
    },
    enabled: !!api && !!itemDetail?.SeriesId && !!currentServer,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', itemDetail?.Id, seriesInfo?.OriginalTitle],
    queryFn: async () => {
      if (!itemDetail || !seriesInfo?.OriginalTitle) return [];
      try {
        return await getCommentsByItem(itemDetail, seriesInfo.OriginalTitle);
      } catch (error) {
        console.warn('Failed to load danmaku comments:', error);
        return [];
      }
    },
    enabled: !!itemDetail && !!seriesInfo?.OriginalTitle,
  });

  const { data: streamInfo } = useQuery({
    queryKey: ['streamInfo', itemId, currentServer?.userId],
    queryFn: async () => {
      if (!api || !currentServer || !itemDetail) return null;
      return await getStreamInfo({
        api,
        itemId: itemId,
        userId: currentServer.userId,
        deviceProfile: generateDeviceProfile(),
        startTimeTicks: itemDetail.UserData?.PlaybackPositionTicks,
      });
    },
    enabled: !!api && !!currentServer && !!itemDetail,
  });

  const { data: episodes = [] } = useQuery({
    queryKey: ['episodes', itemDetail?.SeasonId, currentServer?.userId],
    queryFn: async () => {
      if (!api || !currentServer || !itemDetail?.SeasonId) return [];
      const response = await getEpisodesBySeason(api, itemDetail.SeasonId, currentServer.userId);
      return response.data.Items ?? [];
    },
    enabled: !!api && !!currentServer && !!itemDetail?.SeasonId,
  });

  const showLoading = useMemo(() => {
    return isBuffering || !streamInfo?.url || !isLoaded;
  }, [isBuffering, streamInfo?.url, isLoaded]);

  const bufferingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const duration = useMemo(() => {
    return mediaInfo?.length ?? 0;
  }, [mediaInfo]);

  const formattedTitle = useMemo(() => {
    if (!itemDetail) return '';
    const seriesName = itemDetail.SeriesName ?? '';
    const seasonNumber = itemDetail.ParentIndexNumber;
    const episodeNumber = itemDetail.IndexNumber;
    const episodeName = itemDetail.Name ?? '';

    if (seriesName && seasonNumber != null && episodeNumber != null) {
      return `${seriesName} S${seasonNumber}E${episodeNumber} - ${episodeName}`;
    }
    if (seriesName) {
      return episodeName ? `${seriesName} - ${episodeName}` : seriesName;
    }
    return episodeName;
  }, [itemDetail]);

  const currentEpisodeIndex = useMemo(() => {
    if (!itemId || !episodes.length) return -1;
    const index = episodes.findIndex((episode) => episode.Id === itemId);
    return index;
  }, [itemId, episodes]);

  const hasPreviousEpisode = useMemo(() => {
    return currentEpisodeIndex > 0;
  }, [currentEpisodeIndex]);

  const hasNextEpisode = useMemo(() => {
    return currentEpisodeIndex >= 0 && currentEpisodeIndex < episodes.length - 1;
  }, [currentEpisodeIndex, episodes.length]);

  const previousEpisode = useMemo(() => {
    if (!hasPreviousEpisode) return null;
    return episodes[currentEpisodeIndex - 1];
  }, [hasPreviousEpisode, episodes, currentEpisodeIndex]);

  const nextEpisode = useMemo(() => {
    if (!hasNextEpisode) return null;
    return episodes[currentEpisodeIndex + 1];
  }, [hasNextEpisode, episodes, currentEpisodeIndex]);

  useEffect(() => {
    if (itemDetail?.UserData?.PlaybackPositionTicks !== undefined) {
      const startTimeMs = Math.round(itemDetail.UserData.PlaybackPositionTicks / 10000);
      setInitialTime(startTimeMs);
      currentTime.value = startTimeMs;
    }
  }, [itemDetail, currentTime]);

  useEffect(() => {
    (async () => {
      if (isPlaying) {
        await activateKeepAwakeAsync();
      } else {
        await deactivateKeepAwake();
      }
    })();
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      player.current?.pause();
    } else {
      player.current?.play();
    }
  }, [isPlaying, player]);

  const handleBuffering = useCallback(() => {
    setIsBuffering(true);

    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
    }

    bufferingTimeoutRef.current = setTimeout(() => setIsBuffering(false), 1000);
  }, []);

  const handleSeek = useCallback(
    (position: number) => {
      currentTime.value = position * duration;
      player.current?.seek(position);
      setSeekTime(position * duration);
      setIsBuffering(false);
    },
    [currentTime, duration],
  );

  const handlePositionChanged = useCallback(
    ({ position: newPosition }: Position) => {
      currentTime.value = newPosition * duration;
      setIsBuffering(false);
      setIsPlaying(true);

      if (isPlaying) {
        syncPlaybackProgress(newPosition * duration, false);
      }
    },
    [currentTime, duration, isPlaying, syncPlaybackProgress],
  );

  const handleAudioTrackChange = useCallback((trackIndex: number) => {
    setSelectedTracks((prev) => ({
      ...prev,
      audio: trackIndex,
    }));
  }, []);

  const handleSubtitleTrackChange = useCallback((trackIndex: number) => {
    setSelectedTracks((prev) => ({
      ...prev,
      subtitle: trackIndex >= 0 ? trackIndex : undefined,
    }));
  }, []);

  const handlePreviousEpisode = useCallback(() => {
    if (previousEpisode?.Id) {
      router.replace({
        pathname: '/player',
        params: {
          itemId: previousEpisode.Id,
        },
      });
    }
  }, [previousEpisode, router]);

  const handleNextEpisode = useCallback(() => {
    if (nextEpisode?.Id) {
      router.replace({
        pathname: '/player',
        params: {
          itemId: nextEpisode.Id,
        },
      });
    }
  }, [nextEpisode, router]);

  return (
    <View style={styles.container}>
      {streamInfo?.url && initialTime >= 0 && (
        <LibVlcPlayerView
          ref={player}
          style={styles.video}
          source={streamInfo.url}
          options={['network-caching=1000']}
          autoplay={true}
          time={initialTime}
          tracks={selectedTracks}
          onBuffering={handleBuffering}
          onBackground={() => {
            setIsBackground(true);
          }}
          playInBackground
          onPlaying={() => {
            setIsBuffering(false);
            setIsStopped(false);

            syncPlaybackStart(currentTime.value);
          }}
          onPaused={() => {
            setIsBuffering(false);
            setIsPlaying(false);
            setIsStopped(false);

            syncPlaybackProgress(currentTime.value, true);
          }}
          onPositionChanged={handlePositionChanged}
          onFirstPlay={(mediaInfo) => {
            setIsLoaded(true);
            setMediaInfo(mediaInfo);
          }}
          onEndReached={() => {
            setIsPlaying(false);
            setIsStopped(true);
            syncPlaybackProgress(currentTime.value, true);

            if (hasNextEpisode) {
              setTimeout(() => {
                handleNextEpisode();
              }, 1000);
            }
          }}
          onEncounteredError={(error) => {
            console.warn('Encountered error', error);

            Alert.alert('播放失败', `请尝试重新播放: ${error.error}`);
          }}
        />
      )}
      {showLoading && <LoadingIndicator />}

      {comments.length > 0 && initialTime >= 0 && (
        <DanmakuLayer
          currentTime={currentTime}
          isPlaying={!showLoading && !isStopped && isPlaying}
          comments={comments}
          seekTime={seekTime}
        />
      )}

      <Controls
        isPlaying={isPlaying}
        isLoading={showLoading}
        duration={duration}
        currentTime={currentTime}
        onSeek={handleSeek}
        title={formattedTitle}
        onPlayPause={handlePlayPause}
        mediaTracks={mediaInfo?.tracks}
        selectedTracks={selectedTracks}
        onAudioTrackChange={handleAudioTrackChange}
        onSubtitleTrackChange={handleSubtitleTrackChange}
        hasPreviousEpisode={hasPreviousEpisode}
        hasNextEpisode={hasNextEpisode}
        onPreviousEpisode={handlePreviousEpisode}
        onNextEpisode={handleNextEpisode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    position: 'absolute',
    top: 10,
    left: 100,
    right: 100,
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
    aspectRatio: 16 / 9,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 100,
    zIndex: 10,
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonTouchable: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  danmakuButton: {
    position: 'absolute',
    top: 50,
    right: 100,
    zIndex: 10,
  },
  danmakuButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  danmakuButtonTouchable: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  floatingControls: {
    position: 'absolute',
    bottom: 30,
    left: 100,
    right: 100,
    zIndex: 10,
    padding: 8,
  },
  floatingControlsBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingRight: 16,
  },
  sliderContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  customTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderContainerStyle: {
    borderRadius: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    minWidth: 60,
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  bufferingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  debugContainer: {
    position: 'absolute',
    top: 100,
    left: 100,
    right: 0,
    bottom: 0,
  },
  debugText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
