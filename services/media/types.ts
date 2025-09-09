import { ImageUrlInfo } from '@/lib/utils/image';
import { RecommendedServerInfo } from '@jellyfin/sdk';
import { BaseItemPersonImageBlurHashes } from '@jellyfin/sdk/lib/generated-client/models/base-item-person-image-blur-hashes';

import { StreamInfo } from './jellyfin';

export type MediaApi = {
  basePath: string;
  accessToken: string | null;
};

export type MediaServerType = 'jellyfin' | 'emby';

export type MediaItemType = 'Movie' | 'Series' | 'Season' | 'Episode' | 'MusicVideo' | 'Other';

export type MediaSortBy =
  | 'DateCreated'
  | 'SortName'
  | 'IndexNumber'
  | 'IsFavoriteOrLiked'
  | 'Random'
  | 'CommunityRating'
  | 'DatePlayed'
  | 'OfficialRating'
  | 'PremiereDate';
export type MediaSortOrder = 'Ascending' | 'Descending';

export interface MediaUserData {
  played?: boolean | null;
  playedPercentage?: number | null;
  isFavorite?: boolean | null;
  playbackPositionTicks?: number | null;
}

export interface MediaPerson {
  name?: string | null;
  id: string;
  type?: 'Actor' | 'Director' | 'Writer' | 'Producer';
  role?: string | null;
  primaryImageTag?: string | null;
  imageBlurHashes?: BaseItemPersonImageBlurHashes | null;
  raw: unknown;
}

export interface MediaGenre {
  name: string;
}

export interface MediaStudio {
  name: string;
}

export interface MediaItem {
  id: string;
  name: string;
  type: MediaItemType;
  raw: unknown;
  seriesName?: string | null;
  seriesId?: string | null;
  parentId?: string | null;
  indexNumber?: number | null;
  parentIndexNumber?: number | null;
  productionYear?: number | null;
  endDate?: string | null;
  status?: 'Continuing' | 'Ended';
  overview?: string | null;
  communityRating?: number | null;
  criticRating?: number | null;
  officialRating?: string | null;
  genres?: string[] | null;
  genreItems?: MediaGenre[] | null;
  people?: MediaPerson[] | null;
  studios?: MediaStudio[] | null;
  userData?: MediaUserData | null;
  runTimeTicks?: number | null;
  originalTitle?: string | null;
  seasonId?: string | null;
  collectionType?: string;
}

export interface MediaUser {
  id: string;
  name: string;
  serverName?: string | null;
  avatar?: string | null;
}

export interface MediaSystemInfo {
  serverName?: string | null;
  version?: string | null;
  operatingSystem?: string | null;
}

export interface MediaPlaybackInfo {
  mediaSources: MediaSource[];
}

export interface MediaSource {
  id: string;
  protocol: string;
  container: string;
  size?: number | null;
  bitrate?: number | null;
  mediaStreams: MediaStream[];
}

export interface MediaStream {
  codec: string;
  type: 'Video' | 'Audio' | 'Subtitle';
  index: number;
  language?: string | null;
  isDefault?: boolean | null;
  isForced?: boolean | null;
  width?: number | null;
  height?: number | null;
  bitRate?: number | null;
}

export interface MediaStreamInfo {
  url: string | null;
  sessionId: string | null;
  mediaSource: MediaSource | undefined;
}

export interface MediaFilters {
  years: number[];
  tags: string[];
  genres: string[];
}

export interface MediaServerInfo {
  id: string;
  address: string;
  name: string;
  userId: string;
  username: string;
  userAvatar: string;
  accessToken: string;
  createdAt: number;
  type: MediaServerType;
}

export abstract class MediaAdapter {
  abstract getApiInstance(): MediaApi | null;
  abstract setGlobalApiInstance(api: MediaApi | null): void;

  abstract discoverServers(params: { host: string }): Promise<RecommendedServerInfo[]>;
  abstract findBestServer(params: {
    servers: RecommendedServerInfo[];
  }): RecommendedServerInfo | null;

  abstract createApi(params: { address: string }): MediaApi;
  abstract createApiFromServerInfo(params: { serverInfo: MediaServerInfo }): MediaApi;

  abstract getSystemInfo(): Promise<MediaSystemInfo>;
  abstract getPublicUsers(): Promise<MediaUser[]>;
  abstract login(params: { username: string; password: string }): Promise<unknown>;
  abstract authenticateAndSaveServer(params: {
    address: string;
    username: string;
    password: string;
    addServer: (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => Promise<void>;
  }): Promise<unknown>;

  abstract getLatestItems(params: {
    userId: string;
    limit?: number;
    includeItemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: MediaSortOrder;
    year?: number;
    tags?: string[];
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }>;
  abstract getLatestItemsByFolder(params: {
    userId: string;
    folderId: string;
    limit?: number;
  }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  abstract getNextUpItems(params: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  abstract getNextUpItemsByFolder(params: {
    userId: string;
    folderId: string;
    limit?: number;
  }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  abstract getResumeItems(params: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  abstract getFavoriteItems(params: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  abstract getFavoriteItemsPaged(params: {
    userId: string;
    startIndex?: number;
    limit?: number;
    includeItemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: MediaSortOrder;
    onlyUnplayed?: boolean;
    year?: number;
    tags?: string[];
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }>;
  abstract logout(): Promise<void>;
  abstract getUserInfo(params: { userId: string }): Promise<MediaUser>;
  abstract getItemDetail(params: { itemId: string; userId: string }): Promise<MediaItem>;
  abstract getItemMediaSources(params: { itemId: string }): Promise<MediaPlaybackInfo>;
  abstract getUserView(params: { userId: string }): Promise<MediaItem[]>;
  abstract getAllItemsByFolder(params: {
    userId: string;
    folderId: string;
    startIndex?: number;
    limit?: number;
    itemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: MediaSortOrder;
    onlyUnplayed?: boolean;
    year?: number;
    tags?: string[];
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }>;
  abstract getSeasonsBySeries(params: { seriesId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }>;
  abstract getEpisodesBySeason(params: { seasonId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }>;
  abstract getSimilarShows(params: { itemId: string; userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[] };
  }>;
  abstract getSimilarMovies(params: { itemId: string; userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[] };
  }>;
  abstract searchItems(params: {
    userId: string;
    searchTerm: string;
    limit?: number;
    includeItemTypes?: MediaItemType[];
  }): Promise<MediaItem[]>;
  abstract getRecommendedSearchKeywords(params: {
    userId: string;
    limit?: number;
  }): Promise<string[]>;
  abstract getAvailableFilters(params: {
    userId: string;
    parentId?: string;
  }): Promise<MediaFilters>;
  abstract getImageInfo(params: {
    item: MediaItem | MediaPerson;
    opts?: {
      width?: number;
      height?: number;
      preferBackdrop?: boolean;
      preferLogo?: boolean;
      preferThumb?: boolean;
      preferBanner?: boolean;
    };
  }): ImageUrlInfo;
  abstract getStreamInfo(params: {
    item: MediaItem | null | undefined;
    userId: string | null | undefined;
    startTimeTicks: number;
    maxStreamingBitrate?: number;
    playSessionId?: string | null;
    deviceProfile: any;
    audioStreamIndex?: number;
    subtitleStreamIndex?: number;
    height?: number;
    mediaSourceId?: string | null;
    deviceId?: string | null;
  }): Promise<StreamInfo | null>;

  abstract addFavoriteItem(params: { userId: string; itemId: string }): Promise<void>;
  abstract removeFavoriteItem(params: { userId: string; itemId: string }): Promise<void>;
  abstract markItemPlayed(params: {
    userId: string;
    itemId: string;
    datePlayed?: string;
  }): Promise<void>;
  abstract markItemUnplayed(params: { userId: string; itemId: string }): Promise<void>;
  abstract reportPlaybackProgress(params: {
    itemId: string;
    positionTicks: number;
    isPaused?: boolean;
  }): Promise<void>;
  abstract reportPlaybackStart(params: { itemId: string; positionTicks?: number }): Promise<void>;
  abstract reportPlaybackStop(params: { itemId: string; positionTicks: number }): Promise<void>;
}
