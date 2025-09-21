import { MediaStats, MediaTrack, MediaTracks } from '@/modules/vlc-player';
import { DandanComment } from '@/services/dandanplay';
import { createContext, useContext } from 'react';
import { SharedValue } from 'react-native-reanimated';

export type PlayerContextValue = {
  title: string;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  currentTime: SharedValue<number>;
  onSeek: (position: number) => void;
  onPlayPause: () => void;
  onRateChange?: (newRate: number | null, options?: { remember?: boolean }) => void;
  rate: number;
  tracks?: MediaTracks;
  selectedTracks?: MediaTrack;
  onAudioTrackChange?: (trackIndex: number) => void;
  onSubtitleTrackChange?: (trackIndex: number) => void;
  hasPreviousEpisode?: boolean;
  hasNextEpisode?: boolean;
  onPreviousEpisode?: () => void;
  onNextEpisode?: () => void;
  mediaStats?: MediaStats | null;

  showControls: boolean;
  setShowControls: (show: boolean) => void;
  fadeAnim: SharedValue<number>;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  isGestureSeekingActive: SharedValue<boolean>;
  isVolumeGestureActive: SharedValue<boolean>;
  isBrightnessGestureActive: SharedValue<boolean>;
  hideControlsWithDelay: () => void;
  clearControlsTimeout: () => void;
  onCommentsLoaded?: (comments: DandanComment[]) => void;
};

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer must be used within PlayerContext.Provider');
  }
  return ctx;
}
