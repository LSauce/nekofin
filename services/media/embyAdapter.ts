import type { ImageUrlInfo } from '@/lib/utils/image';
import type { Api, RecommendedServerInfo } from '@jellyfin/sdk';
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models/device-profile';

import {
  MediaAdapter,
  type MediaFilters,
  type MediaItem,
  type MediaItemType,
  type MediaPlaybackInfo,
  type MediaServerInfo,
  type MediaSortBy,
  type MediaSortOrder,
  type MediaSystemInfo,
  type MediaUser,
} from './types';

class EmbyAdapter implements MediaAdapter {
  getApiInstance(): unknown | null {
    return null;
  }
  setGlobalApiInstance(_: unknown | null): void {}

  async discoverServers(_: { host: string }): Promise<RecommendedServerInfo[]> {
    return [] as RecommendedServerInfo[];
  }
  findBestServer(_: { servers: RecommendedServerInfo[] }): RecommendedServerInfo | null {
    return null;
  }

  createApi(_: { address: string }): Api {
    throw new Error('Emby adapter not implemented');
  }
  createApiFromServerInfo(_: { serverInfo: MediaServerInfo }): Api {
    throw new Error('Emby adapter not implemented');
  }

  async getSystemInfo(): Promise<MediaSystemInfo> {
    throw new Error('Emby adapter not implemented');
  }
  async getPublicUsers(): Promise<MediaUser[]> {
    throw new Error('Emby adapter not implemented');
  }
  async login(_: { username: string; password: string }): Promise<unknown> {
    throw new Error('Emby adapter not implemented');
  }
  async authenticateAndSaveServer(_: {
    address: string;
    username: string;
    password: string;
    addServer: (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => Promise<void>;
  }): Promise<unknown> {
    throw new Error('Emby adapter not implemented');
  }

  async getLatestItems(_: {
    userId: string;
    limit?: number;
    includeItemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: MediaSortOrder;
    year?: number;
    tags?: string[];
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }> {
    throw new Error('Emby adapter not implemented');
  }
  async getLatestItemsByFolder(_: { userId: string; folderId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    throw new Error('Emby adapter not implemented');
  }
  async getNextUpItems(_: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    throw new Error('Emby adapter not implemented');
  }
  async getNextUpItemsByFolder(_: { userId: string; folderId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    throw new Error('Emby adapter not implemented');
  }
  async getResumeItems(_: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    throw new Error('Emby adapter not implemented');
  }
  async getFavoriteItems(_: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    throw new Error('Emby adapter not implemented');
  }
  async getFavoriteItemsPaged(_: {
    userId: string;
    startIndex?: number;
    limit?: number;
    includeItemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: MediaSortOrder;
    onlyUnplayed?: boolean;
    year?: number;
    tags?: string[];
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }> {
    throw new Error('Emby adapter not implemented');
  }
  async logout(): Promise<void> {
    throw new Error('Emby adapter not implemented');
  }
  async getUserInfo(_: { userId: string }): Promise<MediaUser> {
    throw new Error('Emby adapter not implemented');
  }
  async getItemDetail(_: { itemId: string; userId: string }): Promise<MediaItem> {
    throw new Error('Emby adapter not implemented');
  }
  async getItemMediaSources(_: { itemId: string }): Promise<MediaPlaybackInfo> {
    throw new Error('Emby adapter not implemented');
  }
  async getUserView(_: { userId: string }): Promise<MediaItem[]> {
    throw new Error('Emby adapter not implemented');
  }
  async getAllItemsByFolder(_: {
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
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }> {
    throw new Error('Emby adapter not implemented');
  }
  async getSeasonsBySeries(_: { seriesId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }> {
    throw new Error('Emby adapter not implemented');
  }
  async getEpisodesBySeason(_: { seasonId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }> {
    throw new Error('Emby adapter not implemented');
  }
  async getSimilarShows(_: { itemId: string; userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[] };
  }> {
    throw new Error('Emby adapter not implemented');
  }
  async getSimilarMovies(_: { itemId: string; userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[] };
  }> {
    throw new Error('Emby adapter not implemented');
  }
  async searchItems(_: {
    userId: string;
    searchTerm: string;
    limit?: number;
    includeItemTypes?: MediaItemType[];
  }): Promise<MediaItem[]> {
    throw new Error('Emby adapter not implemented');
  }
  async getRecommendedSearchKeywords(_: { userId: string; limit?: number }): Promise<string[]> {
    throw new Error('Emby adapter not implemented');
  }
  async getAvailableFilters(_: { userId: string; parentId?: string }): Promise<MediaFilters> {
    throw new Error('Emby adapter not implemented');
  }
  getImageInfo(_: {
    item: MediaItem | import('./types').MediaPerson;
    opts?: {
      width?: number;
      height?: number;
      preferBackdrop?: boolean;
      preferLogo?: boolean;
      preferThumb?: boolean;
      preferBanner?: boolean;
    };
  }): ImageUrlInfo {
    throw new Error('Emby adapter not implemented');
  }
  getStreamInfo(_: {
    item: MediaItem | null | undefined;
    userId: string | null | undefined;
    startTimeTicks: number;
    maxStreamingBitrate?: number;
    playSessionId?: string | null;
    deviceProfile: DeviceProfile;
    audioStreamIndex?: number;
    subtitleStreamIndex?: number;
    height?: number;
    mediaSourceId?: string | null;
    deviceId?: string | null;
  }): Promise<import('./jellyfin').StreamInfo | null> {
    throw new Error('Emby adapter not implemented');
  }

  async addFavoriteItem(_: { userId: string; itemId: string }): Promise<void> {
    throw new Error('Emby adapter not implemented');
  }
  async removeFavoriteItem(_: { userId: string; itemId: string }): Promise<void> {
    throw new Error('Emby adapter not implemented');
  }
  async markItemPlayed(_: { userId: string; itemId: string; datePlayed?: string }): Promise<void> {
    throw new Error('Emby adapter not implemented');
  }
  async markItemUnplayed(_: { userId: string; itemId: string }): Promise<void> {
    throw new Error('Emby adapter not implemented');
  }
  async reportPlaybackProgress(_: {
    itemId: string;
    positionTicks: number;
    isPaused?: boolean;
  }): Promise<void> {
    throw new Error('Emby adapter not implemented');
  }
  async reportPlaybackStart(_: { itemId: string; positionTicks?: number }): Promise<void> {
    throw new Error('Emby adapter not implemented');
  }
  async reportPlaybackStop(_: { itemId: string; positionTicks: number }): Promise<void> {
    throw new Error('Emby adapter not implemented');
  }
}

export const embyAdapter = new EmbyAdapter();
