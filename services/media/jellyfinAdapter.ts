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
import type { Api } from '@jellyfin/sdk';
import { BaseItemDto, BaseItemKind, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';

import type { MediaAdapter, MediaItem, MediaItemType, MediaServerInfo, MediaSortBy } from './types';

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

export const jellyfinAdapter: MediaAdapter = {
  getApiInstance,
  setGlobalApiInstance,

  async discoverServers({ host }) {
    const jf = getJellyfinInstance();
    return await jf.discovery.getRecommendedServerCandidates(host);
  },

  findBestServer({ servers }) {
    const best = findBestServer(servers);
    return best ?? null;
  },

  createApi({ address }: { address: string }) {
    return createApi(address);
  },
  createApiFromServerInfo({ serverInfo }: { serverInfo: MediaServerInfo }): Api {
    return createApiFromServerInfo(serverInfo);
  },

  async getSystemInfo() {
    const api = getApiInstance();
    const result = await getSystemInfo(api);
    return {
      serverName: result.data?.ServerName,
      version: result.data?.Version,
      operatingSystem: result.data?.OperatingSystem,
    };
  },

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
  },

  async login({ username, password }) {
    const api = getApiInstance();
    return jfLogin(api, username, password);
  },
  authenticateAndSaveServer: (params) =>
    authenticateAndSaveServer(params.address, params.username, params.password, params.addServer),

  async getLatestItems(params) {
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
  },

  async getLatestItemsByFolder({ userId, folderId, limit }) {
    const api = getApiInstance();
    const result = await getLatestItemsByFolder(api, userId, folderId, limit);
    return {
      data: {
        Items: result.data?.map(convertBaseItemDtoToMediaItem),
      },
    };
  },

  async getNextUpItems({ userId, limit }) {
    const api = getApiInstance();
    const result = await getNextUpItems(api, userId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: result.data?.TotalRecordCount,
      },
    };
  },

  async getNextUpItemsByFolder({ userId, folderId, limit }) {
    const api = getApiInstance();
    const result = await getNextUpItemsByFolder(api, userId, folderId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: result.data?.TotalRecordCount,
      },
    };
  },

  async getResumeItems({ userId, limit }) {
    const api = getApiInstance();
    const result = await import('@/services/media/jellyfin').then((m) =>
      m.getResumeItems(api, userId, limit),
    );
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: result.data?.TotalRecordCount,
      },
    };
  },

  async getFavoriteItems({ userId, limit }) {
    const api = getApiInstance();
    const result = await getFavoriteItems(api, userId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  },

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
  },

  async logout() {
    const api = getApiInstance();
    await logout(api);
  },

  async getUserInfo({ userId }) {
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
  },

  async getItemDetail({ itemId, userId }) {
    const api = getApiInstance();
    const result = await getItemDetail(api, itemId, userId);
    return convertBaseItemDtoToMediaItem(result.data!);
  },

  async getItemMediaSources({ itemId }) {
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
  },

  async getUserView({ userId }) {
    const api = getApiInstance();
    const result = await getUserView(api, userId);
    return result.data?.Items?.map(convertBaseItemDtoToMediaItem) || [];
  },

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
  },

  async getSeasonsBySeries({ seriesId, userId }) {
    const api = getApiInstance();
    const result = await getSeasonsBySeries(api, seriesId, userId);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  },

  async getEpisodesBySeason({ seasonId, userId }) {
    const api = getApiInstance();
    const result = await getEpisodesBySeason(api, seasonId, userId);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  },

  async getSimilarShows({ itemId, userId, limit }) {
    const api = getApiInstance();
    const result = await getSimilarShows(api, itemId, userId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  },

  async getSimilarMovies({ itemId, userId, limit }) {
    const api = getApiInstance();
    const result = await getSimilarMovies(api, itemId, userId, limit);
    return {
      data: {
        Items: result.data?.Items?.map(convertBaseItemDtoToMediaItem),
      },
    };
  },

  async searchItems({ userId, searchTerm, limit, includeItemTypes }) {
    const api = getApiInstance();
    const result = await searchItems(
      api,
      userId,
      searchTerm,
      limit,
      includeItemTypes ? convertItemTypesToJellyfin(includeItemTypes) : undefined,
    );
    return result.map(convertBaseItemDtoToMediaItem);
  },

  async getRecommendedSearchKeywords({ userId, limit }) {
    const api = getApiInstance();
    return getRecommendedSearchKeywords(api, userId, limit);
  },
  async getAvailableFilters({ userId, parentId }) {
    const api = getApiInstance();
    const result = await getAvailableFilters(api, userId, parentId);
    return result;
  },
  getImageInfo({ item, opts }) {
    const baseItem = item.raw ?? item;
    return getImageInfo(baseItem as BaseItemDto, opts);
  },
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
  }) {
    const api = getApiInstance();
    return getStreamInfo({
      api,
      item: item?.raw as BaseItemDto,
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
  },

  async addFavoriteItem({ userId, itemId }) {
    const api = getApiInstance();
    await addFavoriteItem(api, userId, itemId);
  },

  async removeFavoriteItem({ userId, itemId }) {
    const api = getApiInstance();
    await removeFavoriteItem(api, userId, itemId);
  },

  async markItemPlayed({ userId, itemId, datePlayed }) {
    const api = getApiInstance();
    await markItemPlayed(api, userId, itemId, datePlayed);
  },

  async markItemUnplayed({ userId, itemId }) {
    const api = getApiInstance();
    await markItemUnplayed(api, userId, itemId);
  },

  async reportPlaybackProgress({ itemId, positionTicks, isPaused }) {
    const api = getApiInstance();
    await reportPlaybackProgress(api, itemId, positionTicks, isPaused);
  },
  async reportPlaybackStart({ itemId, positionTicks }) {
    const api = getApiInstance();
    await reportPlaybackStart(api, itemId, positionTicks);
  },
  async reportPlaybackStop({ itemId, positionTicks }) {
    const api = getApiInstance();
    await reportPlaybackStop(api, itemId, positionTicks);
  },
};
