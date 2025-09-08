import type { Api } from '@jellyfin/sdk';

import type { MediaAdapter, MediaServerInfo } from './types';

export const embyAdapter: MediaAdapter = {
  getApiInstance() {
    return null;
  },
  setGlobalApiInstance() {},

  async discoverServers() {
    return [];
  },
  findBestServer() {
    return null;
  },

  createApi(address: string): Api {
    throw new Error('Emby adapter not implemented');
  },
  createApiFromServerInfo(serverInfo: MediaServerInfo): Api {
    throw new Error('Emby adapter not implemented');
  },

  async getSystemInfo() {
    throw new Error('Emby adapter not implemented');
  },
  async getPublicUsers() {
    throw new Error('Emby adapter not implemented');
  },
  async login() {
    throw new Error('Emby adapter not implemented');
  },
  async authenticateAndSaveServer() {
    throw new Error('Emby adapter not implemented');
  },

  async getLatestItems() {
    throw new Error('Emby adapter not implemented');
  },
  async getLatestItemsByFolder() {
    throw new Error('Emby adapter not implemented');
  },
  async getNextUpItems() {
    throw new Error('Emby adapter not implemented');
  },
  async getNextUpItemsByFolder() {
    throw new Error('Emby adapter not implemented');
  },
  async getResumeItems() {
    throw new Error('Emby adapter not implemented');
  },
  async getFavoriteItems() {
    throw new Error('Emby adapter not implemented');
  },
  async getFavoriteItemsPaged() {
    throw new Error('Emby adapter not implemented');
  },
  async logout() {
    throw new Error('Emby adapter not implemented');
  },
  async getUserInfo() {
    throw new Error('Emby adapter not implemented');
  },
  async getItemDetail() {
    throw new Error('Emby adapter not implemented');
  },
  async getItemMediaSources() {
    throw new Error('Emby adapter not implemented');
  },
  async getUserView() {
    throw new Error('Emby adapter not implemented');
  },
  async getAllItemsByFolder() {
    throw new Error('Emby adapter not implemented');
  },
  async getSeasonsBySeries() {
    throw new Error('Emby adapter not implemented');
  },
  async getEpisodesBySeason() {
    throw new Error('Emby adapter not implemented');
  },
  async getSimilarShows() {
    throw new Error('Emby adapter not implemented');
  },
  async getSimilarMovies() {
    throw new Error('Emby adapter not implemented');
  },
  async searchItems() {
    throw new Error('Emby adapter not implemented');
  },
  async getRecommendedSearchKeywords() {
    throw new Error('Emby adapter not implemented');
  },
  async getAvailableFilters() {
    throw new Error('Emby adapter not implemented');
  },

  async addFavoriteItem() {
    throw new Error('Emby adapter not implemented');
  },
  async removeFavoriteItem() {
    throw new Error('Emby adapter not implemented');
  },
  async markItemPlayed() {
    throw new Error('Emby adapter not implemented');
  },
  async markItemUnplayed() {
    throw new Error('Emby adapter not implemented');
  },
  async reportPlaybackProgress() {
    throw new Error('Emby adapter not implemented');
  },
  async reportPlaybackStart() {
    throw new Error('Emby adapter not implemented');
  },
  async reportPlaybackStop() {
    throw new Error('Emby adapter not implemented');
  },

  getImageInfo() {
    throw new Error('Emby adapter not implemented');
  },
};
