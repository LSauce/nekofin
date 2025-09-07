import { AvailableFilters } from '@/services/jellyfin';
import { Api, RecommendedServerInfo } from '@jellyfin/sdk';
import { BaseItemDto, BaseItemKind, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';

export type MediaServerType = 'jellyfin' | 'emby';

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
  getApiInstance(): Api | null;
  setGlobalApiInstance(api: Api | null): void;

  discoverServers(host: string): Promise<RecommendedServerInfo[]>;
  findBestServer(servers: RecommendedServerInfo[]): RecommendedServerInfo | null;

  createApi(address: string): Api;
  createApiFromServerInfo(serverInfo: MediaServerInfo): Api;

  getSystemInfo(api: Api): ReturnType<typeof import('@/services/jellyfin').getSystemInfo>;
  getPublicUsers(api: Api): ReturnType<typeof import('@/services/jellyfin').getPublicUsers>;
  login(
    api: Api,
    username: string,
    password: string,
  ): ReturnType<typeof import('@/services/jellyfin').login>;
  authenticateAndSaveServer(
    address: string,
    username: string,
    password: string,
    addServer: (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => Promise<void>,
  ): Promise<unknown>;

  getMediaFolders(api: Api): ReturnType<typeof import('@/services/jellyfin').getMediaFolders>;
  getLatestItems(
    api: Api,
    userId: string,
    limit?: number,
    opts?: {
      includeItemTypes?: BaseItemKind[];
      sortBy?: ItemSortBy[];
      sortOrder?: 'Ascending' | 'Descending';
      year?: number;
      tags?: string[];
    },
  ): ReturnType<typeof import('@/services/jellyfin').getLatestItems>;
  getLatestItemsByFolder(
    api: Api,
    userId: string,
    folderId: string,
    limit?: number,
  ): ReturnType<typeof import('@/services/jellyfin').getLatestItemsByFolder>;
  getNextUpItems(
    api: Api,
    userId: string,
    limit?: number,
  ): ReturnType<typeof import('@/services/jellyfin').getNextUpItems>;
  getNextUpItemsByFolder(
    api: Api,
    userId: string,
    folderId: string,
    limit?: number,
  ): ReturnType<typeof import('@/services/jellyfin').getNextUpItemsByFolder>;
  getResumeItems(
    api: Api,
    userId: string,
    limit?: number,
  ): ReturnType<typeof import('@/services/jellyfin').getResumeItems>;
  getFavoriteItems(
    api: Api,
    userId: string,
    limit?: number,
  ): ReturnType<typeof import('@/services/jellyfin').getFavoriteItems>;
  getFavoriteItemsPaged(
    api: Api,
    userId: string,
    startIndex?: number,
    limit?: number,
    opts?: {
      includeItemTypes?: BaseItemKind[];
      sortBy?: ItemSortBy[];
      sortOrder?: 'Ascending' | 'Descending';
      onlyUnplayed?: boolean;
      year?: number;
      tags?: string[];
    },
  ): ReturnType<typeof import('@/services/jellyfin').getFavoriteItemsPaged>;
  logout(api: Api): ReturnType<typeof import('@/services/jellyfin').logout>;
  getUserInfo(
    api: Api,
    userId: string,
  ): ReturnType<typeof import('@/services/jellyfin').getUserInfo>;
  getItemDetail(
    api: Api,
    itemId: string,
    userId: string,
  ): ReturnType<typeof import('@/services/jellyfin').getItemDetail>;
  getItemMediaSources(
    api: Api,
    itemId: string,
  ): ReturnType<typeof import('@/services/jellyfin').getItemMediaSources>;
  getUserView(
    api: Api,
    userId: string,
  ): ReturnType<typeof import('@/services/jellyfin').getUserView>;
  getAllItemsByFolder(
    api: Api,
    userId: string,
    folderId: string,
    startIndex?: number,
    limit?: number,
    itemTypes?: BaseItemKind[],
    opts?: {
      sortBy?: ItemSortBy[];
      sortOrder?: 'Ascending' | 'Descending';
      onlyUnplayed?: boolean;
      year?: number;
      tags?: string[];
    },
  ): ReturnType<typeof import('@/services/jellyfin').getAllItemsByFolder>;
  getSeasonsBySeries(
    api: Api,
    seriesId: string,
    userId: string,
  ): ReturnType<typeof import('@/services/jellyfin').getSeasonsBySeries>;
  getEpisodesBySeason(
    api: Api,
    seasonId: string,
    userId: string,
  ): ReturnType<typeof import('@/services/jellyfin').getEpisodesBySeason>;
  getSimilarShows(
    api: Api,
    itemId: string,
    userId: string,
    limit?: number,
  ): ReturnType<typeof import('@/services/jellyfin').getSimilarShows>;
  getSimilarMovies(
    api: Api,
    itemId: string,
    userId: string,
    limit?: number,
  ): ReturnType<typeof import('@/services/jellyfin').getSimilarMovies>;
  getSearchHints(
    api: Api,
    searchTerm: string,
    userId?: string,
    limit?: number,
  ): ReturnType<typeof import('@/services/jellyfin').getSearchHints>;
  searchItems(
    api: Api,
    userId: string,
    searchTerm: string,
    limit?: number,
    includeItemTypes?: BaseItemKind[],
  ): Promise<BaseItemDto[]>;
  getRecommendedSearchKeywords(api: Api, userId: string, limit?: number): Promise<string[]>;
  getAvailableFilters(api: Api, userId: string, parentId?: string): Promise<AvailableFilters>;

  addFavoriteItem(
    api: Api,
    userId: string,
    itemId: string,
  ): ReturnType<typeof import('@/services/jellyfin').addFavoriteItem>;
  removeFavoriteItem(
    api: Api,
    userId: string,
    itemId: string,
  ): ReturnType<typeof import('@/services/jellyfin').removeFavoriteItem>;
  markItemPlayed(
    api: Api,
    userId: string,
    itemId: string,
    datePlayed?: string,
  ): ReturnType<typeof import('@/services/jellyfin').markItemPlayed>;
  markItemUnplayed(
    api: Api,
    userId: string,
    itemId: string,
  ): ReturnType<typeof import('@/services/jellyfin').markItemUnplayed>;
  reportPlaybackProgress(
    api: Api,
    itemId: string,
    positionTicks: number,
    isPaused?: boolean,
  ): Promise<void>;
  reportPlaybackStart(api: Api, itemId: string, positionTicks?: number): Promise<void>;
  reportPlaybackStop(api: Api, itemId: string, positionTicks: number): Promise<void>;
}
