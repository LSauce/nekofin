import { BottomSheetBackdropModal } from '@/components/BottomSheetBackdropModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaServerInfo, useMediaServers } from '@/lib/contexts/MediaServerContext';
import {
  createApiFromServerInfo,
  getLatestItems,
  getLatestItemsByFolder,
  getMediaFolders,
  getNextUpItems,
  getResumeItems,
} from '@/services/jellyfin';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const BottomSheetModalRef = useRef<BottomSheetModal>(null);
  const bottomTabBarHeight = useBottomTabBarHeight();

  const { servers, currentServer, setCurrentServer, refreshServerInfo } = useMediaServers();
  const router = useRouter();

  const { data: latestItems, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['latestItems', currentServer?.id],
    queryFn: async () => {
      if (!currentServer) return [];
      const api = createApiFromServerInfo(currentServer);
      const response = await getLatestItems(api, currentServer.userId);
      return response.data.Items || [];
    },
    enabled: !!currentServer,
  });

  const { data: mediaFolders, isLoading: isLoadingFolders } = useQuery({
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
            <FeaturedSection mediaFolders={mediaFolders || []} currentServer={currentServer} />
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
            <Section
              title="最近新增"
              onViewAll={() => {}}
              items={latestItems || []}
              isLoading={isLoadingLatest}
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

function FeaturedSection({
  mediaFolders,
  currentServer,
}: {
  mediaFolders: BaseItemDto[];
  currentServer?: MediaServerInfo | null;
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const featuredItems = mediaFolders?.slice(0, 2) || [];

  if (featuredItems.length === 0) {
    return (
      <View style={styles.featuredSection}>
        <View style={styles.featuredContainer}>
          <FeaturedCard title="暂无内容" imageUrl={null} />
          <FeaturedCard title="暂无内容" imageUrl={null} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.featuredSection, { backgroundColor }]}>
      <View style={styles.featuredContainer}>
        {featuredItems.map((item, index) => (
          <FeaturedCard
            key={item.Id || index}
            title={item.Name || '未知标题'}
            imageUrl={
              item.ImageTags?.Primary
                ? `${currentServer?.address}/Items/${item.Id}/Images/Primary?maxWidth=400`
                : null
            }
          />
        ))}
        {featuredItems.length === 1 && <FeaturedCard title="暂无内容" imageUrl={null} />}
      </View>
    </View>
  );
}

function FeaturedCard({ title, imageUrl }: { title: string; imageUrl: string | null }) {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  return (
    <TouchableOpacity style={[styles.featuredCard, { backgroundColor }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.featuredImage} contentFit="cover" />
      ) : (
        <View style={[styles.featuredImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={48} color="#ccc" />
        </View>
      )}
      <View style={styles.featuredInfo}>
        <Text style={[styles.featuredTitle, { color: textColor }]} numberOfLines={1}>
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
  const width = Dimensions.get('window').width * 0.5;
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

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
    <TouchableOpacity style={[styles.card, { width, backgroundColor }]} onPress={handlePress}>
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
      <Text style={[styles.subtitle, { color: textColor }]} numberOfLines={1}>
        {getSubtitle()}
      </Text>
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
  featuredSection: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  featuredContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  featuredCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f7f7f7',
  },
  featuredImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#eee',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
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
  featuredDuration: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  featuredInfo: {
    padding: 8,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  featuredSubtitle: {
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
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    paddingBottom: 8,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#eee',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginHorizontal: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
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
