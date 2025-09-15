import { BlurView } from 'expo-blur';
import * as Brightness from 'expo-brightness';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  setNativeProps,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { VolumeManager } from 'react-native-volume-manager';
import { scheduleOnRN } from 'react-native-worklets';

import { VerticalSlider } from './VerticalSlider';

const formatTime = (time: number) => {
  'worklet';

  const hours = Math.floor(time / 3600000);
  const minutes = Math.floor((time % 3600000) / 60000);
  const seconds = Math.floor((time % 60000) / 1000);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

const throttleWorklet = (callback: () => void, delay: number) => {
  'worklet';

  let timeoutId: number | null = null;

  return () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback();
      timeoutId = null;
    }, delay);
  };
};

type GestureHandlerProps = {
  duration: number;
  currentTime: SharedValue<number>;
  onSeek: (position: number) => void;
  onPlayPause: () => void;
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  fadeAnim: SharedValue<number>;
  isDragging: boolean;
  menuOpen: boolean;
  isGestureSeekingActive: boolean;
  setIsGestureSeekingActive: (active: boolean) => void;
  isVolumeGestureActive: boolean;
  setIsVolumeGestureActive: (active: boolean) => void;
  isBrightnessGestureActive: boolean;
  setIsBrightnessGestureActive: (active: boolean) => void;
  hideControlsWithDelay: () => void;
  clearControlsTimeout: () => void;
};

export function GestureHandler({
  duration,
  currentTime,
  onSeek,
  onPlayPause,
  showControls,
  setShowControls,
  fadeAnim,
  isDragging,
  menuOpen,
  isGestureSeekingActive,
  setIsGestureSeekingActive,
  isVolumeGestureActive,
  setIsVolumeGestureActive,
  isBrightnessGestureActive,
  setIsBrightnessGestureActive,
  hideControlsWithDelay,
  clearControlsTimeout,
}: GestureHandlerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [volume, setVolume] = useState(1.0);
  const [brightness, setBrightness] = useState(1.0);
  const [isInitialized, setIsInitialized] = useState(false);

  const animatedTextInputRef = useAnimatedRef<TextInput>();
  const animatedOffsetTextInputRef = useAnimatedRef<TextInput>();

  const gestureSeekPreview = useSharedValue(0);
  const gestureSeekOffset = useSharedValue(0);
  const gestureVolumePreview = useSharedValue(0);
  const gestureVolumeOffset = useSharedValue(0);
  const gestureBrightnessPreview = useSharedValue(0);
  const gestureBrightnessOffset = useSharedValue(0);
  const volumeSliderValue = useSharedValue(1.0);
  const brightnessSliderValue = useSharedValue(1.0);

  const gestureSeekStartTime = useSharedValue(0);
  const gestureVolumeStartValue = useSharedValue(0);
  const gestureBrightnessStartValue = useSharedValue(0);

  const minimumValue = useSharedValue(0);
  const maximumValue = useSharedValue(1);

  const totalTime = formatTime(duration);

  const seekPreviewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isGestureSeekingActive ? 1 : 0, { duration: 100 }),
  }));

  const volumePreviewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isVolumeGestureActive ? 1 : 0, { duration: 100 }),
  }));

  const brightnessPreviewAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isBrightnessGestureActive ? 1 : 0, { duration: 100 }),
  }));

  useEffect(() => {
    const initializeSystemValues = async () => {
      const systemBrightness = await Brightness.getBrightnessAsync();
      setBrightness(systemBrightness);
      brightnessSliderValue.value = systemBrightness;

      const { volume: systemVolume } = await VolumeManager.getVolume();
      setVolume(systemVolume);
      volumeSliderValue.value = systemVolume;

      setIsInitialized(true);
    };

    initializeSystemValues();
  }, [brightnessSliderValue, volumeSliderValue]);

  const handleSeek = useCallback(
    (position: number) => {
      if (!duration) return;
      const clampedTime = Math.max(0, Math.min(position, duration));
      const newPosition = duration > 0 ? clampedTime / duration : 0;
      onSeek(newPosition);
    },
    [duration, onSeek],
  );

  const handleVolumeChange = useCallback(async (newVolume: number) => {
    setVolume(newVolume);
    await VolumeManager.setVolume(newVolume);
  }, []);

  const throttledBrightnessChange = useCallback(async (newBrightness: number) => {
    setBrightness(newBrightness);
    await Brightness.setBrightnessAsync(newBrightness);
  }, []);

  const handleBrightnessChange = useCallback(
    (newBrightness: number) => {
      const throttledCallback = throttleWorklet(() => {
        scheduleOnRN(throttledBrightnessChange, newBrightness);
      }, 50);

      throttledCallback();
    },
    [throttledBrightnessChange],
  );

  const handleGestureSeekStart = useCallback(() => {
    setIsGestureSeekingActive(true);
    setShowControls(true);
  }, [setIsGestureSeekingActive, setShowControls]);

  const handleGestureSeekEnd = useCallback(
    (finalTime: number) => {
      handleSeek(finalTime);
      setIsGestureSeekingActive(false);
      hideControlsWithDelay();
    },
    [handleSeek, setIsGestureSeekingActive, hideControlsWithDelay],
  );

  const handleVolumeGestureStart = useCallback(() => {
    setIsVolumeGestureActive(true);
    setShowControls(true);
  }, [setIsVolumeGestureActive, setShowControls]);

  const handleVolumeGestureEnd = useCallback(
    (finalVolume: number) => {
      handleVolumeChange(finalVolume);
      setIsVolumeGestureActive(false);
      hideControlsWithDelay();
    },
    [handleVolumeChange, setIsVolumeGestureActive, hideControlsWithDelay],
  );

  const handleBrightnessGestureStart = useCallback(() => {
    setIsBrightnessGestureActive(true);
    setShowControls(true);
  }, [setIsBrightnessGestureActive, setShowControls]);

  const handleBrightnessGestureEnd = useCallback(
    (finalBrightness: number) => {
      throttledBrightnessChange(finalBrightness);
      setIsBrightnessGestureActive(false);
      hideControlsWithDelay();
    },
    [throttledBrightnessChange, setIsBrightnessGestureActive, hideControlsWithDelay],
  );

  const handleSingleTap = () => {
    if (menuOpen) {
      return;
    }

    clearControlsTimeout();

    if (showControls) {
      fadeAnim.value = withTiming(0, { duration: 300 }, () => {
        scheduleOnRN(setShowControls, false);
      });
    } else {
      setShowControls(true);
      fadeAnim.value = withTiming(1, { duration: 200 });
    }
  };

  const handleDoubleTap = () => {
    onPlayPause();
  };

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .activeOffsetX([-15, 15])
    .failOffsetY([-8, 8])
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

      if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
        return;
      }

      if (isVolumeGestureActive || isBrightnessGestureActive) {
        return;
      }

      if (!isGestureSeekingActive) {
        scheduleOnRN(handleGestureSeekStart);
      }

      const progressRatio = deltaX / screenWidth;
      const timeChange = progressRatio * 180000;

      gestureSeekOffset.value = timeChange;
      const newTime = Math.max(0, Math.min(duration, gestureSeekStartTime.value + timeChange));

      const time = newTime;
      gestureSeekPreview.value = time;

      setNativeProps(animatedTextInputRef, {
        text: `${formatTime(newTime)} / ${totalTime}`,
      });

      const offsetSeconds = Math.round(timeChange / 1000);
      const offsetText = offsetSeconds > 0 ? `+${offsetSeconds}s` : `${offsetSeconds}s`;

      setNativeProps(animatedOffsetTextInputRef, {
        text: offsetText,
      });
    })
    .onEnd(() => {
      if (!duration) return;

      if (isGestureSeekingActive) {
        const finalTime = gestureSeekPreview.value;
        scheduleOnRN(handleGestureSeekEnd, finalTime);
      }
    });

  const sliderGesture = Gesture.Pan()
    .minDistance(8)
    .activeOffsetY([-10, 10])
    .failOffsetX([-8, 8])
    .maxPointers(1)
    .onStart((event) => {
      'worklet';

      const isLeftSide = event.x < screenWidth * 0.5;
      const isRightSide = event.x >= screenWidth * 0.5;

      if (isLeftSide) {
        if (!isInitialized) {
          return;
        }
        gestureBrightnessStartValue.value = brightness;
        gestureBrightnessOffset.value = 0;
        gestureBrightnessPreview.value = brightness;
      } else if (isRightSide) {
        gestureVolumeStartValue.value = volume;
        gestureVolumeOffset.value = 0;
        gestureVolumePreview.value = volume;
      }
    })
    .onUpdate((event) => {
      'worklet';

      const isLeftSide = event.x < screenWidth * 0.5;
      const isRightSide = event.x >= screenWidth * 0.5;

      const deltaY = event.translationY;
      const deltaX = event.translationX;

      if (Math.abs(deltaY) <= Math.abs(deltaX) * 1.2) {
        return;
      }

      if (isLeftSide) {
        if (!isInitialized) {
          return;
        }

        if (!isBrightnessGestureActive) {
          scheduleOnRN(handleBrightnessGestureStart);
        }

        const progressRatio = -deltaY / (screenWidth * 0.3);
        const brightnessChange = progressRatio * 0.6;

        gestureBrightnessOffset.value = brightnessChange;
        const newBrightness = Math.max(
          0,
          Math.min(1, gestureBrightnessStartValue.value + brightnessChange),
        );

        gestureBrightnessPreview.value = newBrightness;
        brightnessSliderValue.value = newBrightness;

        scheduleOnRN(handleBrightnessChange, newBrightness);
      } else if (isRightSide) {
        if (!isVolumeGestureActive) {
          scheduleOnRN(handleVolumeGestureStart);
        }

        const progressRatio = -deltaY / (screenWidth * 0.3);
        const volumeChange = progressRatio * 0.6;

        gestureVolumeOffset.value = volumeChange;
        const newVolume = Math.max(0, Math.min(1, gestureVolumeStartValue.value + volumeChange));

        gestureVolumePreview.value = newVolume;
        volumeSliderValue.value = newVolume;

        scheduleOnRN(handleVolumeChange, newVolume);
      }
    })
    .onEnd(() => {
      if (isVolumeGestureActive) {
        const finalVolume = gestureVolumePreview.value;
        scheduleOnRN(handleVolumeGestureEnd, finalVolume);
      }
      if (isBrightnessGestureActive) {
        const finalBrightness = gestureBrightnessPreview.value;
        scheduleOnRN(handleBrightnessGestureEnd, finalBrightness);
      }
    });

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(300)
    .onEnd((_event, success) => {
      if (success) {
        scheduleOnRN(handleSingleTap);
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(100)
    .maxDelay(200)
    .onEnd((_event, success) => {
      if (success) {
        scheduleOnRN(handleDoubleTap);
      }
    });

  const tapGestures = Gesture.Exclusive(doubleTapGesture, tapGesture);
  const panGestures = Gesture.Exclusive(panGesture, sliderGesture);
  const composed = Gesture.Simultaneous(panGestures, tapGestures);

  return (
    <Fragment>
      <Animated.View style={[styles.seekPreviewContainer, seekPreviewAnimatedStyle]}>
        <BlurView tint="dark" intensity={100} style={styles.seekPreviewBlur}>
          <TextInput
            ref={animatedOffsetTextInputRef}
            style={styles.seekPreviewOffsetText}
            caretHidden
            defaultValue=""
            editable={false}
          />
          <TextInput
            ref={animatedTextInputRef}
            style={styles.seekPreviewText}
            caretHidden
            defaultValue=""
            editable={false}
          />
        </BlurView>
      </Animated.View>
      <VerticalSlider
        iconName="volume-high"
        progress={volumeSliderValue}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        style={[volumePreviewAnimatedStyle, styles.volumeSliderContainer]}
      />
      <VerticalSlider
        iconName="sunny"
        progress={brightnessSliderValue}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        style={[brightnessPreviewAnimatedStyle, styles.brightnessSliderContainer]}
      />
      <GestureDetector gesture={composed}>
        <Animated.View style={styles.touchOverlay} />
      </GestureDetector>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  seekPreviewContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
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
  seekPreviewOffsetText: {
    color: '#fff',
    fontSize: 18,
    paddingVertical: 0,
    fontFamily: 'Roboto',
    marginBottom: 4,
  },
  seekPreviewText: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 0,
    fontFamily: 'Roboto',
  },
  volumeSliderContainer: {
    left: 60,
  },
  brightnessSliderContainer: {
    right: 60,
  },
});
