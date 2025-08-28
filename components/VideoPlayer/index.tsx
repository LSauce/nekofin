import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { getDeviceProfile } from '@/lib/Device';
import { getCommentsByItem, getStreamInfo } from '@/lib/utils';
import { type DandanComment } from '@/services/dandanplay';
import { createApiFromServerInfo, getItemDetail } from '@/services/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  LibVlcPlayerView,
  LibVlcPlayerViewRef,
  Position,
  type MediaInfo,
} from 'expo-libvlc-player';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as StatusBar from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

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
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [itemDetail, setItemDetail] = useState<BaseItemDto | null>(null);
  const [comments, setComments] = useState<DandanComment[]>([]);

  const { currentServer } = useMediaServers();
  const api = useMemo(() => {
    if (!currentServer) return null;
    return createApiFromServerInfo(currentServer);
  }, [currentServer]);

  const player = useRef<LibVlcPlayerViewRef>(null);
  const currentTime = useSharedValue(0);

  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  const showLoading = useMemo(() => {
    return isBuffering || !videoSource || !isLoaded;
  }, [isBuffering, videoSource, isLoaded]);

  const bufferingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const duration = useMemo(() => {
    return mediaInfo?.duration ?? 0;
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

  useEffect(() => {
    StatusBar.setStatusBarHidden(true, 'none');
    (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (e) {
        console.warn('Failed to lock orientation', e);
      }
    })();

    return () => {
      StatusBar.setStatusBarHidden(false);
      (async () => {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch (e) {
          console.warn('Failed to unlock orientation', e);
        }
      })();
    };
  }, []);

  useEffect(() => {
    if (!api || !itemId || !currentServer) return;

    (async () => {
      const itemDetail = await getItemDetail(api, itemId, currentServer.userId);
      const seriesInfo = await getItemDetail(
        api,
        itemDetail.data.SeriesId ?? '',
        currentServer.userId,
      );
      setItemDetail(itemDetail.data);

      const streamInfo = await getStreamInfo({
        api,
        itemId,
        userId: currentServer.userId,
        deviceProfile: getDeviceProfile(),
      });

      if (streamInfo) {
        setVideoSource(streamInfo.url);
      }

      try {
        const comments = await getCommentsByItem(itemDetail.data, seriesInfo.data.OriginalTitle);
        setComments(comments ?? []);
      } catch (error) {
        console.warn('Failed to load danmaku comments:', error);
      }
    })();
  }, [api, itemId, currentServer]);

  useEffect(() => {
    (async () => {
      if (isPlaying) {
        await activateKeepAwakeAsync();
      } else {
        await deactivateKeepAwake();
      }
    })();
  }, [isPlaying]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      return () => {
        NavigationBar.setVisibilityAsync('visible');
      };
    }
  }, []);

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
    },
    [currentTime, duration],
  );

  console.log('Debug: component re-render');

  return (
    <View style={styles.container}>
      {videoSource && (
        <LibVlcPlayerView
          ref={player}
          style={styles.video}
          source={videoSource}
          options={['network-caching=1000']}
          autoplay={true}
          onBuffering={handleBuffering}
          onPlaying={() => {
            setIsBuffering(false);
            // setIsPlaying(true);
            setIsStopped(false);
          }}
          onPaused={() => {
            setIsBuffering(false);
            setIsPlaying(false);
            setIsStopped(false);
          }}
          onPositionChanged={handlePositionChanged}
          onFirstPlay={(mediaInfo) => {
            setIsLoaded(true);
            setMediaInfo(mediaInfo);
          }}
          onEncounteredError={(error) => {
            console.warn('Encountered error', error);
          }}
        />
      )}
      {showLoading && <LoadingIndicator />}

      {comments.length > 0 && (
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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
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
