import { ViewStyle } from 'react-native';

export type PlaybackStatePayload = {
  nativeEvent: {
    target: number;
    state: 'Opening' | 'Buffering' | 'Playing' | 'Paused' | 'Error';
    currentTime: number;
    duration: number;
    isBuffering: boolean;
    isPlaying: boolean;
  };
};

export type ProgressUpdatePayload = {
  nativeEvent: {
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    isBuffering: boolean;
  };
};

export type VideoLoadStartPayload = {
  nativeEvent: {
    target: number;
  };
};

export type PipStartedPayload = {
  nativeEvent: {
    pipStarted: boolean;
  };
};

export type VideoStateChangePayload = PlaybackStatePayload;

export type VideoProgressPayload = ProgressUpdatePayload;

export type MediaStats = {
  readBytes: number;
  inputBitrate: number;
  demuxReadBytes: number;
  demuxBitrate: number;
  demuxCorrupted: number;
  demuxDiscontinuity: number;
  decodedVideo: number;
  decodedAudio: number;
  displayedPictures: number;
  lostPictures: number;
  playedAudioBuffers: number;
  lostAudioBuffers: number;
  sentPackets: number;
  sentBytes: number;
  sendBitrate: number;
};

export type MediaStatsPayload = {
  nativeEvent: {
    target: number;
    stats: MediaStats;
  };
};

export type VlcPlayerSource = {
  uri: string;
  type?: string;
  isNetwork?: boolean;
  autoplay?: boolean;
  startPosition?: number;
  externalSubtitles?: { name: string; DeliveryUrl: string }[];
  initOptions?: any[];
  mediaOptions?: { [key: string]: any };
};

export type TrackInfo = {
  name: string;
  index: number;
  language?: string;
};

export type MediaTrack = {
  audio?: TrackInfo;
  subtitle?: TrackInfo;
};

export type MediaTracks = {
  audio?: TrackInfo[];
  subtitle?: TrackInfo[];
};

export type ChapterInfo = {
  name: string;
  timeOffset: number;
  duration: number;
};

export type VlcPlayerViewProps = {
  source: VlcPlayerSource;
  style?: ViewStyle | ViewStyle[];
  paused?: boolean;
  muted?: boolean;
  volume?: number;
  videoAspectRatio?: string;
  onVideoProgress?: (event: ProgressUpdatePayload) => void;
  onVideoStateChange?: (event: PlaybackStatePayload) => void;
  onVideoLoadStart?: (event: VideoLoadStartPayload) => void;
  onVideoLoadEnd?: (event: VideoLoadStartPayload) => void;
  onVideoError?: (event: PlaybackStatePayload) => void;
  onPipStarted?: (event: PipStartedPayload) => void;
  onMediaStatsChange?: (event: MediaStatsPayload) => void;
};

export interface VlcPlayerViewRef {
  startPictureInPicture: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (time: number) => Promise<void>;
  setAudioTrack: (trackIndex: number) => Promise<void>;
  getAudioTracks: () => Promise<TrackInfo[] | null>;
  setSubtitleTrack: (trackIndex: number) => Promise<void>;
  getSubtitleTracks: () => Promise<TrackInfo[] | null>;
  setSubtitleDelay: (delay: number) => Promise<void>;
  setAudioDelay: (delay: number) => Promise<void>;
  takeSnapshot: (path: string, width: number, height: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
  nextChapter: () => Promise<void>;
  previousChapter: () => Promise<void>;
  getChapters: () => Promise<ChapterInfo[] | null>;
  setVideoCropGeometry: (cropGeometry: string | null) => Promise<void>;
  getVideoCropGeometry: () => Promise<string | null>;
  setSubtitleURL: (url: string) => Promise<void>;
  setVideoAspectRatio: (aspectRatio: string | null) => Promise<void>;
  setVideoScaleFactor: (scaleFactor: number) => Promise<void>;
}
