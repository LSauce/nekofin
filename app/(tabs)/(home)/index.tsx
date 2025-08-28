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
import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useRef } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeSection = {
  key: string;
  title: string;
  items: BaseItemDto[];
  type?: 'latest' | 'nextup' | 'resume' | 'userview';
};

function useHomeSections(currentServer: MediaServerInfo | null) {
  const api = useMemo(() => {
    if (!currentServer) return null;
    return createApiFromServerInfo(currentServer);
  }, [currentServer]);

  const query = useQuery({
    queryKey: ['homeSections', currentServer?.id],
    queryFn: async (): Promise<HomeSection[]> => {
      if (!currentServer || !api) return [];

      const [userViewRes, nextUpRes, resumeRes, foldersRes] = await Promise.all([
        getUserView(api, currentServer.userId),
        getNextUpItems(api, currentServer.userId),
        getResumeItems(api, currentServer.userId),
        getMediaFolders(api),
      ]);

      const mediaFolders = (foldersRes.data.Items || []).filter(
        (f) => f.CollectionType !== 'playlists',
      );

      const latestByFolder: { folderId: string; items: BaseItemDto[]; name: string }[] = [];
      for (const folder of mediaFolders) {
        if (!folder.Id) continue;
        try {
          const latest = await getLatestItemsByFolder(api, currentServer.userId, folder.Id, 16);
          latestByFolder.push({
            folderId: folder.Id,
            items: latest.data || [],
            name: folder.Name || '',
          });
        } catch (e) {
          latestByFolder.push({ folderId: folder.Id, items: [], name: folder.Name || '' });
        }
      }

      const sections: HomeSection[] = [];
      sections.push({
        key: 'userview',
        title: '用户视图',
        items: userViewRes.data.Items || [],
        type: 'userview',
      });
      sections.push({
        key: 'resume',
        title: '继续观看',
        items: resumeRes.data.Items || [],
        type: 'resume',
      });
      sections.push({
        key: 'nextup',
        title: '接下来',
        items: nextUpRes.data.Items || [],
        type: 'nextup',
      });
      for (const f of latestByFolder) {
        sections.push({
          key: `latest_${f.folderId}`,
          title: `最近添加的 ${f.name}`,
          items: f.items,
          type: 'latest',
        });
      }
      return sections;
    },
    enabled: !!currentServer,
  });

  return query;
}

export default function HomeScreen() {
  const { servers, currentServer, setCurrentServer, refreshServerInfo } = useMediaServers();

  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const BottomSheetModalRef = useRef<BottomSheetModal>(null);
  const bottomTabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const router = useRouter();

  const sectionsQuery = useHomeSections(currentServer);

  const { mutate: refreshMutate, isPending: isRefreshing } = useMutation({
    mutationKey: ['refreshServerInfo', currentServer?.id],
    mutationFn: async () => {
      if (!currentServer) return;
      await refreshServerInfo(currentServer.id);
    },
    onSuccess: () => {
      sectionsQuery.refetch();
    },
  });

  const handleRefresh = () => {
    refreshMutate();
  };

  const handleServerSelect = (serverId: string) => {
    setCurrentServer(servers.find((server) => server.id === serverId)!);
    BottomSheetModalRef.current?.dismiss();
    refreshServerInfo(serverId);
  };

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

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
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
          ),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor }}
        refreshControl={<RefreshControl refreshing={!!isRefreshing} onRefresh={handleRefresh} />}
      >
        <View
          style={{
            paddingBottom: Platform.OS === 'ios' ? bottomTabBarHeight : 0,
          }}
        >
          {sectionsQuery.data?.map((section) => {
            if (section.type === 'userview') {
              return (
                <UserViewSection
                  key={section.key}
                  userView={section.items}
                  currentServer={currentServer}
                />
              );
            }
            if (section.type === 'resume') {
              return (
                <Section
                  key={section.key}
                  title={section.title}
                  onViewAll={() => router.push('/viewall/resume')}
                  items={section.items}
                  isLoading={sectionsQuery.isLoading}
                  currentServer={currentServer}
                />
              );
            }
            if (section.type === 'nextup') {
              return (
                <Section
                  key={section.key}
                  title={section.title}
                  onViewAll={() => router.push('/viewall/nextup')}
                  items={section.items}
                  isLoading={sectionsQuery.isLoading}
                  currentServer={currentServer}
                />
              );
            }
            // latest by folder
            const folderId = section.key.replace('latest_', '');
            return (
              <Section
                key={section.key}
                title={section.title}
                onViewAll={() =>
                  router.push({
                    pathname: '/viewall/[type]',
                    params: {
                      folderId,
                      folderName: section.title.replace('最近添加的 ', ''),
                      type: 'latest',
                    },
                  })
                }
                items={section.items}
                isLoading={sectionsQuery.isLoading}
                currentServer={currentServer}
                type="series"
              />
            );
          })}
        </View>

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
      </ScrollView>
    </>
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
  serverButton: {
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 64,
    backgroundColor: '#f2f2f2',
    overflow: 'hidden',
  },
  serverButtonAvatar: {
    width: 28,
    height: 28,
    borderRadius: 12,
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
