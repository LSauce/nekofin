import { ImageUrlInfo } from '@/lib/utils/image';
import { RecommendedServerInfo } from '@jellyfin/sdk';
import { BaseItemPersonImageBlurHashes } from '@jellyfin/sdk/lib/generated-client/models/base-item-person-image-blur-hashes';

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

export interface MediaAdapter {
  getApiInstance(): unknown | null;
  setGlobalApiInstance(api: unknown | null): void;

  discoverServers(params: { host: string }): Promise<RecommendedServerInfo[]>;
  findBestServer(params: { servers: RecommendedServerInfo[] }): RecommendedServerInfo | null;

  createApi(params: { address: string }): unknown;
  createApiFromServerInfo(params: { serverInfo: MediaServerInfo }): unknown;

  getSystemInfo(): Promise<MediaSystemInfo>;
  getPublicUsers(): Promise<MediaUser[]>;
  login(params: { username: string; password: string }): Promise<unknown>;
  authenticateAndSaveServer(params: {
    address: string;
    username: string;
    password: string;
    addServer: (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => Promise<void>;
  }): Promise<unknown>;

  getLatestItems(params: {
    userId: string;
    limit?: number;
    includeItemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: MediaSortOrder;
    year?: number;
    tags?: string[];
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }>;
  getLatestItemsByFolder(params: { userId: string; folderId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  getNextUpItems(params: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  getNextUpItemsByFolder(params: { userId: string; folderId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  getResumeItems(params: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  getFavoriteItems(params: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }>;
  getFavoriteItemsPaged(params: {
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
  logout(): Promise<void>;
  getUserInfo(params: { userId: string }): Promise<MediaUser>;
  getItemDetail(params: { itemId: string; userId: string }): Promise<MediaItem>;
  getItemMediaSources(params: { itemId: string }): Promise<MediaPlaybackInfo>;
  getUserView(params: { userId: string }): Promise<MediaItem[]>;
  getAllItemsByFolder(params: {
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
  getSeasonsBySeries(params: { seriesId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }>;
  getEpisodesBySeason(params: { seasonId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }>;
  getSimilarShows(params: { itemId: string; userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[] };
  }>;
  getSimilarMovies(params: { itemId: string; userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[] };
  }>;
  searchItems(params: {
    userId: string;
    searchTerm: string;
    limit?: number;
    includeItemTypes?: MediaItemType[];
  }): Promise<MediaItem[]>;
  getRecommendedSearchKeywords(params: { userId: string; limit?: number }): Promise<string[]>;
  getAvailableFilters(params: { userId: string; parentId?: string }): Promise<MediaFilters>;

  addFavoriteItem(params: { userId: string; itemId: string }): Promise<void>;
  removeFavoriteItem(params: { userId: string; itemId: string }): Promise<void>;
  markItemPlayed(params: { userId: string; itemId: string; datePlayed?: string }): Promise<void>;
  markItemUnplayed(params: { userId: string; itemId: string }): Promise<void>;
  reportPlaybackProgress(params: {
    itemId: string;
    positionTicks: number;
    isPaused?: boolean;
  }): Promise<void>;
  reportPlaybackStart(params: { itemId: string; positionTicks?: number }): Promise<void>;
  reportPlaybackStop(params: { itemId: string; positionTicks: number }): Promise<void>;

  getImageInfo(params: {
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
}
