import { useDanmakuSettings } from '@/lib/contexts/DanmakuSettingsContext';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { getDeviceProfile } from '@/lib/Device';
import { getStreamInfo } from '@/lib/utils';
import { VlcPlayerView } from '@/modules';
import type { ProgressUpdatePayload, VlcPlayerViewRef } from '@/modules/VlcPlayer.types';
import {
  getCommentsByEpisodeId,
  searchAnimesByKeyword,
  type DandanComment,
} from '@/services/dandanplay';
import { createApiFromServerInfo, getItemDetail } from '@/services/jellyfin';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BlurView } from 'expo-blur';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';

import { DanmakuSettings } from './DanmakuSettings';

const LoadingIndicator = () => {
  return (
    <View style={[StyleSheet.absoluteFill, styles.bufferingOverlay]} pointerEvents="none">
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
};

export const VideoPlayer = ({ itemId }: { itemId: string }) => {
  const router = useRouter();
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [itemDetail, setItemDetail] = useState<BaseItemDto | null>(null);
  const [comments, setComments] = useState<DandanComment[]>([]);
  const { settings: danmakuSettings, setSettings: setDanmakuSettings } = useDanmakuSettings();

  const { currentServer } = useMediaServers();
  const api = useMemo(() => {
    if (!currentServer) return null;
    return createApiFromServerInfo(currentServer);
  }, [currentServer]);

  const player = useRef<VlcPlayerViewRef>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressInfo, setProgressInfo] = useState<ProgressUpdatePayload['nativeEvent'] | null>(
    null,
  );
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fadeAnim = useSharedValue(1);
  const progressValue = useSharedValue(0);
  const minimumValue = useSharedValue(0);
  const maximumValue = useSharedValue(1);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTime = useMemo(() => {
    return progressInfo?.currentTime ?? 0;
  }, [progressInfo]);

  const duration = useMemo(() => {
    return progressInfo?.duration ?? 0;
  }, [progressInfo]);

  const progress = useMemo(() => {
    return duration > 0 ? currentTime / duration : 0;
  }, [currentTime, duration]);

  const formattedTitle = useMemo(() => {
    if (!itemDetail) return '';
    const seriesName = itemDetail.SeriesName ?? '';
    const seasonNumber =
      (itemDetail as any).ParentIndexNumber ?? (itemDetail as any).SeasonIndexNumber;
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
    progressValue.value = progress;
  }, [progress, progressValue]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const fadeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const showControlsWithTimeout = () => {
    setShowControls(true);
    fadeAnim.value = withTiming(1, { duration: 200 });

    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }

    if (!menuOpen) {
      controlsTimeout.current = setTimeout(() => {
        if (!isDragging && !menuOpen) {
          fadeAnim.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(setShowControls)(false);
          });
        }
      }, 3000);
    }
  };

  const hideControlsWithDelay = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }

    if (menuOpen) {
      return;
    }

    controlsTimeout.current = setTimeout(() => {
      if (!isDragging && !menuOpen) {
        fadeAnim.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(setShowControls)(false);
        });
      }
    }, 3000);
  }, [fadeAnim, isDragging, menuOpen]);

  useEffect(() => {
    // hide controls when first loaded
    hideControlsWithDelay();
  }, [hideControlsWithDelay]);

  useEffect(() => {
    if (menuOpen) {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      setShowControls(true);
      fadeAnim.value = withTiming(1, { duration: 200 });
    } else {
      hideControlsWithDelay();
    }
  }, [menuOpen, hideControlsWithDelay, fadeAnim]);

  const handleSeek = (time: number) => {
    player.current?.seekTo(time);
  };

  const handleSliderChange = (value: number) => {
    if (!progressInfo?.duration) return;
    const newTime = value * progressInfo.duration;
    handleSeek(newTime);
    progressValue.value = value;
    setShowControls(true);
    fadeAnim.value = withTiming(1, { duration: 200 });
  };

  const handleSliderSlidingStart = () => {
    setIsDragging(true);
    setShowControls(true);
    fadeAnim.value = withTiming(1, { duration: 200 });
  };

  const handleSliderSlidingComplete = (value: number) => {
    if (!progressInfo?.duration) return;
    const newTime = value * progressInfo.duration;
    handleSeek(newTime);
    progressValue.value = value;
    setIsDragging(false);
    hideControlsWithDelay();
  };

  const handleBackPress = () => {
    router.back();
  };

  const handlePlayPause = async () => {
    setIsPlaying((prev) => !prev);
    if (isPlaying) {
      await player.current?.pause();
    } else {
      await player.current?.play();
    }
    showControlsWithTimeout();
  };

  const handleSingleTap = () => {
    if (menuOpen) {
      return;
    }
    if (showControls) {
      fadeAnim.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setShowControls)(false);
      });
    } else {
      runOnJS(showControlsWithTimeout)();
    }
  };

  const handleDoubleTap = () => {
    handlePlayPause();
  };

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(300)
    .onEnd((_event, success) => {
      if (success) {
        runOnJS(handleSingleTap)();
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd((_event, success) => {
      if (success) {
        runOnJS(handleDoubleTap)();
      }
    });

  const composed = Gesture.Exclusive(doubleTapGesture, tapGesture);

  useEffect(() => {
    (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        StatusBar.setHidden(true);
      } catch (e) {
        console.warn('Failed to lock orientation', e);
      }
    })();

    return () => {
      (async () => {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          StatusBar.setHidden(false);
        } catch (e) {
          console.warn('Failed to unlock orientation', e);
        }
      })();
    };
  }, []);

  useEffect(() => {
    if (!api || !itemId || !currentServer) return;

    (async () => {
      const itemDetail = await getItemDetail(api, itemId);
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
        const seriesName = itemDetail.data.SeriesName;
        const seasonNumber = itemDetail.data.ParentIndexNumber;
        const episodeNumber = itemDetail.data.IndexNumber;

        const animes = await searchAnimesByKeyword(seriesName ?? '');
        const anime = animes[1];
        console.log(anime);
        if (anime && episodeNumber) {
          console.log(anime.episodes[episodeNumber - 13].episodeId);
          const comments = await getCommentsByEpisodeId(
            anime.episodes[episodeNumber - 13].episodeId,
          );
          setComments(comments);
        }
      } catch (error) {
        console.warn('Failed to load danmaku comments:', error);
      }
    })();
  }, [api, itemId, currentServer]);

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  const showLoading = useMemo(() => {
    return isBuffering || !videoSource || !isLoaded;
  }, [isBuffering, videoSource, isLoaded]);

  const handleDanmakuSettingsPress = () => {
    setSettingsVisible(true);
  };

  return (
    <View style={styles.container}>
      {videoSource && (
        <VlcPlayerView
          ref={player}
          style={styles.video}
          source={{
            uri: videoSource,
            autoplay: true,
            isNetwork: true,
            externalSubtitles: [],
          }}
          onVideoProgress={(e) => {
            setProgressInfo(e.nativeEvent);
            setIsBuffering(false);
            setIsLoaded(true);
          }}
          onVideoStateChange={async (e) => {
            const { state, isBuffering } = e.nativeEvent;
            if (state === 'Playing') {
              setIsPlaying(true);
              await activateKeepAwakeAsync();
            } else if (state === 'Paused') {
              setIsPlaying(false);
              await deactivateKeepAwake();
            }
            setIsBuffering(isBuffering);
          }}
          onVideoError={(e) => {
            console.error('Video Error:', e.nativeEvent);
            Alert.alert('Video Error', e.nativeEvent.state);
          }}
        />
      )}
      {showLoading && <LoadingIndicator />}

      {/* {comments.length > 0 && (
        <DanmakuLayer
          currentTimeMs={currentTime}
          isPlaying={isPlaying}
          comments={comments}
          {...danmakuSettings}
        />
      )} */}

      <DanmakuSettings
        visible={settingsVisible}
        settings={danmakuSettings}
        onSettingsChange={setDanmakuSettings}
        onClose={() => setSettingsVisible(false)}
      />

      <Animated.View
        style={[styles.backButton, fadeAnimatedStyle]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <BlurView tint="dark" intensity={100} style={styles.backButtonBlur}>
          <TouchableOpacity style={styles.backButtonTouchable} onPress={handleBackPress}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {comments.length > 0 && (
        <Animated.View
          style={[styles.danmakuButton, fadeAnimatedStyle]}
          pointerEvents={showControls ? 'auto' : 'none'}
        >
          <BlurView tint="dark" intensity={100} style={styles.danmakuButtonBlur}>
            <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenu.Trigger asChild>
                <TouchableOpacity style={styles.danmakuButtonTouchable}>
                  <AntDesign name="setting" size={20} color="white" />
                </TouchableOpacity>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item key="danmaku-settings" onSelect={handleDanmakuSettingsPress}>
                  <DropdownMenu.ItemTitle>弹幕设置</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </BlurView>
        </Animated.View>
      )}

      {!!formattedTitle && (
        <Animated.View style={[styles.titleContainer, fadeAnimatedStyle]} pointerEvents="none">
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {formattedTitle}
          </Text>
        </Animated.View>
      )}
      <Animated.View
        style={[styles.floatingControls, fadeAnimatedStyle]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <BlurView
          tint="dark"
          intensity={100}
          style={[StyleSheet.absoluteFill, styles.floatingControlsBlur]}
          experimentalBlurMethod="dimezisBlurView"
        />
        <View style={styles.progressContainer}>
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
              {showLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Entypo
                  name={isPlaying ? 'controller-paus' : 'controller-play'}
                  size={24}
                  color="white"
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          </View>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              containerStyle={{
                overflow: 'hidden',
                borderRadius: 999,
              }}
              progress={progressValue}
              bubble={(percent) => formatTime(percent * duration)}
              minimumValue={minimumValue}
              maximumValue={maximumValue}
              onValueChange={handleSliderChange}
              onSlidingStart={handleSliderSlidingStart}
              onSlidingComplete={handleSliderSlidingComplete}
              theme={{
                minimumTrackTintColor: '#fff',
                maximumTrackTintColor: 'rgba(255, 255, 255, 0.3)',
              }}
              disableTapEvent={false}
              disableTrackFollow
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      </Animated.View>
      <GestureDetector gesture={composed}>
        <Animated.View style={styles.touchOverlay} />
      </GestureDetector>
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
});
