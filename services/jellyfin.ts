import { MediaServerInfo } from '@/lib/contexts/MediaServerContext';
import { Api, Jellyfin } from '@jellyfin/sdk';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
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

export function findBestServer(servers: any[]) {
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

export async function getSystemInfo(api: any) {
  return await getSystemApi(api).getPublicSystemInfo();
}

export async function getPublicUsers(api: any) {
  return await getUserApi(api).getPublicUsers();
}

export async function login(api: any, username: string, password: string) {
  return await api.authenticateUserByName(username, password);
}

export async function getMediaFolders(api: any) {
  return await getLibraryApi(api).getMediaFolders();
}

export async function logout(api: any) {
  return await api.logout();
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
      name: authResult.data.ServerInfo?.Name || address,
      userId: authResult.data.User.Id,
      username: authResult.data.User.Name || username,
      accessToken: authResult.data.AccessToken,
    };

    await addServer(serverInfo);
    return authResult;
  }

  throw new Error('Authentication failed');
}
