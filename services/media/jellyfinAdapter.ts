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
  getMediaFolders,
  getNextUpItems,
  getNextUpItemsByFolder,
  getPublicUsers,
  getRecommendedSearchKeywords,
  getSearchHints,
  getSeasonsBySeries,
  getSystemInfo,
  getUserInfo,
  getUserView,
  login,
  logout,
  markItemPlayed,
  markItemUnplayed,
  removeFavoriteItem,
  reportPlaybackProgress,
  reportPlaybackStart,
  reportPlaybackStop,
  setGlobalApiInstance,
} from '@/services/jellyfin';
import type { Api } from '@jellyfin/sdk';

import type { MediaAdapter, MediaServerInfo } from './types';

export const jellyfinAdapter: MediaAdapter = {
  getApiInstance,
  setGlobalApiInstance,

  async discoverServers(host) {
    const jf = getJellyfinInstance();
    return await jf.discovery.getRecommendedServerCandidates(host);
  },

  findBestServer(servers) {
    const best = findBestServer(servers);
    return best ?? null;
  },

  createApi(address: string) {
    return createApi(address);
  },
  createApiFromServerInfo(serverInfo: MediaServerInfo): Api {
    return createApiFromServerInfo(serverInfo);
  },

  getSystemInfo,
  getPublicUsers,
  login,
  authenticateAndSaveServer,

  getMediaFolders,
  getLatestItems,
  getLatestItemsByFolder,
  getNextUpItems,
  getNextUpItemsByFolder,
  getResumeItems: (api, userId, limit) =>
    import('@/services/jellyfin').then((m) => m.getResumeItems(api, userId, limit)),
  getFavoriteItems,
  getFavoriteItemsPaged,
  logout,
  getUserInfo,
  getItemDetail,
  getItemMediaSources,
  getUserView,
  getAllItemsByFolder,
  getSeasonsBySeries,
  getEpisodesBySeason,
  getSimilarShows: (api, itemId, userId, limit) =>
    import('@/services/jellyfin').then((m) => m.getSimilarShows(api, itemId, userId, limit)),
  getSimilarMovies: (api, itemId, userId, limit) =>
    import('@/services/jellyfin').then((m) => m.getSimilarMovies(api, itemId, userId, limit)),
  getSearchHints,
  searchItems: (api, userId, searchTerm, limit, includeItemTypes) =>
    import('@/services/jellyfin').then((m) =>
      m.searchItems(api, userId, searchTerm, limit, includeItemTypes),
    ),
  getRecommendedSearchKeywords,
  getAvailableFilters,

  addFavoriteItem,
  removeFavoriteItem,
  markItemPlayed,
  markItemUnplayed,
  reportPlaybackProgress,
  reportPlaybackStart,
  reportPlaybackStop,
};
