import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import {
  getEpisodesBySeason,
  getItemDetail,
  getNextUpItemsByFolder,
  getSeasonsBySeries,
  getSimilarMovies,
  getSimilarShows,
} from '@/services/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';

import { useQueryWithFocus } from './useQueryWithFocus';

export type DetailBundle = {
  item: BaseItemDto;
  seasons?: BaseItemDto[];
  nextUpItems?: BaseItemDto[];
  episodes?: BaseItemDto[];
  similarShows?: BaseItemDto[];
  similarMovies?: BaseItemDto[];
} | null;

export function useDetailBundle(mode: 'series' | 'season' | 'movie' | 'episode', itemId: string) {
  const { currentServer, currentApi } = useMediaServers();

  const query = useQueryWithFocus<DetailBundle>({
    refetchOnScreenFocus: true,
    queryKey: ['detail-bundle', mode, itemId],
    queryFn: async () => {
      if (!currentApi || !itemId || !currentServer?.userId) return null;
      const userId = currentServer.userId;
      const itemRes = await getItemDetail(currentApi, itemId, userId);
      const baseItem = itemRes.data;

      if (mode === 'series') {
        const [seasonsRes, nextUpRes, similarShowsRes] = await Promise.all([
          getSeasonsBySeries(currentApi, itemId, userId),
          getNextUpItemsByFolder(currentApi, userId, itemId, 30),
          getSimilarShows(currentApi, itemId, userId, 30),
        ]);
        return {
          item: baseItem,
          seasons: seasonsRes.data.Items ?? [],
          nextUpItems: nextUpRes.data.Items ?? [],
          similarShows: similarShowsRes.data.Items ?? [],
        };
      }

      if (mode === 'season') {
        const episodesRes = await getEpisodesBySeason(currentApi, itemId, userId);
        return {
          item: baseItem,
          episodes: episodesRes.data.Items ?? [],
        };
      }

      if (mode === 'episode') {
        const seriesId = baseItem.SeriesId;
        const seasonId = baseItem.ParentId;

        const emptyItems = { data: { Items: [] } } as { data: { Items?: BaseItemDto[] } };

        const [similarMoviesRes, seasonsRes, episodesRes] = await Promise.all([
          getSimilarMovies(currentApi, itemId, userId, 30),
          seriesId ? getSeasonsBySeries(currentApi, seriesId, userId) : Promise.resolve(emptyItems),
          seasonId
            ? getEpisodesBySeason(currentApi, seasonId, userId)
            : Promise.resolve(emptyItems),
        ]);

        return {
          item: baseItem,
          seasons: seasonsRes.data.Items ?? [],
          episodes: episodesRes.data.Items ?? [],
          similarMovies: similarMoviesRes.data.Items ?? [],
        };
      }

      const similarMoviesRes = await getSimilarMovies(currentApi, itemId, userId, 30);
      return {
        item: baseItem,
        similarMovies: similarMoviesRes.data.Items ?? [],
      };
    },
    enabled: !!currentApi && !!itemId && !!currentServer?.userId,
  });

  return query;
}
