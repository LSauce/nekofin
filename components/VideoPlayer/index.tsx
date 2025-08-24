import { useDanmakuSettings } from '@/lib/contexts/DanmakuSettingsContext';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { getDeviceProfile } from '@/lib/Device';
import { getCommentsByItem, getStreamInfo } from '@/lib/utils';
import { type DandanComment } from '@/services/dandanplay';
import { createApiFromServerInfo, getItemDetail } from '@/services/jellyfin';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BlurView } from 'expo-blur';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LibVlcPlayerView, LibVlcPlayerViewRef, type MediaInfo } from 'expo-libvlc-player';
import * as NavigationBar from 'expo-navigation-bar';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as DropdownMenu from 'zeego/dropdown-menu';

import { DanmakuLayer } from './DanmakuLayer';
import { DanmakuSettings } from './DanmakuSettings';

const PLAYBACK_RATE = 1;

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

  const player = useRef<LibVlcPlayerViewRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [position, setPosition] = useState(0);

  const bufferingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeAnim = useSharedValue(1);
  const progressValue = useSharedValue(0);
  const minimumValue = useSharedValue(0);
  const maximumValue = useSharedValue(1);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [externalCurrentTime, setExternalCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(PLAYBACK_RATE);
  const [seekKey, setSeekKey] = useState(0);
  const externalTimeInterval = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const duration = useMemo(() => {
    return mediaInfo?.duration ?? 0;
  }, [mediaInfo]);

  const currentTime = useMemo(() => {
    return duration * position;
  }, [duration, position]);

  const progress = useMemo(() => {
    return duration > 0 ? currentTime / duration : 0;
  }, [currentTime, duration]);

  const startExternalTimeUpdate = useCallback(() => {
    if (externalTimeInterval.current) {
      cancelAnimationFrame(externalTimeInterval.current);
    }

    let lastTime = performance.now();
    const updateTime = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      setExternalCurrentTime((prevTime) => {
        if (isPlaying && !isBuffering) {
          return prevTime + deltaTime * playbackRate;
        }
        return prevTime;
      });

      externalTimeInterval.current = requestAnimationFrame(updateTime);
    };

    externalTimeInterval.current = requestAnimationFrame(updateTime);
  }, [isPlaying, isBuffering, playbackRate]);

  const stopExternalTimeUpdate = useCallback(() => {
    if (externalTimeInterval.current) {
      cancelAnimationFrame(externalTimeInterval.current);
      externalTimeInterval.current = null;
    }
  }, []);

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
    if (!isDragging) {
      progressValue.value = progress;
    }
  }, [progress, progressValue, isDragging]);

  useEffect(() => {
    if (isPlaying && !isBuffering && isLoaded) {
      startExternalTimeUpdate();
    } else {
      stopExternalTimeUpdate();
    }

    return () => {
      stopExternalTimeUpdate();
    };
  }, [isPlaying, isBuffering, isLoaded, startExternalTimeUpdate, stopExternalTimeUpdate]);

  useEffect(() => {
    return () => {
      stopExternalTimeUpdate();
    };
  }, [stopExternalTimeUpdate]);

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
    if (!mediaInfo?.duration || !player.current) return;
    const clampedTime = Math.max(0, Math.min(time, mediaInfo.duration));
    const position = mediaInfo.duration > 0 ? clampedTime / mediaInfo.duration : 0;
    player.current.seek(position);
    setExternalCurrentTime(time);
    setSeekKey((prev) => prev + 1);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
  };

  const handleSliderChange = (value: number) => {
    if (!mediaInfo?.duration) return;
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
    if (!mediaInfo?.duration) return;
    const newTime = value * mediaInfo.duration;
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
    StatusBar.setHidden(true, 'none');
    (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (e) {
        console.warn('Failed to lock orientation', e);
      }
    })();

    return () => {
      StatusBar.setHidden(false);
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
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

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

  const showLoading = useMemo(() => {
    return isBuffering || !videoSource || !isLoaded || (isPlaying && position === 0);
  }, [isBuffering, videoSource, isLoaded, isPlaying, position]);

  const handleDanmakuSettingsPress = () => {
    setSettingsVisible(true);
  };

  return (
    <View style={styles.container}>
      {videoSource && (
        <LibVlcPlayerView
          ref={player}
          style={styles.video}
          source={videoSource}
          options={['network-caching=1000']}
          autoplay={true}
          rate={playbackRate}
          onBuffering={() => {
            setIsBuffering(true);

            if (bufferingTimeoutRef.current) {
              clearTimeout(bufferingTimeoutRef.current);
            }

            bufferingTimeoutRef.current = setTimeout(() => setIsBuffering(false), 1000);
          }}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
            setIsStopped(false);
          }}
          onPaused={() => {
            setIsBuffering(false);
            setIsPlaying(false);
            setIsStopped(false);
          }}
          onStopped={() => {
            setPosition(0);
            setIsBuffering(false);
            setIsPlaying(false);
            setIsStopped(true);
          }}
          onPositionChanged={({ position }) => {
            setPosition(position);
            setIsBuffering(false);
          }}
          onFirstPlay={(mediaInfo) => {
            setIsLoaded(true);
            setMediaInfo(mediaInfo);
            setExternalCurrentTime(0);
          }}
          onEncounteredError={(error) => {
            console.warn('Encountered error', error);
          }}
        />
      )}
      {showLoading && <LoadingIndicator />}

      {/* <View style={styles.debugContainer}>
        <Text style={styles.debugText}>position: {position}</Text>
        <Text style={styles.debugText}>isPlaying: {isPlaying ? 'true' : 'false'}</Text>
        <Text style={styles.debugText}>isBuffering: {isBuffering ? 'true' : 'false'}</Text>
        <Text style={styles.debugText}>isStopped: {isStopped ? 'true' : 'false'}</Text>
      </View> */}

      {comments.length > 0 && (
        <DanmakuLayer
          currentTimeMs={externalCurrentTime}
          isPlaying={!showLoading && !isStopped && isPlaying}
          comments={comments}
          {...danmakuSettings}
          seekKey={seekKey}
        />
      )}

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
