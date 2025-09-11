import { useCurrentTime } from '@/hooks/useCurrentTime';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { MenuView } from '@react-native-menu/menu';
import { BlurView } from 'expo-blur';
import { MediaTracks, Tracks } from 'expo-libvlc-player';
import { useRouter } from 'expo-router';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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

type ControlsProps = {
  title: string;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: SharedValue<number>;
  onSeek: (position: number) => void;
  onPlayPause: () => void;
  mediaTracks?: MediaTracks;
  selectedTracks?: Tracks;
  onAudioTrackChange?: (trackIndex: number) => void;
  onSubtitleTrackChange?: (trackIndex: number) => void;
  hasPreviousEpisode?: boolean;
  hasNextEpisode?: boolean;
  onPreviousEpisode?: () => void;
  onNextEpisode?: () => void;
};

export function Controls({
  isPlaying,
  isLoading,
  duration,
  currentTime,
  onSeek,
  title,
  onPlayPause,
  mediaTracks,
  selectedTracks,
  onAudioTrackChange,
  onSubtitleTrackChange,
  hasPreviousEpisode,
  hasNextEpisode,
  onPreviousEpisode,
  onNextEpisode,
}: ControlsProps) {
  const currentTimeMs = useCurrentTime({ time: currentTime });
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGestureSeekingActive, setIsGestureSeekingActive] = useState(false);

  const fadeAnim = useSharedValue(1);
  const progressValue = useSharedValue(0);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minimumValue = useSharedValue(0);
  const maximumValue = useSharedValue(1);

  const gestureSeekPreview = useSharedValue(0);

  const audioTracks =
    mediaTracks?.audio.filter((track) => track.id !== -1).sort((a, b) => a.id - b.id) ?? [];
  const subtitleTracks =
    mediaTracks?.subtitle.filter((track) => track.id !== -1).sort((a, b) => a.id - b.id) ?? [];

  const fadeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const [previewTimeDisplay, setPreviewTimeDisplay] = useState('00:00');

  const seekPreviewAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isGestureSeekingActive ? 1 : 0, { duration: 150 }),
    };
  });

  useDerivedValue(() => {
    if (isGestureSeekingActive) {
      const time = gestureSeekPreview.value;
      const hours = Math.floor(time / 3600000);
      const minutes = Math.floor((time % 3600000) / 60000);
      const seconds = Math.floor((time % 60000) / 1000);

      let formattedTime: string;
      if (hours > 0) {
        formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }

      runOnJS(setPreviewTimeDisplay)(formattedTime);
    }
  });

  const showControlsWithTimeout = () => {
    setShowControls(true);
    fadeAnim.value = withTiming(1, { duration: 200 });

    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }

    if (!menuOpen) {
      controlsTimeout.current = setTimeout(() => {
        if (!isDragging && !menuOpen && !isGestureSeekingActive) {
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
      if (!isDragging && !menuOpen && !isGestureSeekingActive) {
        fadeAnim.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(setShowControls)(false);
        });
      }
    }, 3000);
  }, [fadeAnim, isDragging, menuOpen, isGestureSeekingActive]);

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

  useDerivedValue(() => {
    if (!isDragging && duration > 0) {
      const progress = currentTime.value / duration;
      progressValue.value = progress;
    }
  });

  const handleSeek = useCallback(
    (position: number) => {
      if (!duration) return;
      const clampedTime = Math.max(0, Math.min(position, duration));
      const newPosition = duration > 0 ? clampedTime / duration : 0;
      onSeek(newPosition);
    },
    [duration, onSeek],
  );

  const handleSliderChange = (value: number) => {
    if (!duration) return;
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
    if (!duration) return;
    const newTime = value * duration;
    handleSeek(newTime);
    progressValue.value = value;
    setIsDragging(false);
    hideControlsWithDelay();
  };

  const handleBackPress = () => {
    router.back();
  };

  const handlePlayPause = async () => {
    onPlayPause();
    showControlsWithTimeout();
  };

  const handleAudioTrackSelect = (trackIndex: number) => {
    onAudioTrackChange?.(trackIndex);
  };

  const handleSubtitleTrackSelect = (trackIndex: number) => {
    onSubtitleTrackChange?.(trackIndex);
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

  const gestureSeekStartTime = useSharedValue(0);
  const gestureSeekOffset = useSharedValue(0);

  const handleGestureSeekStart = useCallback(() => {
    setIsGestureSeekingActive(true);
    setShowControls(true);
  }, []);

  const handleGestureSeekEnd = useCallback(
    (finalTime: number) => {
      handleSeek(finalTime);
      setIsGestureSeekingActive(false);
      hideControlsWithDelay();
    },
    [handleSeek, hideControlsWithDelay],
  );

  const panGesture = Gesture.Pan()
    .minDistance(50)
    .activeOffsetX([-30, 30])
    .failOffsetY([-30, 30])
    .maxPointers(1)
    .onBegin(() => {
      gestureSeekStartTime.value = currentTime.value;
      gestureSeekOffset.value = 0;
      gestureSeekPreview.value = currentTime.value;
    })
    .onUpdate((event) => {
      'worklet';
      if (!duration) return;

      const deltaX = event.translationX;
      const deltaY = event.translationY;

      if (Math.abs(deltaX) <= Math.abs(deltaY) * 2) {
        return;
      }

      if (!isGestureSeekingActive) {
        runOnJS(handleGestureSeekStart)();
      }

      const progressRatio = deltaX / screenWidth;
      const timeChange = progressRatio * 90000;

      gestureSeekOffset.value = timeChange;
      const newTime = Math.max(0, Math.min(duration, gestureSeekStartTime.value + timeChange));

      gestureSeekPreview.value = newTime;
    })
    .onEnd(() => {
      'worklet';
      if (!duration) return;

      const finalTime = gestureSeekPreview.value;
      runOnJS(handleGestureSeekEnd)(finalTime);
    });

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
    .maxDelay(200)
    .onEnd((_event, success) => {
      if (success) {
        runOnJS(handleDoubleTap)();
      }
    });

  const composed = Gesture.Exclusive(doubleTapGesture, tapGesture, panGesture);

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  return (
    <Fragment>
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
          <MenuView
            isAnchoredToRight
            onPressAction={({ nativeEvent }) => {
              const key = nativeEvent.event;
              if (key.startsWith('audio_')) {
                const trackIndex = parseInt(key.replace('audio_', ''));
                handleAudioTrackSelect(trackIndex);
              } else if (key.startsWith('subtitle_')) {
                const trackIndex = parseInt(key.replace('subtitle_', ''));
                handleSubtitleTrackSelect(trackIndex);
              }
              setMenuOpen(false);
            }}
            onCloseMenu={() => {
              setMenuOpen(false);
            }}
            actions={[
              ...(audioTracks.length > 0
                ? [
                    {
                      id: 'audio',
                      title: '音轨选择',
                      subactions: audioTracks.map((track) => ({
                        id: `audio_${track.id}`,
                        title: track.name,
                        state:
                          selectedTracks?.audio === track.id ? ('on' as const) : ('off' as const),
                      })),
                    },
                  ]
                : []),
              ...(subtitleTracks.length > 0
                ? [
                    {
                      id: 'subtitle',
                      title: '字幕选择',
                      subactions: [
                        {
                          id: 'subtitle_-1',
                          title: '关闭字幕',
                          state:
                            selectedTracks?.subtitle === -1 ? ('on' as const) : ('off' as const),
                        },
                        ...subtitleTracks.map((track) => ({
                          id: `subtitle_${track.id}`,
                          title: track.name,
                          state:
                            selectedTracks?.subtitle === track.id
                              ? ('on' as const)
                              : ('off' as const),
                        })),
                      ],
                    },
                  ]
                : []),
            ]}
          >
            <TouchableOpacity
              style={styles.danmakuButtonTouchable}
              onPress={() => {
                setMenuOpen(true);
              }}
            >
              <AntDesign name="setting" size={20} color="white" />
            </TouchableOpacity>
          </MenuView>
        </BlurView>
      </Animated.View>

      {!!title && (
        <Animated.View style={[styles.titleContainer, fadeAnimatedStyle]} pointerEvents="none">
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
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
            <TouchableOpacity
              style={[styles.episodeButton, !hasPreviousEpisode && styles.disabledButton]}
              onPress={hasPreviousEpisode ? onPreviousEpisode : undefined}
              disabled={!hasPreviousEpisode}
            >
              <Entypo
                name="controller-jump-to-start"
                size={24}
                color={hasPreviousEpisode ? 'white' : 'rgba(255,255,255,0.3)'}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.episodeButton} onPress={handlePlayPause}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Entypo
                  name={isPlaying ? 'controller-paus' : 'controller-play'}
                  size={24}
                  color="white"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.episodeButton, !hasNextEpisode && styles.disabledButton]}
              onPress={hasNextEpisode ? onNextEpisode : undefined}
              disabled={!hasNextEpisode}
            >
              <Entypo
                name="controller-next"
                size={24}
                color={hasNextEpisode ? 'white' : 'rgba(255,255,255,0.3)'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTimeMs)}</Text>
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
            />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      </Animated.View>
      <Animated.View style={[styles.seekPreviewContainer, seekPreviewAnimatedStyle]}>
        <BlurView tint="dark" intensity={100} style={styles.seekPreviewBlur}>
          <Text style={styles.seekPreviewText}>{previewTimeDisplay}</Text>
        </BlurView>
      </Animated.View>
      <GestureDetector gesture={composed}>
        <Animated.View style={styles.touchOverlay} />
      </GestureDetector>
    </Fragment>
  );
}

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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
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
  episodeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
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
  seekPreviewContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -25 }],
    zIndex: 15,
  },
  seekPreviewBlur: {
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  seekPreviewText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
