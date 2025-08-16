import { BottomSheetBackdropModal } from '@/components/BottomSheetBackdropModal';
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
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const BottomSheetModalRef = useRef<BottomSheetModal>(null);
  const bottomTabBarHeight = useBottomTabBarHeight();

  const { servers, currentServer, setCurrentServer, refreshServerInfo } = useMediaServers();
  const router = useRouter();

  const { data: mediaFolders } = useQuery({
    queryKey: ['mediaFolders', currentServer?.id],
    queryFn: async () => {
      if (!currentServer) return [];
      const api = createApiFromServerInfo(currentServer);
      const response = await getMediaFolders(api);
      const items = response.data.Items || [];
      return items.filter((item) => item.CollectionType !== 'playlists');
    },
    enabled: !!currentServer,
  });

  const { data: latestItemsByFolders, isLoading: isLoadingLatestItemsByFolders } = useQuery({
    queryKey: ['latestItemsByFolders', currentServer?.id, mediaFolders],
    queryFn: async () => {
      if (!currentServer || !mediaFolders || mediaFolders.length === 0) return {};
      const api = createApiFromServerInfo(currentServer);
      const results: Record<string, BaseItemDto[]> = {};
      for (const folder of mediaFolders) {
        if (folder.Id) {
          try {
            const response = await getLatestItemsByFolder(api, currentServer.userId, folder.Id, 5);
            results[folder.Id] = response.data.Items || [];
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
      const api = createApiFromServerInfo(currentServer);
      const response = await getNextUpItems(api, currentServer.userId);
      return response.data.Items || [];
    },
    enabled: !!currentServer,
  });

  const { data: resumeItems, isLoading: isLoadingResume } = useQuery({
    queryKey: ['resumeItems', currentServer?.id],
    queryFn: async () => {
      if (!currentServer) return [];
      const api = createApiFromServerInfo(currentServer);
      const response = await getResumeItems(api, currentServer.userId);
      return response.data.Items || [];
    },
    enabled: !!currentServer,
  });

  const { data: userView, isLoading: isLoadingUserView } = useQuery({
    queryKey: ['userView', currentServer?.id],
    queryFn: async () => {
      if (!currentServer) return [];
      const api = createApiFromServerInfo(currentServer);
      const response = await getUserView(api, currentServer.userId);
      return response.data.Items || [];
    },
  });

  if (servers.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}
      >
        <Text>No servers found</Text>
        <TouchableOpacity onPress={() => router.push('/media')}>
          <Text>Add server</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleServerSelect = (serverId: string) => {
    setCurrentServer(servers.find((server) => server.id === serverId)!);
    BottomSheetModalRef.current?.dismiss();
    refreshServerInfo(serverId);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <View style={styles.header}>
        <Text style={styles.title}>首页</Text>
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

      <FlatList
        data={[]}
        showsVerticalScrollIndicator={false}
        renderItem={() => null}
        contentContainerStyle={{ paddingBottom: bottomTabBarHeight }}
        ListHeaderComponent={() => (
          <View>
            <UserViewSection userView={userView || []} currentServer={currentServer} />
            <Section
              title="继续观看"
              onViewAll={() => {}}
              items={resumeItems || []}
              isLoading={isLoadingResume}
              currentServer={currentServer}
            />
            <Section
              title="接下来"
              onViewAll={() => {}}
              items={nextUpItems || []}
              isLoading={isLoadingNextUp}
              currentServer={currentServer}
            />
            {mediaFolders?.map((folder) => {
              const folderLatestItems = latestItemsByFolders?.[folder.Id!] || [];
              return (
                <Section
                  key={folder.Id}
                  title={`${folder.Name} - 最近新增`}
                  onViewAll={() => {}}
                  items={folderLatestItems}
                  isLoading={isLoadingLatestItemsByFolders}
                  currentServer={currentServer}
                />
              );
            })}
          </View>
        )}
      />

      <BottomSheetBackdropModal ref={BottomSheetModalRef} backgroundStyle={{ backgroundColor }}>
        <BottomSheetView style={[styles.serverListContainer, { backgroundColor }]}>
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
    </SafeAreaView>
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

function UserViewCard({ title, imageUrl }: { title: string; imageUrl: string | null }) {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const { width } = useWindowDimensions();

  return (
    <TouchableOpacity style={[styles.userViewCard, { backgroundColor }]}>
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

function Section({
  title,
  onViewAll,
  items,
  isLoading,
  currentServer,
}: {
  title: string;
  onViewAll: () => void;
  items: BaseItemDto[];
  isLoading: boolean;
  currentServer?: MediaServerInfo | null;
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>查看所有 {'>'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>查看所有 {'>'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无内容</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, { backgroundColor }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>查看所有 {'>'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sectionList}
        contentContainerStyle={styles.sectionListContent}
        renderItem={({ item }) => (
          <MediaCard item={item} onPress={() => {}} currentServer={currentServer} />
        )}
        keyExtractor={(item) => item.Id!}
      />
    </View>
  );
}

function MediaCard({
  item,
  onPress,
  currentServer,
}: {
  item: BaseItemDto;
  onPress?: () => void;
  currentServer?: MediaServerInfo | null;
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const router = useRouter();
  const { width } = useWindowDimensions();
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');

  const imageUrl = useMemo(() => {
    if (item.Type === 'Episode') {
      if (item.ParentThumbItemId) {
        return `${currentServer?.address}/Items/${item.ParentThumbItemId}/Images/Thumb?maxWidth=300`;
      }
      return `${currentServer?.address}/Items/${item.SeriesId}/Images/Backdrop?maxWidth=300`;
    }
    return `${currentServer?.address}/Items/${item.Id}/Images/Backdrop?maxWidth=300`;
  }, [item, currentServer]);

  const getSubtitle = () => {
    if (item.Type === 'Episode') {
      return `S${item.ParentIndexNumber}E${item.IndexNumber} - ${item.Name}`;
    }
    if (item.Type === 'Movie') {
      return item.ProductionYear;
    }
    return item.Name;
  };

  const handlePress = async () => {
    if (!currentServer || !item.Id) return;

    router.push({
      pathname: '/media/player',
      params: {
        itemId: item.Id,
      },
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: width * 0.5, backgroundColor }]}
      onPress={handlePress}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, { justifyContent: 'center', alignItems: 'center' }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={48} color="#ccc" />
        </View>
      )}
      <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
        {item.SeriesName || item.Name || '未知标题'}
      </Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
        {getSubtitle()}
      </Text>
    </TouchableOpacity>
  );
}

function SeriesCard({
  item,
  onPress,
  currentServer,
}: {
  item: BaseItemDto;
  onPress: () => void;
  currentServer: MediaServerInfo | null;
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const { width } = useWindowDimensions();

  return (
    <TouchableOpacity style={[styles.card, { width: width * 0.5, backgroundColor }]}>
      <Text>{item.Name}</Text>
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
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#9C4DFF',
    fontSize: 16,
  },
  sectionList: {
    marginLeft: 20,
  },
  sectionListContent: {
    paddingRight: 20,
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  card: {
    marginRight: 16,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#eee',
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'semibold',
    marginTop: 8,
    marginHorizontal: 8,
  },
  subtitle: {
    fontSize: 13,
    marginHorizontal: 8,
    marginTop: 2,
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
  },
  serverItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
    marginBottom: 8,
  },
  currentServerItem: {
    backgroundColor: '#9C4DFF',
  },
  serverItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serverItemAddress: {
    fontSize: 14,
    color: '#888',
  },
});
