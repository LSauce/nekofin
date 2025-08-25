import { BottomSheetBackdropModal } from '@/components/BottomSheetBackdropModal';
import { Section } from '@/components/media/Section';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaServerInfo, useMediaServers } from '@/lib/contexts/MediaServerContext';
import {
  createApiFromServerInfo,
  getLatestItemsByFolder,
  getMediaFolders,
  getNextUpItems,
  getResumeItems,
  getUserView,
} from '@/services/jellyfin';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useRef } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const BottomSheetModalRef = useRef<BottomSheetModal>(null);
  const bottomTabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const { servers, currentServer, setCurrentServer, refreshServerInfo } = useMediaServers();

  const api = useMemo(() => {
    if (!currentServer) return null;
    return createApiFromServerInfo(currentServer);
  }, [currentServer]);

  const router = useRouter();

  const { data: mediaFolders } = useQuery({
    queryKey: ['mediaFolders', currentServer?.id],
    queryFn: async () => {
      if (!currentServer) return [];
      const response = await getMediaFolders(api!);
      const items = response.data.Items || [];
      return items.filter((item) => item.CollectionType !== 'playlists');
    },
    enabled: !!currentServer,
  });

  const { data: latestItemsByFolders, isLoading: isLoadingLatestItemsByFolders } = useQuery({
    queryKey: ['latestItemsByFolders', currentServer?.id, mediaFolders],
    queryFn: async () => {
      if (!currentServer || !mediaFolders || mediaFolders.length === 0) return {};
      const results: Record<string, BaseItemDto[]> = {};
      for (const folder of mediaFolders) {
        if (folder.Id) {
          try {
            const response = await getLatestItemsByFolder(
              api!,
              currentServer.userId,
              folder.Id,
              16,
            );
            results[folder.Id] = response.data || [];
          } catch (error) {
            console.error(`Failed to get latestItems for folder ${folder.Id}:`, error);
            results[folder.Id] = [];
          }
        }
      }
      return results;
    },
    enabled: !!currentServer && !!mediaFolders && mediaFolders.length > 0,
  });

  const { data: nextUpItems, isLoading: isLoadingNextUp } = useQuery({
    queryKey: ['nextUpItems', currentServer?.id],
    queryFn: async () => {
      if (!currentServer) return [];
      const response = await getNextUpItems(api!, currentServer.userId);
      return response.data.Items || [];
    },
    enabled: !!currentServer,
  });

  const { data: resumeItems, isLoading: isLoadingResume } = useQuery({
    queryKey: ['resumeItems', currentServer?.id],
    queryFn: async () => {
      if (!currentServer) return [];
      const response = await getResumeItems(api!, currentServer.userId);
      return response.data.Items || [];
    },
    enabled: !!currentServer,
  });

  const { data: userView } = useQuery({
    queryKey: ['userView', currentServer?.id],
    queryFn: async () => {
      if (!currentServer) return [];
      const response = await getUserView(api!, currentServer.userId);
      return response.data.Items || [];
    },
  });

  if (servers.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          backgroundColor: '#fff',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text>No servers found</Text>
        <TouchableOpacity onPress={() => router.push('/media')}>
          <Text>Add server</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleServerSelect = (serverId: string) => {
    setCurrentServer(servers.find((server) => server.id === serverId)!);
    BottomSheetModalRef.current?.dismiss();
    refreshServerInfo(serverId);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>首页</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => BottomSheetModalRef.current?.present()}
            style={styles.serverButton}
          >
            <Image
              source={{ uri: currentServer?.userAvatar }}
              style={styles.serverButtonAvatar}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingBottom: Platform.OS === 'ios' ? bottomTabBarHeight : 0 }}>
          <UserViewSection userView={userView || []} currentServer={currentServer} />
          <Section
            title="继续观看"
            onViewAll={() => router.push('/viewall/resume')}
            items={resumeItems || []}
            isLoading={isLoadingResume}
            currentServer={currentServer}
          />
          <Section
            title="接下来"
            onViewAll={() => router.push('/viewall/nextup')}
            items={nextUpItems || []}
            isLoading={isLoadingNextUp}
            currentServer={currentServer}
          />
          {mediaFolders?.map((folder) => {
            const folderLatestItems = latestItemsByFolders?.[folder.Id!] || [];
            return (
              <Section
                key={folder.Id}
                title={`最近添加的 ${folder.Name}`}
                onViewAll={() =>
                  router.push({
                    pathname: '/viewall/[type]',
                    params: {
                      folderId: folder.Id,
                      folderName: folder.Name,
                      type: 'latest',
                    },
                  })
                }
                items={folderLatestItems}
                isLoading={isLoadingLatestItemsByFolders}
                currentServer={currentServer}
                type="series"
              />
            );
          })}
        </View>
      </ScrollView>

      <BottomSheetBackdropModal ref={BottomSheetModalRef}>
        <BottomSheetView style={styles.serverListContainer}>
          <Text style={styles.serverListTitle}>选择服务器</Text>
          {servers.map((server) => (
            <TouchableOpacity
              key={server.id}
              style={[
                styles.serverItem,
                currentServer?.id === server.id && styles.currentServerItem,
              ]}
              onPress={() => handleServerSelect(server.id)}
            >
              <Text style={styles.serverItemText}>{server.name}</Text>
              <Text style={styles.serverItemAddress}>{server.address}</Text>
            </TouchableOpacity>
          ))}
        </BottomSheetView>
      </BottomSheetBackdropModal>
    </View>
  );
}

function UserViewSection({
  userView,
  currentServer,
}: {
  userView: BaseItemDto[];
  currentServer?: MediaServerInfo | null;
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const featuredItems = userView?.slice(0, 2) || [];

  if (featuredItems.length === 0) {
    return (
      <View style={styles.userViewSection}>
        <View style={styles.userViewContainer}>
          <UserViewCard title="暂无内容" imageUrl={null} />
          <UserViewCard title="暂无内容" imageUrl={null} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.userViewSection, { backgroundColor }]}>
      <View style={styles.userViewContainer}>
        {featuredItems.map((item, index) => (
          <UserViewCard
            item={item}
            key={item.Id || index}
            title={item.Name || '未知标题'}
            imageUrl={
              item.ImageTags?.Primary
                ? `${currentServer?.address}/Items/${item.Id}/Images/Primary?maxWidth=400`
                : null
            }
          />
        ))}
        {featuredItems.length === 1 && <UserViewCard title="暂无内容" imageUrl={null} />}
      </View>
    </View>
  );
}

function UserViewCard({
  item,
  title,
  imageUrl,
}: {
  item?: BaseItemDto;
  title: string;
  imageUrl: string | null;
  id?: string;
}) {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const { width } = useWindowDimensions();

  return (
    <TouchableOpacity
      style={[styles.userViewCard, { backgroundColor }]}
      onPress={() => {
        if (!item) return;
        router.push({
          pathname: '/folder/[id]',
          params: {
            id: item.Id!,
            name: title,
            itemTypes: item.CollectionType === 'movies' ? ['Movie'] : ['Series'],
          },
        });
      }}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.cover, { width: width * 0.5 }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.cover, { justifyContent: 'center', alignItems: 'center' }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={48} color="#ccc" />
        </View>
      )}
      <View style={styles.userViewInfo}>
        <Text style={[styles.userViewTitle, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  serverButton: {
    padding: 4,
    borderRadius: 64,
    backgroundColor: '#f2f2f2',
    overflow: 'hidden',
  },
  serverButtonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userViewSection: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  userViewContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  userViewCard: {
    overflow: 'hidden',
    backgroundColor: '#f7f7f7',
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  userViewDuration: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  userViewInfo: {
    padding: 8,
  },
  userViewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  userViewSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#eee',
    borderRadius: 12,
  },
  serverListContainer: {
    flex: 1,
    padding: 20,
  },
  serverListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000',
  },
  serverItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
    marginBottom: 8,
  },
  currentServerItem: {
    backgroundColor: '#e5e5ea',
  },
  serverItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  serverItemAddress: {
    fontSize: 14,
    color: '#666',
  },
});
