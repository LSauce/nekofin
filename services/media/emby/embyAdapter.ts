import type { ImageUrlInfo } from '@/lib/utils/image';
import type { RecommendedServerInfo } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import {
  applyDefaultImageAndFields,
  convertSortByToEmby,
  EmbyApi,
  EmbyAuthenticateResponse,
  EmbyFiltersResponse,
  EmbyPlaybackInfoResponse,
  EmbyPublicSystemInfo,
  EmbyPublicUser,
  ensureApi,
  getApiInstance,
  getBlurHash,
  getEmbyApiClient,
  getUnderlyingRaw,
  isBaseItemDto,
  parseItems,
  parseItemsWithCount,
  rebuildApiClient,
  setGlobalApiInstance,
  setToken,
  toRecommendedServerInfo,
} from '.';
import { StreamInfo } from '../jellyfin';
import { convertBaseItemDtoToMediaItem } from '../jellyfin/jellyfinAdapter';
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
} from '../types';

class EmbyAdapter implements MediaAdapter {
  getApiInstance(): EmbyApi | null {
    return getApiInstance();
  }

  setGlobalApiInstance(api: EmbyApi | null): void {
    setGlobalApiInstance(api);
  }

  async discoverServers({ host }: { host: string }): Promise<RecommendedServerInfo[]> {
    try {
      const address = host.replace(/\/$/, '');
      const res = await fetch(`${address}/System/Info/Public`);
      if (!res.ok) return [];
      const data = (await res.json()) as { ServerName?: string };
      return [toRecommendedServerInfo(address, data?.ServerName || address)];
    } catch {
      return [];
    }
  }

  findBestServer({ servers }: { servers: RecommendedServerInfo[] }): RecommendedServerInfo | null {
    return servers?.[0] ?? null;
  }

  createApi({ address }: { address: string }): EmbyApi {
    const basePath = address.replace(/\/$/, '');
    const apiInstance = { basePath, accessToken: null };
    setGlobalApiInstance(apiInstance);
    rebuildApiClient();
    return apiInstance;
  }

  createApiFromServerInfo({ serverInfo }: { serverInfo: MediaServerInfo }): EmbyApi {
    const basePath = serverInfo.address.replace(/\/$/, '');
    const apiInstance = { basePath, accessToken: serverInfo.accessToken };
    setGlobalApiInstance(apiInstance);
    rebuildApiClient();
    return apiInstance;
  }

  async getSystemInfo(): Promise<MediaSystemInfo> {
    const res = await getEmbyApiClient().get<EmbyPublicSystemInfo>(`/System/Info/Public`);
    const result = res.data;
    return {
      serverName: result?.ServerName,
      version: result?.Version,
      operatingSystem: result?.OperatingSystem,
    };
  }

  async getPublicUsers(): Promise<MediaUser[]> {
    const api = ensureApi();
    const res = await getEmbyApiClient().get<EmbyPublicUser[]>(`/Users/Public`);
    const data = res.data;
    return (data || []).map((user) => ({
      id: user.Id || '',
      name: user.Name || '',
      serverName: user.ServerName,
      avatar: user.PrimaryImageTag
        ? `${api.basePath}/Users/${user.Id}/Images/Primary?quality=90`
        : undefined,
    }));
  }

  async login({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{ data: EmbyAuthenticateResponse }> {
    const client = getEmbyApiClient();
    const res = await client.post<EmbyAuthenticateResponse>(
      '/Users/AuthenticateByName',
      { Username: username, Pw: password },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );
    const data = res.data;
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
    const loginRes = await this.login({ username, password });
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
    const baseParams = new URLSearchParams();
    applyDefaultImageAndFields(baseParams);
    const res = await getEmbyApiClient().get<{
      Items?: BaseItemDto[];
      TotalRecordCount?: number;
    }>(`/Users/${userId}/Items`, {
      UserId: userId,
      Recursive: true,
      Filters: 'IsNotFolder',
      Limit: limit,
      IncludeItemTypes: includeItemTypes?.join(','),
      SortBy: convertSortByToEmby(sortBy || []).join(','),
      SortOrder: sortOrder,
      Years: year,
      Tags: tags?.join(','),
      ...Object.fromEntries(baseParams.entries()),
    });
    const data = await parseItemsWithCount(res);
    return { data };
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
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[] }>(
      `/Users/${userId}/Items/Latest`,
      {
        Limit: limit,
        ParentId: folderId,
        ...(() => {
          const p = new URLSearchParams();
          applyDefaultImageAndFields(p);
          return Object.fromEntries(p.entries());
        })(),
      },
    );
    const items = await parseItems(res);
    return { data: { Items: items } };
  }

  async getNextUpItems({ userId, limit }: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[]; TotalRecordCount?: number }>(
      `/Shows/NextUp`,
      {
        Limit: limit,
        UserId: userId,
        Fields: 'PrimaryImageAspectRatio,DateCreated,MediaSourceCount',
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
      },
    );
    const data = await parseItemsWithCount(res);
    return { data };
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
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[]; TotalRecordCount?: number }>(
      `/Shows/NextUp`,
      {
        Limit: limit,
        UserId: userId,
        ParentId: folderId,
      },
    );
    const data = await parseItemsWithCount(res);
    return { data };
  }

  async getResumeItems({ userId, limit }: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[]; TotalRecordCount?: number }>(
      `/Users/${userId}/Items/Resume`,
      {
        Recursive: true,
        Fields: 'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear',
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Thumb',
        MediaTypes: 'Video',
        Limit: limit,
      },
    );
    const data = await parseItemsWithCount(res);
    return { data };
  }

  async getFavoriteItems({ userId, limit }: { userId: string; limit?: number }): Promise<{
    data: { Items?: MediaItem[]; TotalRecordCount?: number };
  }> {
    const baseParams = new URLSearchParams();
    applyDefaultImageAndFields(baseParams);
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[] }>(`/Users/${userId}/Items`, {
      UserId: userId,
      Recursive: true,
      Filters: 'IsFavorite',
      Limit: limit,
      IncludeItemTypes: 'Movie,Series,Episode',
      SortBy: 'DateCreated',
      SortOrder: 'Descending',
      ...Object.fromEntries(baseParams.entries()),
    });
    const items = await parseItems(res);
    return { data: { Items: items } };
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
    const baseParams = new URLSearchParams();
    applyDefaultImageAndFields(baseParams);
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[]; TotalRecordCount?: number }>(
      `/Users/${userId}/Items`,
      {
        UserId: userId,
        StartIndex: startIndex,
        Limit: limit,
        Recursive: true,
        Filters: onlyUnplayed ? 'IsFavorite,IsUnplayed' : 'IsFavorite',
        IncludeItemTypes: includeItemTypes?.join(','),
        SortBy: convertSortByToEmby(sortBy || []).join(','),
        SortOrder: sortOrder,
        Years: year,
        Tags: tags?.join(','),
        ...Object.fromEntries(baseParams.entries()),
      },
    );
    const data = await parseItemsWithCount(res);
    return { data };
  }

  async logout(): Promise<void> {
    setToken(null);
  }

  async getUserInfo({ userId }: { userId: string }): Promise<MediaUser> {
    const api = ensureApi();
    const res = await getEmbyApiClient().get<EmbyPublicUser>(`/Users/${userId}`);
    const result = res.data;
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
    const res = await getEmbyApiClient().get<BaseItemDto>(`/Users/${userId}/Items/${itemId}`);
    const data = res.data;
    return convertBaseItemDtoToMediaItem(data);
  }

  async getItemMediaSources({ itemId }: { itemId: string }): Promise<MediaPlaybackInfo> {
    const res = await getEmbyApiClient().post<EmbyPlaybackInfoResponse>(
      `/Items/${itemId}/PlaybackInfo`,
      {
        IsPlayback: true,
        AutoOpenLiveStream: true,
      },
    );
    const result = res.data;
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
              type: stream.Type === 'Audio' || stream.Type === 'Subtitle' ? stream.Type : 'Video',
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
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[] }>(`/Users/${userId}/Views`);
    return await parseItems(res);
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
    const baseParams = new URLSearchParams();
    applyDefaultImageAndFields(baseParams);
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[]; TotalRecordCount?: number }>(
      `/Users/${userId}/Items`,
      {
        UserId: userId,
        ParentId: folderId,
        Recursive: true,
        StartIndex: startIndex,
        Limit: limit,
        IncludeItemTypes: itemTypes?.join(','),
        SortBy: convertSortByToEmby(sortBy || []).join(','),
        SortOrder: sortOrder,
        Filters: onlyUnplayed ? 'IsUnplayed' : undefined,
        Years: year,
        Tags: tags?.join(','),
        ...Object.fromEntries(baseParams.entries()),
      },
    );
    const data = await parseItemsWithCount(res);
    return { data };
  }

  async getSeasonsBySeries({ seriesId, userId }: { seriesId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }> {
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[] }>(`/Users/${userId}/Items`, {
      UserId: userId,
      ParentId: seriesId,
      IncludeItemTypes: 'Season',
      Recursive: false,
      SortBy: 'IndexNumber',
      SortOrder: 'Ascending',
      Fields: 'PrimaryImageAspectRatio',
      ImageTypeLimit: 1,
      EnableImageTypes: 'Primary,Backdrop,Thumb',
    });
    const items = await parseItems(res);
    return { data: { Items: items } };
  }

  async getEpisodesBySeason({ seasonId, userId }: { seasonId: string; userId: string }): Promise<{
    data: { Items?: MediaItem[] };
  }> {
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[] }>(`/Users/${userId}/Items`, {
      UserId: userId,
      ParentId: seasonId,
      IncludeItemTypes: 'Episode',
      Fields: 'ItemCounts,PrimaryImageAspectRatio,CanDelete,MediaSourceCount,Overview',
    });
    const items = await parseItems(res);
    return { data: { Items: items } };
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
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[] }>(
      `/Items/${itemId}/Similar`,
      {
        Limit: limit,
        UserId: userId,
        IncludeItemTypes: 'Series',
        Fields: 'PrimaryImageAspectRatio',
      },
    );
    const items = await parseItems(res);
    return { data: { Items: items } };
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
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[] }>(
      `/Items/${itemId}/Similar`,
      {
        Limit: limit,
        UserId: userId,
        IncludeItemTypes: 'Movie',
        Fields: 'PrimaryImageAspectRatio',
      },
    );
    const items = await parseItems(res);
    return { data: { Items: items } };
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
    const res = await getEmbyApiClient().get<{ Items?: BaseItemDto[] }>(`/Users/${userId}/Items`, {
      UserId: userId,
      Recursive: true,
      SearchTerm: searchTerm,
      SortBy: 'SortName',
      SortOrder: 'Ascending',
      Fields: 'PrimaryImageAspectRatio',
      ImageTypeLimit: 1,
      EnableImageTypes: 'Primary,Backdrop,Thumb',
      Limit: limit,
      IncludeItemTypes: includeItemTypes?.join(','),
    });
    return await parseItems(res);
  }

  async getRecommendedSearchKeywords({
    userId,
    limit,
  }: {
    userId: string;
    limit?: number;
  }): Promise<string[]> {
    const res = await getEmbyApiClient().get<{ Items?: { Name?: string }[] }>(
      `/Users/${userId}/Items`,
      {
        UserId: userId,
        Recursive: true,
        IncludeItemTypes: 'Movie,Series,MusicArtist',
        SortBy: 'IsFavoriteOrLiked,Random',
        ImageTypeLimit: 0,
        EnableTotalRecordCount: false,
        EnableImages: false,
        Limit: limit,
      },
    );
    const data = res.data;
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
    const res = await getEmbyApiClient().get<EmbyFiltersResponse>(`/Items/Filters`, {
      UserId: userId,
      ParentId: parentId,
    });
    const d = res.data;
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
    const baseItemCandidate = getUnderlyingRaw(item);

    if (!isBaseItemDto(baseItemCandidate)) {
      return { url: undefined, blurhash: undefined };
    }

    const itemData = baseItemCandidate;
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

    const blurhash = getBlurHash(itemData, imageType);

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
    deviceProfile: any;
    audioStreamIndex?: number;
    subtitleStreamIndex?: number;
    height?: number;
    mediaSourceId?: string | null;
    deviceId?: string | null;
  }): Promise<StreamInfo | null> {
    const api = ensureApi();
    const rawCandidate = (item as MediaItem | null | undefined)?.raw ?? null;
    const baseItem = isBaseItemDto(rawCandidate) ? rawCandidate : null;
    if (!userId || !baseItem?.Id) return null;

    const res = await getEmbyApiClient().post(`/Items/${baseItem.Id}/PlaybackInfo`, {
      UserId: userId,
      DeviceProfile: deviceProfile,
      SubtitleStreamIndex: subtitleStreamIndex,
      StartTimeTicks: startTimeTicks,
      IsPlayback: true,
      AutoOpenLiveStream: true,
      MaxStreamingBitrate: maxStreamingBitrate,
      AudioStreamIndex: audioStreamIndex,
      MediaSourceId: mediaSourceId,
    });
    const playback = res.data as {
      PlaySessionId?: string;
      MediaSources?: { Id?: string; TranscodingUrl?: string }[];
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
    await getEmbyApiClient().post(`/Users/${userId}/FavoriteItems/${itemId}`);
  }

  async removeFavoriteItem({ userId, itemId }: { userId: string; itemId: string }): Promise<void> {
    await getEmbyApiClient().delete(`/Users/${userId}/FavoriteItems/${itemId}`);
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
    const qs = new URLSearchParams();
    if (datePlayed) qs.set('DatePlayed', datePlayed);
    await getEmbyApiClient().post(`/Users/${userId}/PlayedItems/${itemId}?${qs.toString()}`);
  }

  async markItemUnplayed({ userId, itemId }: { userId: string; itemId: string }): Promise<void> {
    await getEmbyApiClient().delete(`/Users/${userId}/PlayedItems/${itemId}`);
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
    await getEmbyApiClient().post(`/Sessions/Playing/Progress`, {
      ItemId: itemId,
      PositionTicks: Math.floor(positionTicks * 10000),
      IsPaused: isPaused ?? false,
      CanSeek: true,
      PlaybackStartTimeTicks: Date.now() * 10000,
    });
  }

  async reportPlaybackStart({
    itemId,
    positionTicks,
  }: {
    itemId: string;
    positionTicks?: number;
  }): Promise<void> {
    await getEmbyApiClient().post(`/Sessions/Playing`, {
      ItemId: itemId,
      PositionTicks: Math.floor((positionTicks ?? 0) * 10000),
      CanSeek: true,
      PlaybackStartTimeTicks: Date.now() * 10000,
    });
  }

  async reportPlaybackStop({
    itemId,
    positionTicks,
  }: {
    itemId: string;
    positionTicks: number;
  }): Promise<void> {
    await getEmbyApiClient().post(`/Sessions/Playing/Stopped`, {
      ItemId: itemId,
      PositionTicks: Math.floor(positionTicks * 10000),
    });
  }
}

export const embyAdapter = new EmbyAdapter();
