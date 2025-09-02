import { ItemGridScreen } from '@/components/media/ItemGridScreen';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { createApiFromServerInfo, getFavoriteItems } from '@/services/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useMemo } from 'react';

export default function FavoritesScreen() {
  const { currentServer } = useMediaServers();

  const api = useMemo(() => {
    if (!currentServer) return null;
    return createApiFromServerInfo(currentServer);
  }, [currentServer]);

  const loadItems = useMemo(() => {
    return async (): Promise<BaseItemDto[]> => {
      if (!api || !currentServer) return [];
      const res = await getFavoriteItems(api, currentServer.userId, 200);
      const data = res.data;
      return Array.isArray(data) ? data : (data?.Items ?? []);
    };
  }, [api, currentServer]);

  return <ItemGridScreen title="我的收藏" loadItems={loadItems} type="series" />;
}
