import { ItemGridScreen } from '@/components/media/ItemGridScreen';
import { useMediaFilters } from '@/hooks/useMediaFilters';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { getFavoriteItemsPaged } from '@/services/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useInfiniteQuery } from '@tanstack/react-query';

export default function FavoritesScreen() {
  const { currentServer, currentApi: api } = useMediaServers();

  const PAGE_SIZE = 40;

  const { filters, setFilters } = useMediaFilters();

  const query = useInfiniteQuery({
    enabled: !!api && !!currentServer,
    queryKey: ['favorites', currentServer?.id, filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!api || !currentServer) return { items: [], total: 0 };
      const res = await getFavoriteItemsPaged(api, currentServer.userId, pageParam, PAGE_SIZE, {
        includeItemTypes: filters.includeItemTypes,
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
      lastPage: { items: BaseItemDto[]; total: number },
      allPages: { items: BaseItemDto[]; total: number }[],
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
