import { BottomSheetBackdropModal } from '@/components/BottomSheetBackdropModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
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
import { useMemo, useRef, useState } from 'react';
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
  const BottomSheetModalRef = useRef<BottomSheetModal>(null);
  const bottomTabBarHeight = useBottomTabBarHeight();

  const { servers, getServer, currentServer } = useMediaServers();
  const router = useRouter();
  const [activeServerId, setActiveServerId] = useState<string | null>(
    servers.length > 0 ? servers[0].id : null,
  );

  const activeServer = activeServerId ? getServer(activeServerId) : currentServer;

  const { data: latestItems, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['latestItems', activeServerId],
    queryFn: async () => {
      if (!activeServer) return [];
      const api = createApiFromServerInfo(activeServer);
      const response = await getLatestItems(api, activeServer.userId);
      return response.data.Items || [];
    },
    enabled: !!activeServer,
  });

  const { data: mediaFolders, isLoading: isLoadingFolders } = useQuery({
    queryKey: ['mediaFolders', activeServerId],
    queryFn: async () => {
      if (!activeServer) return [];
      const api = createApiFromServerInfo(activeServer);
      const response = await getMediaFolders(api);
      const items = response.data.Items || [];
      return items.filter((item) => item.CollectionType !== 'playlists');
    },
    enabled: !!activeServer,
  });

  const { data: latestItemsByFolders, isLoading: isLoadingLatestItemsByFolders } = useQuery({
    queryKey: ['latestItemsByFolders', activeServerId, mediaFolders],
    queryFn: async () => {
      if (!activeServer || !mediaFolders || mediaFolders.length === 0) return {};
      const api = createApiFromServerInfo(activeServer);
      const results: Record<string, BaseItemDto[]> = {};
      for (const folder of mediaFolders) {
        if (folder.Id) {
          try {
            const response = await getLatestItemsByFolder(api, activeServer.userId, folder.Id, 5);
            results[folder.Id] = response.data.Items || [];
          } catch (error) {
            console.error(`Failed to get latestItems for folder ${folder.Id}:`, error);
            results[folder.Id] = [];
          }
        }
      }
      return results;
    },
    enabled: !!activeServer && !!mediaFolders && mediaFolders.length > 0,
  });

  const { data: nextUpItems, isLoading: isLoadingNextUp } = useQuery({
    queryKey: ['nextUpItems', activeServerId],
    queryFn: async () => {
      if (!activeServer) return [];
      const api = createApiFromServerInfo(activeServer);
      const response = await getNextUpItems(api, activeServer.userId);
      return response.data.Items || [];
    },
    enabled: !!activeServer,
  });

  const { data: resumeItems, isLoading: isLoadingResume } = useQuery({
    queryKey: ['resumeItems', activeServerId],
    queryFn: async () => {
      if (!activeServer) return [];
      const api = createApiFromServerInfo(activeServer);
      const response = await getResumeItems(api, activeServer.userId);
      return response.data.Items || [];
    },
    enabled: !!activeServer,
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
    setActiveServerId(serverId);
    BottomSheetModalRef.current?.dismiss();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <Text style={styles.title}>首页</Text>
        <TouchableOpacity
          onPress={() => BottomSheetModalRef.current?.present()}
          style={styles.serverButton}
        >
          <Image
            source={{ uri: activeServer?.userAvatar }}
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
            <FeaturedSection mediaFolders={mediaFolders || []} activeServer={activeServer} />
            <Section
              title="继续观看"
              onViewAll={() => {}}
              items={resumeItems || []}
              isLoading={isLoadingResume}
              activeServer={activeServer}
            />
            <Section
              title="接下来"
              onViewAll={() => {}}
              items={nextUpItems || []}
              isLoading={isLoadingNextUp}
              activeServer={activeServer}
            />
            <Section
              title="最近新增"
              onViewAll={() => {}}
              items={latestItems || []}
              isLoading={isLoadingLatest}
              activeServer={activeServer}
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
                  activeServer={activeServer}
                />
              );
            })}
          </View>
        )}
      />

      <BottomSheetBackdropModal ref={BottomSheetModalRef}>
        <BottomSheetView style={styles.serverListContainer}>
          <Text style={styles.serverListTitle}>选择服务器</Text>
          {servers.map((server) => (
            <TouchableOpacity
              key={server.id}
              style={[styles.serverItem, activeServerId === server.id && styles.activeServerItem]}
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
  activeServer,
}: {
  mediaFolders: BaseItemDto[];
  activeServer?: MediaServerInfo | null;
}) {
  const featuredItems = mediaFolders?.slice(0, 2) || [];

  if (featuredItems.length === 0) {
    return (
      <View style={styles.featuredSection}>
        <View style={styles.featuredContainer}>
          <FeaturedCard
            title="暂无内容"
            subtitle="请选择服务器"
            duration="0分钟"
            progress={0}
            imageUrl={null}
          />
          <FeaturedCard
            title="暂无内容"
            subtitle="请选择服务器"
            duration="0分钟"
            progress={0}
            imageUrl={null}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.featuredSection}>
      <View style={styles.featuredContainer}>
        {featuredItems.map((item, index) => (
          <FeaturedCard
            key={item.Id || index}
            title={item.Name || '未知标题'}
            subtitle={item.CollectionType || '未知类型'}
            duration={`${Math.floor((item.RunTimeTicks || 0) / 600000000)}分钟`}
            progress={0}
            imageUrl={
              item.ImageTags?.Primary
                ? `${activeServer?.address}Items/${item.Id}/Images/Primary?maxWidth=400`
                : null
            }
          />
        ))}
        {featuredItems.length === 1 && (
          <FeaturedCard
            title="暂无内容"
            subtitle="请选择服务器"
            duration="0分钟"
            progress={0}
            imageUrl={null}
          />
        )}
      </View>
    </View>
  );
}

function FeaturedCard({
  title,
  subtitle,
  duration,
  progress,
  imageUrl,
}: {
  title: string;
  subtitle: string;
  duration: string;
  progress: number;
  imageUrl: string | null;
}) {
  return (
    <TouchableOpacity style={styles.featuredCard}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.featuredImage} contentFit="cover" />
      ) : (
        <View style={[styles.featuredImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={48} color="#ccc" />
        </View>
      )}
      <View style={styles.featuredOverlay}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.featuredDuration}>{duration}</Text>
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.featuredSubtitle} numberOfLines={1}>
          {subtitle}
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
  activeServer,
}: {
  title: string;
  onViewAll: () => void;
  items: BaseItemDto[];
  isLoading: boolean;
  activeServer?: MediaServerInfo | null;
}) {
  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
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
          <Text style={styles.sectionTitle}>{title}</Text>
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
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
          <MediaCard item={item} onPress={() => {}} activeServer={activeServer} />
        )}
        keyExtractor={(item) => item.Id!}
      />
    </View>
  );
}

function MediaCard({
  item,
  onPress,
  activeServer,
}: {
  item: BaseItemDto;
  onPress?: () => void;
  activeServer?: MediaServerInfo | null;
}) {
  const width = Dimensions.get('window').width * 0.5;

  const imageUrl = useMemo(() => {
    if (item.Type === 'Episode') {
      if (item.ParentThumbItemId) {
        return `${activeServer?.address}Items/${item.ParentThumbItemId}/Images/Thumb?maxWidth=300`;
      }
      return `${activeServer?.address}Items/${item.SeriesId}/Images/Backdrop?maxWidth=300`;
    }
    return `${activeServer?.address}Items/${item.Id}/Images/Backdrop?maxWidth=300`;
  }, [item, activeServer]);

  const getSubtitle = () => {
    if (item.Type === 'Episode') {
      return `S${item.ParentIndexNumber}E${item.IndexNumber} - ${item.Name}`;
    }
    if (item.Type === 'Movie') {
      return item.ProductionYear;
    }
    return item.Name;
  };

  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={onPress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.cover} contentFit="cover" />
      ) : (
        <View style={[styles.cover, { justifyContent: 'center', alignItems: 'center' }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={48} color="#ccc" />
        </View>
      )}
      <Text style={styles.cardTitle} numberOfLines={1}>
        {item.SeriesName || item.Name || '未知标题'}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
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
  activeServerItem: {
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
