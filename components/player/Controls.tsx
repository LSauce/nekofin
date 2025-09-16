import { MediaTrack, MediaTracks } from '@/modules';
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
  tracks?: MediaTracks;
  selectedTracks?: MediaTrack;
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
  tracks,
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
  const isGestureSeekingActive = useSharedValue(false);
  const isVolumeGestureActive = useSharedValue(false);
  const isBrightnessGestureActive = useSharedValue(false);

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
        !isGestureSeekingActive.value &&
        !isVolumeGestureActive.value &&
        !isBrightnessGestureActive.value
      ) {
        scheduleOnRN(setShowControls, false);
      }
    }, 3000);
  }, [
    clearControlsTimeout,
    isDragging,
    menuOpen,
    isGestureSeekingActive,
    isVolumeGestureActive,
    isBrightnessGestureActive,
  ]);

  useEffect(() => {
    if (menuOpen) {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      setShowControls(true);
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

  useEffect(() => {
    if (showControls) {
      fadeAnim.value = withTiming(1, { duration: 200 });
      hideControlsWithDelay();
    } else {
      fadeAnim.value = withTiming(0, { duration: 300 });
      clearControlsTimeout();
    }
  }, [showControls, fadeAnim, hideControlsWithDelay, clearControlsTimeout]);

  return (
    <Fragment>
      <TopControls
        title={title}
        showControls={showControls}
        setShowControls={setShowControls}
        fadeAnim={fadeAnim}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        tracks={tracks}
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
        isVolumeGestureActive={isVolumeGestureActive}
        isBrightnessGestureActive={isBrightnessGestureActive}
        hideControlsWithDelay={hideControlsWithDelay}
        clearControlsTimeout={clearControlsTimeout}
      />
    </Fragment>
  );
}
