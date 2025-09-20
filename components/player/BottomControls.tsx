import { useCurrentTime } from '@/hooks/useCurrentTime';
import { formatTimeWorklet } from '@/lib/utils';
import Entypo from '@expo/vector-icons/Entypo';
import { BlurView } from 'expo-blur';
import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Slider } from 'react-native-awesome-slider';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

import { usePlayer } from './PlayerContext';

export function BottomControls() {
  const {
    isPlaying,
    isLoading,
    duration,
    currentTime,
    onSeek,
    onPlayPause,
    hasPreviousEpisode,
    hasNextEpisode,
    onPreviousEpisode,
    onNextEpisode,
    showControls,
    fadeAnim,
    isDragging,
    setIsDragging,
    hideControlsWithDelay,
  } = usePlayer();
  const currentTimeMs = useCurrentTime({ time: currentTime });

  const fadeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const progressValue = useSharedValue(0);
  const minimumValue = useSharedValue(0);
  const maximumValue = useSharedValue(1);

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
  };

  const handleSliderSlidingStart = () => {
    setIsDragging(true);
  };

  const handleSliderSlidingComplete = (value: number) => {
    if (!duration) return;
    const newTime = value * duration;
    handleSeek(newTime);
    progressValue.value = value;
    setIsDragging(false);
    hideControlsWithDelay();
  };

  const handlePlayPause = async () => {
    onPlayPause();
  };

  return (
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
          <Text style={styles.timeText}>{formatTimeWorklet(currentTimeMs)}</Text>
        </View>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            containerStyle={{
              overflow: 'hidden',
              borderRadius: 999,
            }}
            progress={progressValue}
            bubble={(percent) => formatTimeWorklet(percent * duration)}
            bubbleTextStyle={{
              fontFamily: 'Roboto',
            }}
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
          <Text style={styles.timeText}>{formatTimeWorklet(duration)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});
