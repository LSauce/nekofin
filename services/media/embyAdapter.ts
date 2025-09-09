import { getDeviceId } from '@/lib/utils';
import type { ImageUrlInfo } from '@/lib/utils/image';
import type { RecommendedServerInfo } from '@jellyfin/sdk';
import { BaseItemDto, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models/device-profile';

import { StreamInfo } from './jellyfin';
import {
  MediaAdapter,
  MediaPerson,
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

type EmbyApi = {
  basePath: string;
  accessToken: string | null;
};

let apiInstance: EmbyApi | null = null;

function ensureApi(): EmbyApi {
  if (!apiInstance) throw new Error('API instance not set');
  return apiInstance;
}

function setToken(token: string | null) {
  if (apiInstance) apiInstance.accessToken = token;
}

async function embyFetch(path: string, init?: RequestInit) {
  const api = ensureApi();
  const url = `${api.basePath}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Emby-Client': 'Nekofin',
    'X-Emby-Device-Name': 'Nekofin Device',
    'X-Emby-Device-Id': getDeviceId(),
    'X-Emby-Client-Version': '1.0.0',
    'X-Emby-Language': 'zh-cn',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (api.accessToken) headers['X-Emby-Token'] = api.accessToken;
  const res = await fetch(url, { ...init, headers });
  return res;
}

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

function convertSortByToEmby(sortBy: MediaSortBy[]): ItemSortBy[] {
  return sortBy.map((sb) => sb as ItemSortBy);
}

class EmbyAdapter implements MediaAdapter {
  getApiInstance(): EmbyApi | null {
    return apiInstance;
  }
  setGlobalApiInstance(api: EmbyApi | null): void {
    apiInstance = api;
  }

  async discoverServers({ host }: { host: string }): Promise<RecommendedServerInfo[]> {
    try {
      const address = host.replace(/\/$/, '');
      const res = await fetch(`${address}/System/Info/Public`);
      if (!res.ok) return [];
      const data = (await res.json()) as { ServerName?: string };
      return [
        {
          Address: address,
          Id: 'emby',
          Name: data?.ServerName || address,
        } as unknown as RecommendedServerInfo,
      ];
    } catch {
      return [];
    }
  }
  findBestServer({ servers }: { servers: RecommendedServerInfo[] }): RecommendedServerInfo | null {
    return servers?.[0] ?? null;
  }

  createApi({ address }: { address: string }): EmbyApi {
    const basePath = address.replace(/\/$/, '');
    apiInstance = { basePath, accessToken: null };
    return apiInstance;
  }
  createApiFromServerInfo({ serverInfo }: { serverInfo: MediaServerInfo }): EmbyApi {
    const basePath = serverInfo.address.replace(/\/$/, '');
    apiInstance = { basePath, accessToken: serverInfo.accessToken };
    return apiInstance;
  }

  async getSystemInfo(): Promise<MediaSystemInfo> {
    const res = await embyFetch(`/System/Info/Public`);
    const result = (await res.json()) as {
      ServerName?: string;
      Version?: string;
      OperatingSystem?: string;
    };
    return {
      serverName: result?.ServerName,
      version: result?.Version,
      operatingSystem: result?.OperatingSystem,
    };
  }
  async getPublicUsers(): Promise<MediaUser[]> {
    const api = ensureApi();
    const res = await embyFetch(`/Users/Public`);
    const data = (await res.json()) as {
      Id?: string;
      Name?: string;
      ServerName?: string;
      PrimaryImageTag?: string;
    }[];
    return (data || []).map((user) => ({
      id: user.Id || '',
      name: user.Name || '',
      serverName: user.ServerName,
      avatar: user.PrimaryImageTag
        ? `${api.basePath}/Users/${user.Id}/Images/Primary?quality=90`
        : undefined,
    }));
  }
  async login({ username, password }: { username: string; password: string }): Promise<unknown> {
    const res = await embyFetch('/Users/AuthenticateByName', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Username: username, Pw: password }),
    });
    if (!res.ok) throw new Error('Authentication failed');
    const data = (await res.json()) as {
      User?: { Id?: string; Name?: string };
      AccessToken?: string;
    };
    if (data?.AccessToken) setToken(data.AccessToken);
    return { data };
  }
  async authenticateAndSaveServer({
    address,
    username,
    password,
    addServer,
  }: {
    address: string;
    username: string;
    password: string;
    addServer: (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => Promise<void>;
  }): Promise<unknown> {
    this.createApi({ address });
    const loginRes = (await this.login({ username, password })) as {
      data?: { User?: { Id?: string; Name?: string }; AccessToken?: string };
    };
    const token = loginRes?.data?.AccessToken;
    const userId = loginRes?.data?.User?.Id;
    if (userId && token) {
      const normalizedAddress = address.replace(/\/$/, '');
      const sys = await this.getSystemInfo();
      const serverInfo: Omit<MediaServerInfo, 'id' | 'createdAt'> = {
        address: normalizedAddress,
        name: sys.serverName || normalizedAddress,
        userId: userId,
        username: loginRes.data?.User?.Name || username,
        userAvatar: `${normalizedAddress}/Users/${userId}/Images/Primary?quality=90`,
        accessToken: token,
        type: 'emby',
      };
      await addServer(serverInfo);
      return loginRes;
    }
    throw new Error('Authentication failed');
  }

  async getLatestItems({
    userId,
    limit,
    includeItemTypes,
    sortBy,
    sortOrder,
    year,
    tags,
  }: {
    userId: string;
    limit?: number;
    includeItemTypes?: MediaItemType[];
    sortBy?: MediaSortBy[];
    sortOrder?: MediaSortOrder;
    year?: number;
    tags?: string[];
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }> {
    const params = new URLSearchParams();
    if (limit) params.set('Limit', String(limit));
    params.set('UserId', userId);
    params.set('Recursive', 'true');
    params.set('Filters', 'IsNotFolder');
    params.set('Fields', 'PrimaryImageAspectRatio,Path');
    params.set('ImageTypeLimit', '1');
    params.set('EnableImageTypes', 'Primary,Backdrop,Thumb');
    if (includeItemTypes?.length) params.set('IncludeItemTypes', includeItemTypes.join(','));
    if (sortBy?.length) params.set('SortBy', convertSortByToEmby(sortBy).join(','));
    if (sortOrder) params.set('SortOrder', sortOrder);
    if (year) params.set('Years', String(year));
    if (tags?.length) params.set('Tags', tags.join(','));
    const res = await embyFetch(`/Users/${userId}/Items?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[]; TotalRecordCount?: number };
    return {
      data: {
        Items: data.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: data.TotalRecordCount,
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
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }> {
    const params = new URLSearchParams();
    if (limit) params.set('Limit', String(limit));
    params.set('ParentId', folderId);
    params.set('Fields', 'PrimaryImageAspectRatio,Path');
    params.set('ImageTypeLimit', '1');
    params.set('EnableImageTypes', 'Primary,Backdrop,Thumb');
    const res = await embyFetch(`/Users/${userId}/Items/Latest?${params.toString()}`);
    const arr = (await res.json()) as BaseItemDto[];
    return { data: { Items: (arr || []).map(convertBaseItemDtoToMediaItem) } };
  }
  async getNextUpItems({ userId, limit }: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    const params = new URLSearchParams();
    if (limit) params.set('Limit', String(limit));
    params.set('UserId', userId);
    params.set('Fields', 'PrimaryImageAspectRatio,DateCreated,MediaSourceCount');
    params.set('ImageTypeLimit', '1');
    params.set('EnableImageTypes', 'Primary,Backdrop,Banner,Thumb');
    const res = await embyFetch(`/Shows/NextUp?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[]; TotalRecordCount?: number };
    return {
      data: {
        Items: data.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: data.TotalRecordCount,
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
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }> {
    const params = new URLSearchParams();
    if (limit) params.set('Limit', String(limit));
    params.set('UserId', userId);
    params.set('ParentId', folderId);
    const res = await embyFetch(`/Shows/NextUp?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[]; TotalRecordCount?: number };
    return {
      data: {
        Items: data.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: data.TotalRecordCount,
      },
    };
  }
  async getResumeItems({ userId, limit }: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    const params = new URLSearchParams();
    params.set('Recursive', 'true');
    params.set('Fields', 'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear');
    params.set('ImageTypeLimit', '1');
    params.set('EnableImageTypes', 'Primary,Backdrop,Thumb');
    params.set('MediaTypes', 'Video');
    if (limit) params.set('Limit', String(limit));
    const res = await embyFetch(`/Users/${userId}/Items/Resume?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[]; TotalRecordCount?: number };
    return {
      data: {
        Items: data.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: data.TotalRecordCount,
      },
    };
  }
  async getFavoriteItems({ userId, limit }: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    const params = new URLSearchParams();
    params.set('UserId', userId);
    params.set('Recursive', 'true');
    params.set('Filters', 'IsFavorite');
    if (limit) params.set('Limit', String(limit));
    params.set('IncludeItemTypes', 'Movie,Series,Episode');
    params.set('SortBy', 'DateCreated');
    params.set('SortOrder', 'Descending');
    params.set('Fields', 'PrimaryImageAspectRatio,Path');
    params.set('ImageTypeLimit', '1');
    params.set('EnableImageTypes', 'Primary,Backdrop,Thumb');
    const res = await embyFetch(`/Users/${userId}/Items?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[] };
    return { data: { Items: data.Items?.map(convertBaseItemDtoToMediaItem) } };
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
    sortOrder?: MediaSortOrder;
    onlyUnplayed?: boolean;
    year?: number;
    tags?: string[];
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }> {
    const params = new URLSearchParams();
    params.set('UserId', userId);
    if (typeof startIndex === 'number') params.set('StartIndex', String(startIndex));
    if (limit) params.set('Limit', String(limit));
    params.set('Recursive', 'true');
    params.set('Filters', onlyUnplayed ? 'IsFavorite,IsUnplayed' : 'IsFavorite');
    params.set('Fields', 'PrimaryImageAspectRatio,Path');
    params.set('ImageTypeLimit', '1');
    params.set('EnableImageTypes', 'Primary,Backdrop,Thumb');
    if (includeItemTypes?.length) params.set('IncludeItemTypes', includeItemTypes.join(','));
    if (sortBy?.length) params.set('SortBy', convertSortByToEmby(sortBy).join(','));
    if (sortOrder) params.set('SortOrder', sortOrder);
    if (year) params.set('Years', String(year));
    if (tags?.length) params.set('Tags', tags.join(','));
    const res = await embyFetch(`/Users/${userId}/Items?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[]; TotalRecordCount?: number };
    return {
      data: {
        Items: data.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: data.TotalRecordCount,
      },
    };
  }
  async logout(): Promise<void> {
    setToken(null);
  }
  async getUserInfo({ userId }: { userId: string }): Promise<MediaUser> {
    const api = ensureApi();
    const res = await embyFetch(`/Users/${userId}`);
    const result = (await res.json()) as {
      Id?: string;
      Name?: string;
      ServerName?: string;
      PrimaryImageTag?: string;
    };
    return {
      id: result?.Id || '',
      name: result?.Name || '',
      serverName: result?.ServerName,
      avatar: result?.PrimaryImageTag
        ? `${api.basePath}/Users/${userId}/Images/Primary?quality=90`
        : undefined,
    };
  }
  async getItemDetail({ itemId, userId }: { itemId: string; userId: string }): Promise<MediaItem> {
    const res = await embyFetch(`/Users/${userId}/Items/${itemId}`);
    const data = (await res.json()) as BaseItemDto;
    return convertBaseItemDtoToMediaItem(data);
  }
  async getItemMediaSources({ itemId }: { itemId: string }): Promise<MediaPlaybackInfo> {
    const res = await embyFetch(`/Items/${itemId}/PlaybackInfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IsPlayback: true, AutoOpenLiveStream: true }),
    });
    const result = (await res.json()) as {
      MediaSources?: {
        Id?: string;
        Protocol?: string;
        Container?: string;
        Size?: number;
        Bitrate?: number;
        MediaStreams?: {
          Codec?: string;
          Type?: 'Video' | 'Audio' | 'Subtitle';
          Index?: number;
          Language?: string;
          IsDefault?: boolean;
          IsForced?: boolean;
          Width?: number;
          Height?: number;
          BitRate?: number;
        }[];
        TranscodingUrl?: string;
      }[];
    };
    return {
      mediaSources:
        result.MediaSources?.map((source) => ({
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
  async getUserView({ userId }: { userId: string }): Promise<MediaItem[]> {
    const res = await embyFetch(`/Users/${userId}/Views`);
    const data = (await res.json()) as { Items?: BaseItemDto[] };
    return data.Items?.map(convertBaseItemDtoToMediaItem) || [];
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
    sortOrder?: MediaSortOrder;
    onlyUnplayed?: boolean;
    year?: number;
    tags?: string[];
  }): Promise<{ data: { Items?: MediaItem[]; TotalRecordCount?: number } }> {
    const params = new URLSearchParams();
    params.set('UserId', userId);
    params.set('ParentId', folderId);
    params.set('Recursive', 'true');
    if (typeof startIndex === 'number') params.set('StartIndex', String(startIndex));
    if (limit) params.set('Limit', String(limit));
    params.set('Fields', 'PrimaryImageAspectRatio,Path');
    params.set('ImageTypeLimit', '1');
    params.set('EnableImageTypes', 'Primary,Backdrop,Thumb');
    if (itemTypes?.length) params.set('IncludeItemTypes', itemTypes.join(','));
    if (sortBy?.length) params.set('SortBy', convertSortByToEmby(sortBy).join(','));
    if (sortOrder) params.set('SortOrder', sortOrder);
    if (onlyUnplayed) params.set('Filters', 'IsUnplayed');
    if (year) params.set('Years', String(year));
    if (tags?.length) params.set('Tags', tags.join(','));
    const res = await embyFetch(`/Users/${userId}/Items?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[]; TotalRecordCount?: number };
    return {
      data: {
        Items: data.Items?.map(convertBaseItemDtoToMediaItem),
        TotalRecordCount: data.TotalRecordCount,
      },
    };
  }
  async getSeasonsBySeries({ seriesId, userId }: { seriesId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }> {
    const params = new URLSearchParams();
    params.set('UserId', userId);
    params.set('ParentId', seriesId);
    params.set('IncludeItemTypes', 'Season');
    params.set('Recursive', 'false');
    params.set('SortBy', 'IndexNumber');
    params.set('SortOrder', 'Ascending');
    params.set('Fields', 'PrimaryImageAspectRatio');
    params.set('ImageTypeLimit', '1');
    params.set('EnableImageTypes', 'Primary,Backdrop,Thumb');
    const res = await embyFetch(`/Users/${userId}/Items?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[] };
    return { data: { Items: data.Items?.map(convertBaseItemDtoToMediaItem) } };
  }
  async getEpisodesBySeason({ seasonId, userId }: { seasonId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }> {
    const params = new URLSearchParams();
    params.set('UserId', userId);
    params.set('ParentId', seasonId);
    params.set('IncludeItemTypes', 'Episode');
    params.set('Fields', 'ItemCounts,PrimaryImageAspectRatio,CanDelete,MediaSourceCount,Overview');
    const res = await embyFetch(`/Users/${userId}/Items?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[] };
    return { data: { Items: data.Items?.map(convertBaseItemDtoToMediaItem) } };
  }
  async getSimilarShows({
    itemId,
    userId,
    limit,
  }: {
    itemId: string;
    userId: string;
    limit?: number;
  }): Promise<{ data: { Items?: MediaItem[] } }> {
    const params = new URLSearchParams();
    if (limit) params.set('Limit', String(limit));
    params.set('UserId', userId);
    params.set('IncludeItemTypes', 'Series');
    params.set('Fields', 'PrimaryImageAspectRatio');
    const res = await embyFetch(`/Items/${itemId}/Similar?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[] };
    return { data: { Items: data.Items?.map(convertBaseItemDtoToMediaItem) } };
  }
  async getSimilarMovies({
    itemId,
    userId,
    limit,
  }: {
    itemId: string;
    userId: string;
    limit?: number;
  }): Promise<{ data: { Items?: MediaItem[] } }> {
    const params = new URLSearchParams();
    if (limit) params.set('Limit', String(limit));
    params.set('UserId', userId);
    params.set('IncludeItemTypes', 'Movie');
    params.set('Fields', 'PrimaryImageAspectRatio');
    const res = await embyFetch(`/Items/${itemId}/Similar?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[] };
    return { data: { Items: data.Items?.map(convertBaseItemDtoToMediaItem) } };
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
  }): Promise<MediaItem[]> {
    const params = new URLSearchParams();
    params.set('UserId', userId);
    params.set('Recursive', 'true');
    params.set('SearchTerm', searchTerm);
    params.set('SortBy', 'SortName');
    params.set('SortOrder', 'Ascending');
    params.set('Fields', 'PrimaryImageAspectRatio');
    params.set('ImageTypeLimit', '1');
    params.set('EnableImageTypes', 'Primary,Backdrop,Thumb');
    if (limit) params.set('Limit', String(limit));
    if (includeItemTypes?.length) params.set('IncludeItemTypes', includeItemTypes.join(','));
    const res = await embyFetch(`/Users/${userId}/Items?${params.toString()}`);
    const data = (await res.json()) as { Items?: BaseItemDto[] };
    return data.Items?.map(convertBaseItemDtoToMediaItem) ?? [];
  }
  async getRecommendedSearchKeywords({
    userId,
    limit,
  }: {
    userId: string;
    limit?: number;
  }): Promise<string[]> {
    const params = new URLSearchParams();
    params.set('UserId', userId);
    params.set('Recursive', 'true');
    params.set('IncludeItemTypes', 'Movie,Series,MusicArtist');
    params.set('SortBy', 'IsFavoriteOrLiked,Random');
    params.set('ImageTypeLimit', '0');
    params.set('EnableTotalRecordCount', 'false');
    params.set('EnableImages', 'false');
    if (limit) params.set('Limit', String(limit));
    const res = await embyFetch(`/Users/${userId}/Items?${params.toString()}`);
    const data = (await res.json()) as { Items?: { Name?: string }[] };
    const titles = (data.Items ?? []).map((i) => i.Name).filter((v): v is string => Boolean(v));
    return Array.from(new Set(titles)).slice(0, limit ?? 20);
  }
  async getAvailableFilters({
    userId,
    parentId,
  }: {
    userId: string;
    parentId?: string;
  }): Promise<MediaFilters> {
    const params = new URLSearchParams();
    params.set('UserId', userId);
    if (parentId) params.set('ParentId', parentId);
    const res = await embyFetch(`/Items/Filters?${params.toString()}`);
    const d = (await res.json()) as { Years?: number[]; Tags?: string[]; Genres?: string[] };
    return {
      years: Array.isArray(d?.Years)
        ? d.Years.filter((x): x is number => typeof x === 'number')
        : [],
      tags: Array.isArray(d?.Tags) ? d.Tags.filter((x): x is string => typeof x === 'string') : [],
      genres: Array.isArray(d?.Genres)
        ? d.Genres.filter((x): x is string => typeof x === 'string')
        : [],
    };
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
  }): ImageUrlInfo {
    const api = ensureApi();
    const baseItem = (item as MediaItem).raw ?? item;

    if (!baseItem || typeof baseItem !== 'object' || !('Id' in baseItem) || !baseItem.Id) {
      return { url: undefined, blurhash: undefined };
    }

    const itemData = baseItem as BaseItemDto;
    let imageTag: string | undefined;
    let imageType = 'Primary';

    if (opts?.preferBackdrop && itemData.BackdropImageTags?.[0]) {
      imageTag = itemData.BackdropImageTags[0];
      imageType = 'Backdrop';
    } else if (opts?.preferLogo && itemData.ImageTags?.Logo) {
      imageTag = itemData.ImageTags.Logo;
      imageType = 'Logo';
    } else if (opts?.preferThumb && itemData.ImageTags?.Thumb) {
      imageTag = itemData.ImageTags.Thumb;
      imageType = 'Thumb';
    } else if (opts?.preferBanner && itemData.ImageTags?.Banner) {
      imageTag = itemData.ImageTags.Banner;
      imageType = 'Banner';
    } else if (itemData.ImageTags?.Primary) {
      imageTag = itemData.ImageTags.Primary;
      imageType = 'Primary';
    }

    if (!imageTag) {
      return { url: undefined, blurhash: undefined };
    }

    const params = new URLSearchParams();
    params.set('tag', imageTag);
    if (opts?.width) params.set('maxWidth', String(opts.width));
    if (opts?.height) params.set('maxHeight', String(opts.height));
    params.set('quality', '90');

    const url = `${api.basePath}/Items/${itemData.Id}/Images/${imageType}?${params.toString()}`;

    const blurHashValue =
      itemData.ImageBlurHashes?.[imageType as keyof typeof itemData.ImageBlurHashes];
    const blurhash = typeof blurHashValue === 'string' ? blurHashValue : undefined;

    return {
      url,
      blurhash,
    };
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
  }): Promise<StreamInfo | null> {
    const api = ensureApi();
    const baseItem = (item as MediaItem | null | undefined)?.raw as BaseItemDto | undefined;
    if (!userId || !baseItem?.Id) return null;

    const res = await embyFetch(`/Items/${baseItem.Id}/PlaybackInfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        UserId: userId,
        DeviceProfile: deviceProfile,
        SubtitleStreamIndex: subtitleStreamIndex,
        StartTimeTicks: startTimeTicks,
        IsPlayback: true,
        AutoOpenLiveStream: true,
        MaxStreamingBitrate: maxStreamingBitrate,
        AudioStreamIndex: audioStreamIndex,
        MediaSourceId: mediaSourceId,
      }),
    });
    if (!res.ok) return null;
    const playback = (await res.json()) as {
      PlaySessionId?: string;
      MediaSources?: {
        Id?: string;
        TranscodingUrl?: string;
      }[];
    };
    const mediaSource = playback.MediaSources?.[0];
    const sessionId = playback.PlaySessionId || null;

    let url: string | null = null;
    if (mediaSource?.TranscodingUrl) {
      url = `${api.basePath}${mediaSource.TranscodingUrl}`;
    } else {
      const qs = new URLSearchParams();
      qs.set('static', 'true');
      qs.set('container', 'mp4');
      qs.set('mediaSourceId', mediaSource?.Id || '');
      if (typeof subtitleStreamIndex === 'number')
        qs.set('subtitleStreamIndex', String(subtitleStreamIndex));
      if (typeof audioStreamIndex === 'number')
        qs.set('audioStreamIndex', String(audioStreamIndex));
      if (deviceId) qs.set('deviceId', deviceId);
      if (api.accessToken) qs.set('api_key', api.accessToken);
      qs.set('startTimeTicks', String(startTimeTicks || 0));
      if (maxStreamingBitrate) qs.set('maxStreamingBitrate', String(maxStreamingBitrate));
      qs.set('userId', userId);
      if (playSessionId) qs.set('playSessionId', playSessionId);
      url = `${api.basePath}/Videos/${baseItem.Id}/stream?${qs.toString()}`;
    }

    return { url, sessionId, mediaSource: undefined };
  }

  async addFavoriteItem({ userId, itemId }: { userId: string; itemId: string }): Promise<void> {
    await embyFetch(`/Users/${userId}/FavoriteItems/${itemId}`, { method: 'POST' });
  }
  async removeFavoriteItem({ userId, itemId }: { userId: string; itemId: string }): Promise<void> {
    await embyFetch(`/Users/${userId}/FavoriteItems/${itemId}`, { method: 'DELETE' });
  }
  async markItemPlayed({
    userId,
    itemId,
    datePlayed,
  }: {
    userId: string;
    itemId: string;
    datePlayed?: string;
  }): Promise<void> {
    const params = new URLSearchParams();
    if (datePlayed) params.set('DatePlayed', datePlayed);
    await embyFetch(`/Users/${userId}/PlayedItems/${itemId}?${params.toString()}`, {
      method: 'POST',
    });
  }
  async markItemUnplayed({ userId, itemId }: { userId: string; itemId: string }): Promise<void> {
    await embyFetch(`/Users/${userId}/PlayedItems/${itemId}`, { method: 'DELETE' });
  }
  async reportPlaybackProgress({
    itemId,
    positionTicks,
    isPaused,
  }: {
    itemId: string;
    positionTicks: number;
    isPaused?: boolean;
  }): Promise<void> {
    await embyFetch(`/Sessions/Playing/Progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ItemId: itemId,
        PositionTicks: Math.floor(positionTicks * 10000),
        IsPaused: isPaused ?? false,
        CanSeek: true,
        PlaybackStartTimeTicks: Date.now() * 10000,
      }),
    });
  }
  async reportPlaybackStart({
    itemId,
    positionTicks,
  }: {
    itemId: string;
    positionTicks?: number;
  }): Promise<void> {
    await embyFetch(`/Sessions/Playing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ItemId: itemId,
        PositionTicks: Math.floor((positionTicks ?? 0) * 10000),
        CanSeek: true,
        PlaybackStartTimeTicks: Date.now() * 10000,
      }),
    });
  }
  async reportPlaybackStop({
    itemId,
    positionTicks,
  }: {
    itemId: string;
    positionTicks: number;
  }): Promise<void> {
    await embyFetch(`/Sessions/Playing/Stopped`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ItemId: itemId,
        PositionTicks: Math.floor(positionTicks * 10000),
      }),
    });
  }
}

export const embyAdapter = new EmbyAdapter();
