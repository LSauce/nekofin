import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { MediaItem } from '@/services/media/types';

import { useMediaAdapter } from './useMediaAdapter';
import { useQueryWithFocus } from './useQueryWithFocus';

export type DetailBundle = {
  item: MediaItem;
  seasons?: MediaItem[];
  nextUpItems?: MediaItem[];
  episodes?: MediaItem[];
  similarShows?: MediaItem[];
  similarMovies?: MediaItem[];
} | null;

export function useDetailBundle(mode: 'series' | 'season' | 'movie' | 'episode', itemId: string) {
  const { currentServer } = useMediaServers();
  const mediaAdapter = useMediaAdapter();

  const query = useQueryWithFocus<DetailBundle>({
    refetchOnScreenFocus: true,
    queryKey: ['detail-bundle', mode, itemId],
    queryFn: async () => {
      if (!itemId || !currentServer?.userId) return null;
      const userId = currentServer.userId;
      const itemRes = await mediaAdapter.getItemDetail(itemId, userId);
      const baseItem = itemRes;

      if (mode === 'series') {
        const [seasonsRes, nextUpRes, similarShowsRes] = await Promise.all([
          mediaAdapter.getSeasonsBySeries(itemId, userId),
          mediaAdapter.getNextUpItemsByFolder(userId, itemId, 30),
          mediaAdapter.getSimilarShows(itemId, userId, 30),
        ]);
        return {
          item: baseItem,
          seasons: seasonsRes.data.Items ?? [],
          nextUpItems: nextUpRes.data.Items ?? [],
          similarShows: similarShowsRes.data.Items ?? [],
        };
      }

      if (mode === 'season') {
        const episodesRes = await mediaAdapter.getEpisodesBySeason(itemId, userId);
        return {
          item: baseItem,
          episodes: episodesRes.data.Items ?? [],
        };
      }

      if (mode === 'episode') {
        const seriesId = baseItem.seriesId;
        const seasonId = baseItem.parentId;

        const emptyItems = { data: { Items: [] } } as { data: { Items?: MediaItem[] } };

        const [similarMoviesRes, seasonsRes, episodesRes] = await Promise.all([
          mediaAdapter.getSimilarMovies(itemId, userId, 30),
          seriesId
            ? mediaAdapter.getSeasonsBySeries(seriesId, userId)
            : Promise.resolve(emptyItems),
          seasonId
            ? mediaAdapter.getEpisodesBySeason(seasonId, userId)
            : Promise.resolve(emptyItems),
        ]);

        return {
          item: baseItem,
          seasons: seasonsRes.data.Items ?? [],
          episodes: episodesRes.data.Items ?? [],
          similarMovies: similarMoviesRes.data.Items ?? [],
        };
      }

      const similarMoviesRes = await mediaAdapter.getSimilarMovies(itemId, userId, 30);
      return {
        item: baseItem,
        similarMovies: similarMoviesRes.data.Items ?? [],
      };
    },
    enabled: !!itemId && !!currentServer?.userId,
  });

  return query;
}
