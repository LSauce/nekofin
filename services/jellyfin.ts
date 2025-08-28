import { MediaServerInfo } from '@/lib/contexts/MediaServerContext';
import { getDeviceId } from '@/lib/utils';
import { Api, Jellyfin, RecommendedServerInfo } from '@jellyfin/sdk';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import {
  getItemsApi,
  getLibraryApi,
  getMediaInfoApi,
  getSystemApi,
  getTvShowsApi,
  getUserApi,
  getUserLibraryApi,
  getUserViewsApi,
} from '@jellyfin/sdk/lib/utils/api';

let jellyfin: Jellyfin | null = null;
let apiInstance: Api | null = null;

export function getJellyfinInstance(address?: string) {
  if (!jellyfin) {
    jellyfin = new Jellyfin({
      clientInfo: {
        name: 'Nekofin',
        version: '1.0.0',
      },
      deviceInfo: {
        name: 'Nekofin Device',
        id: getDeviceId(address),
      },
    });
  }
  return jellyfin;
}

export function getApiInstance() {
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
  if (!apiInstance) {
    const jellyfin = getJellyfinInstance(address);
    apiInstance = jellyfin.createApi(address);
  }
  return apiInstance;
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

export async function getMediaFolders(api: Api) {
  return await getLibraryApi(api).getMediaFolders();
}

export async function getLatestItems(api: Api, userId: string, limit: number = 100) {
  return await getItemsApi(api).getItems({
    userId,
    limit,
    sortBy: ['DateCreated'],
    sortOrder: ['Descending'],
    includeItemTypes: ['Movie', 'Series', 'Episode'],
    recursive: true,
    filters: ['IsNotFolder'],
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

export async function logout(api: Api) {
  return await api.logout();
}

export async function getUserInfo(api: Api, userId: string) {
  return await getUserApi(api).getUserById({ userId });
}

export function createApiFromServerInfo(serverInfo: MediaServerInfo) {
  const jellyfin = getJellyfinInstance(serverInfo.address);
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
  limit: number = 200,
  itemTypes: BaseItemKind[] = ['Movie', 'Series', 'Episode'],
) {
  return await getItemsApi(api).getItems({
    userId,
    parentId: folderId,
    recursive: true,
    limit,
    sortBy: ['DateCreated'],
    sortOrder: ['Descending'],
    fields: ['PrimaryImageAspectRatio', 'Path'],
    imageTypeLimit: 1,
    enableImageTypes: ['Primary', 'Backdrop', 'Thumb'],
    includeItemTypes: itemTypes,
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

export async function addFavoriteItem(api: Api, userId: string, itemId: string) {
  return await getUserLibraryApi(api).markFavoriteItem({ userId, itemId });
}

export async function removeFavoriteItem(api: Api, userId: string, itemId: string) {
  return await getUserLibraryApi(api).unmarkFavoriteItem({ userId, itemId });
}
