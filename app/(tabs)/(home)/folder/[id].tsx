import { ItemGridScreen } from '@/components/media/ItemGridScreen';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { getAllItemsByFolder } from '@/services/jellyfin';
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

export default function FolderScreen() {
  const { id, name, itemTypes } = useLocalSearchParams<{
    id: string;
    name?: string;
    itemTypes?: BaseItemKind;
  }>();

  const { currentServer, currentApi: api } = useMediaServers();

  const PAGE_SIZE = 60;

  const query = useInfiniteQuery({
    enabled: !!api && !!currentServer && !!id,
    queryKey: ['folder-items', currentServer?.id, id, itemTypes],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!api || !currentServer || !id) return { items: [], total: 0 };
      const response = await getAllItemsByFolder(
        api,
        currentServer.userId,
        id,
        pageParam,
        PAGE_SIZE,
        itemTypes ? [itemTypes] : [],
      );
      const items = response.data.Items || [];
      const total = response.data.TotalRecordCount ?? items.length;
      return { items: items as BaseItemDto[], total };
    },
    getNextPageParam: (
      lastPage: { items: BaseItemDto[]; total: number },
      allPages: { items: BaseItemDto[]; total: number }[],
    ) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded >= lastPage.total || lastPage.items.length === 0 ? undefined : loaded;
    },
  });

  return <ItemGridScreen title={name || '全部内容'} query={query} type="series" />;
}
