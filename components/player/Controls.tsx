import { MediaTracks, Tracks } from 'expo-libvlc-player';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { BottomControls } from './BottomControls';
import { GestureHandler } from './GestureHandler';
import { TopControls } from './TopControls';

type ControlsProps = {
  title: string;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: SharedValue<number>;
  onSeek: (position: number) => void;
  onPlayPause: () => void;
  onRateChange?: (newRate: number | null, options?: { remember?: boolean }) => void;
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
  onRateChange,
  mediaTracks,
  selectedTracks,
  onAudioTrackChange,
  onSubtitleTrackChange,
  hasPreviousEpisode,
  hasNextEpisode,
  onPreviousEpisode,
  onNextEpisode,
}: ControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGestureSeekingActive, setIsGestureSeekingActive] = useState(false);
  const [isVolumeGestureActive, setIsVolumeGestureActive] = useState(false);
  const [isBrightnessGestureActive, setIsBrightnessGestureActive] = useState(false);

  const fadeAnim = useSharedValue(1);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearControlsTimeout = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = null;
    }
  }, []);

  const hideControlsWithDelay = useCallback(() => {
    clearControlsTimeout();

    if (menuOpen) {
      return;
    }

    controlsTimeout.current = setTimeout(() => {
      if (
        !isDragging &&
        !menuOpen &&
        !isGestureSeekingActive &&
        !isVolumeGestureActive &&
        !isBrightnessGestureActive
      ) {
        fadeAnim.value = withTiming(0, { duration: 300 }, () => {
          scheduleOnRN(setShowControls, false);
        });
      }
    }, 3000);
  }, [
    clearControlsTimeout,
    fadeAnim,
    isDragging,
    menuOpen,
    isGestureSeekingActive,
    isVolumeGestureActive,
    isBrightnessGestureActive,
  ]);

  useEffect(() => {
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

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  return (
    <Fragment>
      <TopControls
        title={title}
        showControls={showControls}
        fadeAnim={fadeAnim}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        mediaTracks={mediaTracks}
        selectedTracks={selectedTracks}
        onAudioTrackChange={onAudioTrackChange}
        onSubtitleTrackChange={onSubtitleTrackChange}
      />

      <BottomControls
        isPlaying={isPlaying}
        isLoading={isLoading}
        duration={duration}
        currentTime={currentTime}
        onSeek={onSeek}
        onPlayPause={onPlayPause}
        hasPreviousEpisode={hasPreviousEpisode}
        hasNextEpisode={hasNextEpisode}
        onPreviousEpisode={onPreviousEpisode}
        onNextEpisode={onNextEpisode}
        showControls={showControls}
        fadeAnim={fadeAnim}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        hideControlsWithDelay={hideControlsWithDelay}
      />

      <GestureHandler
        duration={duration}
        currentTime={currentTime}
        onSeek={onSeek}
        onPlayPause={onPlayPause}
        onRateChange={onRateChange}
        showControls={showControls}
        setShowControls={setShowControls}
        fadeAnim={fadeAnim}
        isDragging={isDragging}
        menuOpen={menuOpen}
        isGestureSeekingActive={isGestureSeekingActive}
        setIsGestureSeekingActive={setIsGestureSeekingActive}
        isVolumeGestureActive={isVolumeGestureActive}
        setIsVolumeGestureActive={setIsVolumeGestureActive}
        isBrightnessGestureActive={isBrightnessGestureActive}
        setIsBrightnessGestureActive={setIsBrightnessGestureActive}
        hideControlsWithDelay={hideControlsWithDelay}
        clearControlsTimeout={clearControlsTimeout}
      />
    </Fragment>
  );
}
