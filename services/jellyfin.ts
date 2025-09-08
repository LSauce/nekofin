import { getDeviceId } from '@/lib/utils';
import { Api, Jellyfin, RecommendedServerInfo } from '@jellyfin/sdk';
import { BaseItemDto, BaseItemKind, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
import {
  getFilterApi,
  getItemsApi,
  getLibraryApi,
  getMediaInfoApi,
  getPlaystateApi,
  getSearchApi,
  getSystemApi,
  getTvShowsApi,
  getUserApi,
  getUserLibraryApi,
  getUserViewsApi,
} from '@jellyfin/sdk/lib/utils/api';

import { MediaServerInfo } from './media/types';

let jellyfin: Jellyfin | null = null;
let apiInstance: Api | null = null;

export function getJellyfinInstance() {
  if (!jellyfin) {
    jellyfin = new Jellyfin({
      clientInfo: {
        name: 'Nekofin',
        version: '1.0.0',
      },
      deviceInfo: {
        name: 'Nekofin Device',
        id: getDeviceId(),
      },
    });
  }
  return jellyfin;
}

export function getApiInstance() {
  if (!apiInstance) {
    throw new Error('API instance not set');
  }
  return apiInstance;
}

export function setGlobalApiInstance(api: Api | null) {
  apiInstance = api;
}

export async function discoverServers(host: string) {
  const jellyfin = getJellyfinInstance();
  return await jellyfin.discovery.getRecommendedServerCandidates(host);
}

export function findBestServer(servers: RecommendedServerInfo[]) {
  const jellyfin = getJellyfinInstance();
  return jellyfin.discovery.findBestServer(servers);
}

export function createApi(address: string) {
  const jellyfin = getJellyfinInstance();
  const api = jellyfin.createApi(address);
  return api;
}

export async function getSystemInfo(api: Api) {
  return await getSystemApi(api).getPublicSystemInfo();
}

export async function getPublicUsers(api: Api) {
  return await getUserApi(api).getPublicUsers();
}

export async function login(api: Api, username: string, password: string) {
  console.log('login', username, password, api.basePath);
  return await api.authenticateUserByName(username, password);
}

export async function getLatestItems(
  api: Api,
  userId: string,
  limit: number = 100,
  opts?: {
    includeItemTypes?: BaseItemKind[];
    sortBy?: ItemSortBy[];
    sortOrder?: 'Ascending' | 'Descending';
    year?: number;
    tags?: string[];
  },
) {
  return await getItemsApi(api).getItems({
    userId,
    limit,
    sortBy: opts?.sortBy ?? ['DateCreated'],
    sortOrder: [opts?.sortOrder ?? 'Descending'],
    includeItemTypes: opts?.includeItemTypes ?? ['Movie', 'Series', 'Episode'],
    recursive: true,
    filters: ['IsNotFolder'],
    years: opts?.year ? [opts.year] : undefined,
    tags: opts?.tags,
  });
}

export async function getLatestItemsByFolder(
  api: Api,
  userId: string,
  folderId: string,
  limit: number = 100,
) {
  return await getUserLibraryApi(api).getLatestMedia({
    userId,
    limit,
    fields: ['PrimaryImageAspectRatio', 'Path'],
    imageTypeLimit: 1,
    enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
    parentId: folderId,
  });
}

export async function getNextUpItems(api: Api, userId: string, limit: number = 100) {
  return await getTvShowsApi(api).getNextUp({
    userId,
    limit,
    fields: ['PrimaryImageAspectRatio', 'DateCreated', 'MediaSourceCount'],
    imageTypeLimit: 1,
    enableImageTypes: ['Primary', 'Backdrop', 'Banner', 'Thumb'],
  });
}

export async function getNextUpItemsByFolder(
  api: Api,
  userId: string,
  folderId: string,
  limit: number = 100,
) {
  return await getTvShowsApi(api).getNextUp({
    userId,
    limit,
    parentId: folderId,
  });
}

export async function getResumeItems(api: Api, userId: string, limit: number = 100) {
  return await getItemsApi(api).getResumeItems({
    userId,
    limit,
    fields: ['PrimaryImageAspectRatio'],
    imageTypeLimit: 1,
    enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
    mediaTypes: ['Video'],
    enableTotalRecordCount: false,
  });
}

export async function getFavoriteItems(api: Api, userId: string, limit: number = 200) {
  return await getItemsApi(api).getItems({
    userId,
    limit,
    sortBy: ['DateCreated'],
    sortOrder: ['Descending'],
    fields: ['PrimaryImageAspectRatio', 'Path'],
    imageTypeLimit: 1,
    enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
    filters: ['IsFavorite'],
    recursive: true,
    includeItemTypes: ['Movie', 'Series', 'Episode'],
  });
}

export async function getFavoriteItemsPaged(
  api: Api,
  userId: string,
  startIndex: number = 0,
  limit: number = 40,
  opts?: {
    includeItemTypes?: BaseItemKind[];
    sortBy?: ItemSortBy[];
    sortOrder?: 'Ascending' | 'Descending';
    onlyUnplayed?: boolean;
    year?: number;
    tags?: string[];
  },
) {
  const filters: ('IsFavorite' | 'IsPlayed' | 'IsUnplayed')[] = ['IsFavorite'];
  if (opts?.onlyUnplayed) filters.push('IsUnplayed');
  return await getItemsApi(api).getItems({
    userId,
    startIndex,
    limit,
    sortBy: opts?.sortBy ?? ['DateCreated'],
    sortOrder: [opts?.sortOrder ?? 'Descending'],
    fields: ['PrimaryImageAspectRatio', 'Path'],
    imageTypeLimit: 1,
    enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
    filters,
    recursive: true,
    includeItemTypes: opts?.includeItemTypes ?? ['Movie', 'Series', 'Episode'],
    years: opts?.year ? [opts.year] : undefined,
    tags: opts?.tags,
  });
}

export async function logout(api: Api) {
  return await api.logout();
}

export async function getUserInfo(api: Api, userId: string) {
  return await getUserApi(api).getUserById({ userId });
}

export function createApiFromServerInfo(serverInfo: MediaServerInfo) {
  const jellyfin = getJellyfinInstance();
  const api = jellyfin.createApi(serverInfo.address);
  api.accessToken = serverInfo.accessToken;
  return api;
}

export async function authenticateAndSaveServer(
  address: string,
  username: string,
  password: string,
  addServer: (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => Promise<void>,
) {
  const api = createApi(address);
  const authResult = await login(api, username, password);

  if (authResult.data?.User?.Id && authResult.data?.AccessToken) {
    const normalizedAddress = address.replace(/\/$/, '');
    const serverInfo: Omit<MediaServerInfo, 'id' | 'createdAt'> = {
      address: normalizedAddress,
      name: authResult.data.User.ServerName || normalizedAddress,
      userId: authResult.data.User.Id,
      username: authResult.data.User.Name || username,
      userAvatar: `${normalizedAddress}/Users/${authResult.data.User.Id}/Images/Primary?quality=90`,
      accessToken: authResult.data.AccessToken,
      type: 'jellyfin',
    };

    await addServer(serverInfo);
    return authResult;
  }

  throw new Error('Authentication failed');
}

export async function getItemDetail(api: Api, itemId: string, userId: string) {
  return await getUserLibraryApi(api).getItem({
    itemId,
    userId,
  });
}

export async function getItemMediaSources(api: Api, itemId: string) {
  return await getMediaInfoApi(api).getPlaybackInfo(
    {
      itemId,
    },
    {
      method: 'POST',
      data: {
        isPlayback: true,
        autoOpenLiveStream: true,
      },
    },
  );
}

export async function getUserView(api: Api, userId: string) {
  return await getUserViewsApi(api).getUserViews({
    userId,
  });
}

export async function getAllItemsByFolder(
  api: Api,
  userId: string,
  folderId: string,
  startIndex: number = 0,
  limit: number = 200,
  itemTypes: BaseItemKind[] = ['Movie', 'Series', 'Episode'],
  opts?: {
    sortBy?: ItemSortBy[];
    sortOrder?: 'Ascending' | 'Descending';
    onlyUnplayed?: boolean;
    year?: number;
    tags?: string[];
  },
) {
  const filters: ('IsPlayed' | 'IsUnplayed')[] = [];
  if (opts?.onlyUnplayed) filters.push('IsUnplayed');
  return await getItemsApi(api).getItems({
    userId,
    parentId: folderId,
    recursive: true,
    limit,
    sortBy: opts?.sortBy ?? ['DateCreated'],
    sortOrder: [opts?.sortOrder ?? 'Descending'],
    fields: ['PrimaryImageAspectRatio', 'Path'],
    imageTypeLimit: 1,
    enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
    includeItemTypes: itemTypes,
    startIndex,
    filters,
    years: opts?.year ? [opts.year] : undefined,
    tags: opts?.tags,
  });
}

export async function getSeasonsBySeries(api: Api, seriesId: string, userId: string) {
  return await getItemsApi(api).getItems({
    userId,
    parentId: seriesId,
    includeItemTypes: ['Season'],
    recursive: false,
    sortBy: ['IndexNumber'],
    sortOrder: ['Ascending'],
    fields: ['PrimaryImageAspectRatio'],
    imageTypeLimit: 1,
    enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
  });
}

export async function getEpisodesBySeason(api: Api, seasonId: string, userId: string) {
  return await getTvShowsApi(api).getEpisodes({
    userId,
    seasonId,
    fields: ['ItemCounts', 'PrimaryImageAspectRatio', 'CanDelete', 'MediaSourceCount', 'Overview'],
    seriesId: seasonId,
  });
}

export async function getSimilarShows(
  api: Api,
  itemId: string,
  userId: string,
  limit: number = 30,
) {
  return await getLibraryApi(api).getSimilarShows({
    itemId,
    userId,
    limit,
    fields: ['PrimaryImageAspectRatio'],
  });
}

export async function getSimilarMovies(
  api: Api,
  itemId: string,
  userId: string,
  limit: number = 30,
) {
  return await getLibraryApi(api).getSimilarMovies({
    itemId,
    userId,
    limit,
    fields: ['PrimaryImageAspectRatio'],
  });
}

export async function getSearchHints(
  api: Api,
  searchTerm: string,
  userId?: string,
  limit: number = 10,
) {
  return await getSearchApi(api).getSearchHints({
    searchTerm,
    userId,
    limit,
    includeMedia: true,
    includePeople: false,
    includeGenres: false,
    includeStudios: false,
    includeArtists: false,
  });
}

export async function searchItems(
  api: Api,
  userId: string,
  searchTerm: string,
  limit: number = 100,
  includeItemTypes: BaseItemKind[] = ['Movie', 'Series', 'Episode'],
): Promise<BaseItemDto[]> {
  const res = await getItemsApi(api).getItems({
    userId,
    searchTerm,
    limit,
    recursive: true,
    sortBy: ['SortName'],
    sortOrder: ['Ascending'],
    includeItemTypes,
    fields: ['PrimaryImageAspectRatio'],
    imageTypeLimit: 1,
    enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
  });
  return res.data?.Items ?? [];
}

export async function getRecommendedSearchKeywords(api: Api, userId: string, limit: number = 20) {
  const res = await getItemsApi(api).getItems({
    userId,
    limit,
    recursive: true,
    includeItemTypes: ['Movie', 'Series', 'MusicArtist'],
    sortBy: ['IsFavoriteOrLiked', 'Random'],
    imageTypeLimit: 0,
    enableTotalRecordCount: false,
    enableImages: false,
  });
  const items = res.data?.Items ?? [];
  const titles = items.map((i) => i.Name).filter((v): v is string => Boolean(v));
  return Array.from(new Set(titles)).slice(0, limit);
}

export type AvailableFilters = {
  years: number[];
  tags: string[];
  genres: string[];
};

export async function getAvailableFilters(
  api: Api,
  userId: string,
  parentId?: string,
): Promise<AvailableFilters> {
  const res = await getFilterApi(api).getQueryFiltersLegacy({ userId, parentId });
  const d = res.data as { Years?: number[]; Tags?: string[]; Genres?: string[] };
  return {
    years: Array.isArray(d?.Years)
      ? d!.Years!.filter((x): x is number => typeof x === 'number')
      : [],
    tags: Array.isArray(d?.Tags) ? d!.Tags!.filter((x): x is string => typeof x === 'string') : [],
    genres: Array.isArray(d?.Genres)
      ? d!.Genres!.filter((x): x is string => typeof x === 'string')
      : [],
  };
}

export async function addFavoriteItem(api: Api, userId: string, itemId: string) {
  return await getUserLibraryApi(api).markFavoriteItem({ userId, itemId });
}

export async function removeFavoriteItem(api: Api, userId: string, itemId: string) {
  return await getUserLibraryApi(api).unmarkFavoriteItem({ userId, itemId });
}

export async function markItemPlayed(
  api: Api,
  userId: string,
  itemId: string,
  datePlayed?: string,
) {
  return await getPlaystateApi(api).markPlayedItem({ itemId, userId, datePlayed });
}

export async function markItemUnplayed(api: Api, userId: string, itemId: string) {
  return await getPlaystateApi(api).markUnplayedItem({ itemId, userId });
}

export async function reportPlaybackProgress(
  api: Api,
  itemId: string,
  positionTicks: number,
  isPaused: boolean = false,
) {
  try {
    await getPlaystateApi(api).reportPlaybackProgress({
      playbackProgressInfo: {
        ItemId: itemId,
        PositionTicks: Math.floor(positionTicks * 10000),
        IsPaused: isPaused,
        CanSeek: true,
        PlaybackStartTimeTicks: Date.now() * 10000,
      },
    });
  } catch (error) {
    console.warn('Error reporting playback progress:', error);
  }
}

export async function reportPlaybackStart(api: Api, itemId: string, positionTicks: number = 0) {
  try {
    await getPlaystateApi(api).reportPlaybackStart({
      playbackStartInfo: {
        ItemId: itemId,
        PositionTicks: Math.floor(positionTicks * 10000),
        CanSeek: true,
        PlaybackStartTimeTicks: Date.now() * 10000,
      },
    });
  } catch (error) {
    console.warn('Error reporting playback start:', error);
  }
}

export async function reportPlaybackStop(api: Api, itemId: string, positionTicks: number) {
  try {
    await getPlaystateApi(api).reportPlaybackStopped({
      playbackStopInfo: {
        ItemId: itemId,
        PositionTicks: Math.floor(positionTicks * 10000),
      },
    });
  } catch (error) {
    console.warn('Error reporting playback stop:', error);
  }
}
