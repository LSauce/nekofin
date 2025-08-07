import { MediaServerInfo } from '@/lib/contexts/MediaServerContext';
import { Api, Jellyfin, RecommendedServerInfo } from '@jellyfin/sdk';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';

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
        id: 'nekofin-device-id',
      },
    });
  }
  return jellyfin;
}

export function getApiInstance() {
  return apiInstance;
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
    const jellyfin = getJellyfinInstance();
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
  return await api.authenticateUserByName(username, password);
}

export async function getMediaFolders(api: Api) {
  return await getLibraryApi(api).getMediaFolders();
}

export async function getLatestItems(api: Api, userId: string, limit: number = 20) {
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
  limit: number = 10,
) {
  return await getItemsApi(api).getItems({
    userId,
    limit,
    sortBy: ['DateCreated'],
    sortOrder: ['Descending'],
    includeItemTypes: ['Movie', 'Series', 'Episode'],
    recursive: true,
    filters: ['IsNotFolder'],
    parentId: folderId,
  });
}

export async function getNextUpItems(api: Api, userId: string, limit: number = 20) {
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
  limit: number = 10,
) {
  return await getTvShowsApi(api).getNextUp({
    userId,
    limit,
    parentId: folderId,
  });
}

export async function getResumeItems(api: Api, userId: string, limit: number = 10) {
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
    const serverInfo: Omit<MediaServerInfo, 'id' | 'createdAt'> = {
      address,
      name: authResult.data.User.ServerName || address,
      userId: authResult.data.User.Id,
      username: authResult.data.User.Name || username,
      userAvatar: `${address}Users/${authResult.data.User.Id}/Images/Primary?quality=90`,
      accessToken: authResult.data.AccessToken,
    };

    await addServer(serverInfo);
    return authResult;
  }

  throw new Error('Authentication failed');
}
