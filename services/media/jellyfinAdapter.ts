import { getImageInfo } from '@/lib/utils/image';
import {
  addFavoriteItem,
  authenticateAndSaveServer,
  createApi,
  createApiFromServerInfo,
  findBestServer,
  getAllItemsByFolder,
  getApiInstance,
  getAvailableFilters,
  getEpisodesBySeason,
  getFavoriteItems,
  getFavoriteItemsPaged,
  getItemDetail,
  getItemMediaSources,
  getJellyfinInstance,
  getLatestItems,
  getLatestItemsByFolder,
  getNextUpItems,
  getNextUpItemsByFolder,
  getPublicUsers,
  getRecommendedSearchKeywords,
  getResumeItems,
  getSeasonsBySeries,
  getSimilarMovies,
  getSimilarShows,
  getStreamInfo,
  getSystemInfo,
  getUserInfo,
  getUserView,
  login as jfLogin,
  logout,
  markItemPlayed,
  markItemUnplayed,
  removeFavoriteItem,
  reportPlaybackProgress,
  reportPlaybackStart,
  reportPlaybackStop,
  searchItems,
  setGlobalApiInstance,
} from '@/services/media/jellyfin';
import type { Api, RecommendedServerInfo } from '@jellyfin/sdk';
import { BaseItemDto, BaseItemKind, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models/device-profile';

import {
  MediaAdapter,
  MediaPerson,
  type MediaItem,
  type MediaItemType,
  type MediaServerInfo,
  type MediaSortBy,
} from './types';

function convertBaseItemDtoToMediaItem(item: BaseItemDto): MediaItem {
  return {
    id: item.Id || '',
    name: item.Name || '',
    type: (item.Type as MediaItemType) || 'Other',
    raw: item,
    seriesName: item.SeriesName,
    seriesId: item.SeriesId,
    parentId: item.ParentId,
    indexNumber: item.IndexNumber,
    parentIndexNumber: item.ParentIndexNumber,
    productionYear: item.ProductionYear,
    endDate: item.EndDate,
    status: item.Status as 'Continuing' | 'Ended' | undefined,
    overview: item.Overview,
    communityRating: item.CommunityRating,
    criticRating: item.CriticRating,
    officialRating: item.OfficialRating,
    genres: item.Genres,
    genreItems: item.GenreItems?.map((g) => ({ name: g.Name || '' })),
    people: item.People?.map((p) => ({
      name: p.Name || '',
      id: p.Id || '',
      type: (p.Type as 'Actor' | 'Director' | 'Writer' | 'Producer') || 'Actor',
      role: p.Role,
      primaryImageTag: p.PrimaryImageTag,
      imageBlurHashes: p.ImageBlurHashes,
      raw: p,
    })),
    studios: item.Studios?.map((s) => ({ name: s.Name || '' })),
    userData: item.UserData
      ? {
          played: item.UserData.Played,
          playedPercentage: item.UserData.PlayedPercentage,
          isFavorite: item.UserData.IsFavorite,
          playbackPositionTicks: item.UserData.PlaybackPositionTicks,
        }
      : undefined,
    runTimeTicks: item.RunTimeTicks,
    originalTitle: item.OriginalTitle,
    seasonId: item.SeasonId,
    collectionType: item.CollectionType,
  };
}

function convertSortByToJellyfin(sortBy: MediaSortBy[]): ItemSortBy[] {
  return sortBy.map((sb) => sb as ItemSortBy);
}

function convertItemTypesToJellyfin(itemTypes: MediaItemType[]): BaseItemKind[] {
  return itemTypes.map((it) => it as BaseItemKind);
}

class JellyfinAdapter implements MediaAdapter {
  getApiInstance = getApiInstance;
  setGlobalApiInstance = setGlobalApiInstance;

  async discoverServers({ host }: { host: string }) {
    const jf = getJellyfinInstance();
    return await jf.discovery.getRecommendedServerCandidates(host);
  }

  findBestServer({ servers }: { servers: RecommendedServerInfo[] }) {
    const best = findBestServer(servers);
    return best ?? null;
  }

  createApi({ address }: { address: string }) {
    return createApi(address);
  }
  createApiFromServerInfo({ serverInfo }: { serverInfo: MediaServerInfo }): Api {
    return createApiFromServerInfo(serverInfo);
  }

  async getSystemInfo() {
    const api = getApiInstance();
    const result = await getSystemInfo(api);
    return {
      serverName: result.data?.ServerName,
      version: result.data?.Version,
      operatingSystem: result.data?.OperatingSystem,
    };
  }

  async getPublicUsers() {
    const api = getApiInstance();
    const result = await getPublicUsers(api);
    return (
      result.data?.map((user) => ({
        id: user.Id || '',
        name: user.Name || '',
        serverName: user.ServerName,
        avatar: user.PrimaryImageTag
          ? `${api.basePath}/Users/${user.Id}/Images/Primary?quality=90`
          : undefined,
      })) || []
    );
  }

  login({ username, password }: { username: string; password: string }) {
    const api = getApiInstance();
    return jfLogin(api, username, password);
  }
  authenticateAndSaveServer(params: {
    address: string;
    username: string;
    password: string;
    addServer: (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => Promise<void>;
  }) {
    return authenticateAndSaveServer(
      params.address,
      params.username,
      params.password,
      params.addServer,
    );
  }

  async getLatestItems(params: {
    userId: string;
    limit?: number;
    includeItemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: 'Ascending' | 'Descending';
    year?: number;
    tags?: string[];
  }) {
    const api = getApiInstance();
    const result = await getLatestItems(api, params.userId, params.limit, {
      includeItemTypes: params?.includeItemTypes
        ? convertItemTypesToJellyfin(params.includeItemTypes)
        : undefined,
      sortBy: params?.sortBy ? convertSortByToJellyfin(params.sortBy) : undefined,
      sortOrder: params?.sortOrder,
      year: params?.year,
      tags: params?.tags,
    });
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  }

  async getLatestItemsByFolder({
    userId,
    folderId,
    limit,
  }: {
    userId: string;
    folderId: string;
    limit?: number;
  }) {
    const api = getApiInstance();
    const result = await getLatestItemsByFolder(api, userId, folderId, limit);
    return {
      data: {
        Items: result.data?.map(convertBaseItemDtoToMediaItem),
      },
    };
  }

  async getNextUpItems({ userId, limit }: { userId: string; limit?: number }) {
    const api = getApiInstance();
    const result = await getNextUpItems(api, userId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: result.data?.TotalRecordCount,
      },
    };
  }

  async getNextUpItemsByFolder({
    userId,
    folderId,
    limit,
  }: {
    userId: string;
    folderId: string;
    limit?: number;
  }) {
    const api = getApiInstance();
    const result = await getNextUpItemsByFolder(api, userId, folderId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: result.data?.TotalRecordCount,
      },
    };
  }

  async getResumeItems({ userId, limit }: { userId: string; limit?: number }) {
    const api = getApiInstance();
    const result = await getResumeItems(api, userId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: result.data?.TotalRecordCount,
      },
    };
  }

  async getFavoriteItems({ userId, limit }: { userId: string; limit?: number }) {
    const api = getApiInstance();
    const result = await getFavoriteItems(api, userId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  }

  async getFavoriteItemsPaged({
    userId,
    startIndex,
    limit,
    includeItemTypes,
    sortBy,
    sortOrder,
    onlyUnplayed,
    year,
    tags,
  }: {
    userId: string;
    startIndex?: number;
    limit?: number;
    includeItemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: 'Ascending' | 'Descending';
    onlyUnplayed?: boolean;
    year?: number;
    tags?: string[];
  }) {
    const api = getApiInstance();
    const result = await getFavoriteItemsPaged(api, userId, startIndex, limit, {
      includeItemTypes: includeItemTypes ? convertItemTypesToJellyfin(includeItemTypes) : undefined,
      sortBy: sortBy ? convertSortByToJellyfin(sortBy) : undefined,
      sortOrder,
      onlyUnplayed,
      year,
      tags,
    });
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: result.data?.TotalRecordCount,
      },
    };
  }

  async logout() {
    const api = getApiInstance();
    await logout(api);
  }

  async getUserInfo({ userId }: { userId: string }) {
    const api = getApiInstance();
    const result = await getUserInfo(api, userId);
    return {
      id: result.data?.Id || '',
      name: result.data?.Name || '',
      serverName: result.data?.ServerName,
      avatar: result.data?.PrimaryImageTag
        ? `${api.basePath}/Users/${userId}/Images/Primary?quality=90`
        : undefined,
    };
  }

  async getItemDetail({ itemId, userId }: { itemId: string; userId: string }) {
    const api = getApiInstance();
    const result = await getItemDetail(api, itemId, userId);
    return convertBaseItemDtoToMediaItem(result.data!);
  }

  async getItemMediaSources({ itemId }: { itemId: string }) {
    const api = getApiInstance();
    const result = await getItemMediaSources(api, itemId);
    return {
      mediaSources:
        result.data?.MediaSources?.map((source) => ({
          id: source.Id || '',
          protocol: source.Protocol || '',
          container: source.Container || '',
          size: source.Size,
          bitrate: source.Bitrate,
          mediaStreams:
            source.MediaStreams?.map((stream) => ({
              codec: stream.Codec || '',
              type: (stream.Type as 'Video' | 'Audio' | 'Subtitle') || 'Video',
              index: stream.Index || 0,
              language: stream.Language,
              isDefault: stream.IsDefault,
              isForced: stream.IsForced,
              width: stream.Width,
              height: stream.Height,
              bitRate: stream.BitRate,
            })) || [],
        })) || [],
    };
  }

  async getUserView({ userId }: { userId: string }) {
    const api = getApiInstance();
    const result = await getUserView(api, userId);
    return result.data?.Items?.map(convertBaseItemDtoToMediaItem) || [];
  }

  async getAllItemsByFolder({
    userId,
    folderId,
    startIndex,
    limit,
    itemTypes,
    sortBy,
    sortOrder,
    onlyUnplayed,
    year,
    tags,
  }: {
    userId: string;
    folderId: string;
    startIndex?: number;
    limit?: number;
    itemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: 'Ascending' | 'Descending';
    onlyUnplayed?: boolean;
    year?: number;
    tags?: string[];
  }) {
    const api = getApiInstance();
    const result = await getAllItemsByFolder(
      api,
      userId,
      folderId,
      startIndex,
      limit,
      itemTypes ? convertItemTypesToJellyfin(itemTypes) : undefined,
      {
        sortBy: sortBy ? convertSortByToJellyfin(sortBy) : undefined,
        sortOrder,
        onlyUnplayed,
        year,
        tags,
      },
    );
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: result.data?.TotalRecordCount,
      },
    };
  }

  async getSeasonsBySeries({ seriesId, userId }: { seriesId: string; userId: string }) {
    const api = getApiInstance();
    const result = await getSeasonsBySeries(api, seriesId, userId);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  }

  async getEpisodesBySeason({ seasonId, userId }: { seasonId: string; userId: string }) {
    const api = getApiInstance();
    const result = await getEpisodesBySeason(api, seasonId, userId);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  }

  async getSimilarShows({
    itemId,
    userId,
    limit,
  }: {
    itemId: string;
    userId: string;
    limit?: number;
  }) {
    const api = getApiInstance();
    const result = await getSimilarShows(api, itemId, userId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  }

  async getSimilarMovies({
    itemId,
    userId,
    limit,
  }: {
    itemId: string;
    userId: string;
    limit?: number;
  }) {
    const api = getApiInstance();
    const result = await getSimilarMovies(api, itemId, userId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  }

  async searchItems({
    userId,
    searchTerm,
    limit,
    includeItemTypes,
  }: {
    userId: string;
    searchTerm: string;
    limit?: number;
    includeItemTypes?: MediaItemType[];
  }) {
    const api = getApiInstance();
    const result = await searchItems(
      api,
      userId,
      searchTerm,
      limit,
      includeItemTypes ? convertItemTypesToJellyfin(includeItemTypes) : undefined,
    );
    return result.map(convertBaseItemDtoToMediaItem);
  }

  async getRecommendedSearchKeywords({ userId, limit }: { userId: string; limit?: number }) {
    const api = getApiInstance();
    return getRecommendedSearchKeywords(api, userId, limit);
  }
  async getAvailableFilters({ userId, parentId }: { userId: string; parentId?: string }) {
    const api = getApiInstance();
    const result = await getAvailableFilters(api, userId, parentId);
    return result;
  }
  getImageInfo({
    item,
    opts,
  }: {
    item: MediaItem | MediaPerson;
    opts?: {
      width?: number;
      height?: number;
      preferBackdrop?: boolean;
      preferLogo?: boolean;
      preferThumb?: boolean;
      preferBanner?: boolean;
    };
  }) {
    const baseItem = (item as MediaItem).raw ?? item;
    return getImageInfo(baseItem as BaseItemDto, opts);
  }
  async getStreamInfo({
    item,
    userId,
    startTimeTicks,
    maxStreamingBitrate,
    playSessionId,
    deviceProfile,
    audioStreamIndex,
    subtitleStreamIndex,
    height,
    mediaSourceId,
    deviceId,
  }: {
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
  }) {
    const api = getApiInstance();
    return getStreamInfo({
      api,
      item: (item as MediaItem | null | undefined)?.raw as BaseItemDto,
      userId,
      startTimeTicks,
      maxStreamingBitrate,
      playSessionId,
      deviceProfile,
      audioStreamIndex,
      subtitleStreamIndex,
      height,
      mediaSourceId,
      deviceId,
    });
  }

  async addFavoriteItem({ userId, itemId }: { userId: string; itemId: string }) {
    const api = getApiInstance();
    await addFavoriteItem(api, userId, itemId);
  }

  async removeFavoriteItem({ userId, itemId }: { userId: string; itemId: string }) {
    const api = getApiInstance();
    await removeFavoriteItem(api, userId, itemId);
  }

  async markItemPlayed({
    userId,
    itemId,
    datePlayed,
  }: {
    userId: string;
    itemId: string;
    datePlayed?: string;
  }) {
    const api = getApiInstance();
    await markItemPlayed(api, userId, itemId, datePlayed);
  }

  async markItemUnplayed({ userId, itemId }: { userId: string; itemId: string }) {
    const api = getApiInstance();
    await markItemUnplayed(api, userId, itemId);
  }

  async reportPlaybackProgress({
    itemId,
    positionTicks,
    isPaused,
  }: {
    itemId: string;
    positionTicks: number;
    isPaused?: boolean;
  }) {
    const api = getApiInstance();
    await reportPlaybackProgress(api, itemId, positionTicks, isPaused ?? false);
  }
  async reportPlaybackStart({ itemId, positionTicks }: { itemId: string; positionTicks?: number }) {
    const api = getApiInstance();
    await reportPlaybackStart(api, itemId, positionTicks ?? 0);
  }
  async reportPlaybackStop({ itemId, positionTicks }: { itemId: string; positionTicks: number }) {
    const api = getApiInstance();
    await reportPlaybackStop(api, itemId, positionTicks);
  }
}

export const jellyfinAdapter = new JellyfinAdapter();
