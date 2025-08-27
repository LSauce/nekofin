import { ItemGridScreen } from '@/components/media/ItemGridScreen';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import {
  createApiFromServerInfo,
  getLatestItems,
  getLatestItemsByFolder,
  getNextUpItems,
  getResumeItems,
} from '@/services/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

export default function ViewAllScreen() {
  const { type, folderId, folderName } = useLocalSearchParams<{
    type: string;
    folderId?: string;
    folderName?: string;
  }>();
  const { currentServer } = useMediaServers();

  const api = useMemo(() => {
    if (!currentServer) return null;
    return createApiFromServerInfo(currentServer);
  }, [currentServer]);

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

  const loadItems = useMemo(() => {
    return async (): Promise<BaseItemDto[]> => {
      if (!api || !currentServer) return [];
      let response;
      switch (type) {
        case 'resume':
          response = await getResumeItems(api, currentServer.userId, 100);
          break;
        case 'nextup':
          response = await getNextUpItems(api, currentServer.userId, 100);
          break;
        case 'latest':
          if (folderId) {
            response = await getLatestItemsByFolder(api, currentServer.userId, folderId, 100);
          } else {
            response = await getLatestItems(api, currentServer.userId, 100);
          }
          break;
        default:
          throw new Error('Unknown type');
      }
      const data = response.data;
      return Array.isArray(data) ? data : (data?.Items ?? []);
    };
  }, [api, currentServer, type, folderId]);

  return <ItemGridScreen title={getTitle()} loadItems={loadItems} type={getItemType()} />;
}
