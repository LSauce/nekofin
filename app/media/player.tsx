import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { getStreamInfo } from '@/lib/utils';
import { createApiFromServerInfo, getItemMediaSources } from '@/services/jellyfin';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { OnProgressEventProps, VLCPlayer } from 'react-native-vlc-media-player';

export default function Player() {
  const { itemId } = useLocalSearchParams<{
    itemId: string;
  }>();
  const [videoSource, setVideoSource] = useState<string | null>(null);

  const { currentServer } = useMediaServers();
  const api = useMemo(() => {
    if (!currentServer) return null;
    return createApiFromServerInfo(currentServer);
  }, [currentServer]);

  const player = useRef<VLCPlayer>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressInfo, setProgressInfo] = useState<OnProgressEventProps | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

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

    controlsTimeout.current = setTimeout(() => {
      if (!isDragging) {
        fadeAnim.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(setShowControls)(false);
        });
      }
    }, 3000);
  };

  const handleSeek = (time: number) => {
    if (!progressInfo?.duration || !player.current) return;
    const clampedTime = Math.max(0, Math.min(time, progressInfo.duration));
    const position = progressInfo.duration > 0 ? clampedTime / progressInfo.duration : 0;
    player.current.seek(position);
  };

  const handleSliderChange = (value: number) => {
    if (!progressInfo?.duration) return;
    const newTime = value * progressInfo.duration;
    handleSeek(newTime);
    progressValue.value = value;
  };

  const handleSliderSlidingStart = () => {
    setIsDragging(true);
    showControlsWithTimeout();
  };

  const handleSliderSlidingComplete = (value: number) => {
    if (!progressInfo?.duration) return;
    const newTime = value * progressInfo.duration;
    handleSeek(newTime);
    progressValue.value = value;
    setIsDragging(false);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
    showControlsWithTimeout();
  };

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
      const mediaSourcesResponse = await getItemMediaSources(api, itemId);
      const mediaSourceId = mediaSourcesResponse.data.MediaSources?.[0]?.Id;

      if (!mediaSourceId) {
        console.error('No media source id found');
        return;
      }

      const streamInfo = await getStreamInfo({
        api,
        itemId,
        mediaSourceId,
        userId: currentServer.userId,
      });

      if (streamInfo) {
        setVideoSource(streamInfo.url);
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

  if (!videoSource) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <VLCPlayer
        ref={player}
        style={styles.video}
        resizeMode="cover"
        source={{ uri: videoSource }}
        paused={!isPlaying}
        onPlaying={(e) => {
          console.log('onPlaying', e.seekable, e.duration);
          setIsBuffering(false);
        }}
        onProgress={setProgressInfo}
        onBuffering={() => setIsBuffering(true)}
      />
      <Animated.View
        style={[styles.backButton, fadeAnimatedStyle]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <BlurView tint="systemChromeMaterialDark" intensity={100} style={styles.backButtonBlur}>
          <TouchableOpacity style={styles.backButtonTouchable} onPress={handleBackPress}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
      <Animated.View
        style={[styles.floatingControls, fadeAnimatedStyle]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <BlurView
          tint="systemChromeMaterialDark"
          intensity={100}
          style={[StyleSheet.absoluteFill, styles.floatingControlsBlur]}
        />
        <View style={styles.progressContainer}>
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
              <Entypo
                name={isPlaying ? 'controller-paus' : 'controller-play'}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
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
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </Animated.View>
      <TouchableOpacity
        style={styles.touchOverlay}
        onPress={showControlsWithTimeout}
        activeOpacity={1}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
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
});
