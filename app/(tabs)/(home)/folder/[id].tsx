import { ItemGridScreen } from '@/components/media/ItemGridScreen';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { createApiFromServerInfo, getAllItemsByFolder } from '@/services/jellyfin';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

export default function FolderScreen() {
  const { id, name, itemTypes } = useLocalSearchParams<{
    id: string;
    name?: string;
    itemTypes?: BaseItemKind[];
  }>();
  const { currentServer } = useMediaServers();

  const api = useMemo(() => {
    if (!currentServer) return null;
    return createApiFromServerInfo(currentServer);
  }, [currentServer]);

  const loadItems = useMemo(() => {
    return async () => {
      if (!api || !currentServer || !id) return [];
      const response = await getAllItemsByFolder(
        api,
        currentServer.userId,
        id as string,
        200,
        itemTypes,
      );
      return response.data.Items || [];
    };
  }, [api, currentServer, id, itemTypes]);

  return <ItemGridScreen title={name || '全部内容'} loadItems={loadItems} type="series" />;
}
