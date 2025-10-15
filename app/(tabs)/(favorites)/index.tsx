import { ItemGridScreen } from '@/components/media/ItemGridScreen';
import { useInfiniteQueryWithFocus } from '@/hooks/useInfiniteQueryWithFocus';
import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { useMediaFilters } from '@/hooks/useMediaFilters';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { MediaItem } from '@/services/media/types';

export default function FavoritesScreen() {
  const { currentServer } = useMediaServers();
  const mediaAdapter = useMediaAdapter();

  const PAGE_SIZE = 40;

  const { filters, setFilters } = useMediaFilters();

  const query = useInfiniteQueryWithFocus({
    refetchOnScreenFocus: true,
    enabled: !!currentServer,
    queryKey: ['favorites', currentServer?.id, filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!currentServer) return { items: [], total: 0 };
      const res = await mediaAdapter.getFavoriteItemsPaged({
        userId: currentServer.userId,
        startIndex: pageParam,
        limit: PAGE_SIZE,
        includeItemTypes: filters.includeItemTypes ?? [],
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        onlyUnplayed: filters.onlyUnplayed,
        year: filters.year,
        tags: filters.tags,
      });
      const items = res.data?.Items ?? [];
      const total = res.data?.TotalRecordCount ?? items.length;
      return { items, total };
    },
    getNextPageParam: (
      lastPage: { items: MediaItem[]; total: number },
      allPages: { items: MediaItem[]; total: number }[],
    ) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded >= lastPage.total || lastPage.items.length === 0 ? undefined : loaded;
    },
  });

  return (
    <ItemGridScreen
      title="我的收藏"
      query={query}
      type="series"
      filters={filters}
      onChangeFilters={setFilters}
    />
  );
}
