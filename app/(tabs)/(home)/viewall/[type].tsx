import { ItemGridScreen } from '@/components/media/ItemGridScreen';
import { useMediaFilters } from '@/hooks/useMediaFilters';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import {
  getLatestItems,
  getLatestItemsByFolder,
  getNextUpItems,
  getResumeItems,
} from '@/services/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

export default function ViewAllScreen() {
  const { type, folderId, folderName } = useLocalSearchParams<{
    type: string;
    folderId?: string;
    folderName?: string;
  }>();
  const { currentServer, currentApi: api } = useMediaServers();
  const { filters, setFilters } = useMediaFilters();

  const getTitle = () => {
    switch (type) {
      case 'resume':
        return '继续观看';
      case 'nextup':
        return '接下来';
      case 'latest':
        return folderName ? `最近添加的 ${folderName}` : '最新内容';
      default:
        return '查看所有';
    }
  };

  const getItemType = () => {
    switch (type) {
      case 'latest':
        return 'series';
      default:
        return 'episode';
    }
  };

  const PAGE_SIZE = 40;

  const query = useInfiniteQuery({
    enabled: !!api && !!currentServer,
    queryKey: ['viewall', type, currentServer?.id, folderId, filters],
    initialPageParam: 0,
    queryFn: async () => {
      if (!api || !currentServer) return { items: [], total: 0 };
      switch (type) {
        case 'resume': {
          const res = await getResumeItems(api, currentServer.userId, PAGE_SIZE);
          const d = res.data;
          const items = (Array.isArray(d) ? d : d?.Items) ?? [];
          const total = d?.TotalRecordCount ?? items.length;
          return { items: items, total };
        }
        case 'nextup': {
          const res = await getNextUpItems(api, currentServer.userId, PAGE_SIZE);
          const d = res.data;
          const items = (Array.isArray(d) ? d : d?.Items) ?? [];
          const total = d?.TotalRecordCount ?? items.length;
          return { items: items, total };
        }
        case 'latest': {
          if (folderId) {
            const res = await getLatestItemsByFolder(
              api,
              currentServer.userId,
              folderId,
              PAGE_SIZE,
            );
            const items = res.data;
            const total = items.length;
            return { items, total };
          }
          const res = await getLatestItems(api, currentServer.userId, PAGE_SIZE, {
            includeItemTypes: filters.includeItemTypes,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            year: filters.year,
            tags: filters.tags,
          });
          const d = res.data;
          const items = (Array.isArray(d) ? d : d?.Items) ?? [];
          const total = d?.TotalRecordCount ?? items.length;
          return { items, total };
        }
        default:
          return { items: [], total: 0 };
      }
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
      title={getTitle()}
      query={query}
      type={getItemType()}
      filters={filters}
      onChangeFilters={setFilters}
    />
  );
}
