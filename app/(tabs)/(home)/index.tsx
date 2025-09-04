import { Section } from '@/components/media/Section';
import PageScrollView from '@/components/PageScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserViewSection } from '@/components/userview/UserViewSection';
import { useQueryWithFocus } from '@/hooks/useQueryWithFocus';
import useRefresh from '@/hooks/useRefresh';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaServerInfo, useMediaServers } from '@/lib/contexts/MediaServerContext';
import {
  createApiFromServerInfo,
  getLatestItemsByFolder,
  getNextUpItems,
  getResumeItems,
  getUserView,
} from '@/services/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import { Image } from 'expo-image';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { Platform, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeSection = {
  key: string;
  title: string;
  items: BaseItemDto[];
  type?: 'latest' | 'nextup' | 'resume' | 'userview';
};

function useHomeSections(currentServer: MediaServerInfo | null) {
  const { currentApi: api } = useMediaServers();

  const query = useQueryWithFocus({
    refetchOnScreenFocus: true,
    queryKey: ['homeSections', currentServer?.id],
    queryFn: async (): Promise<HomeSection[]> => {
      if (!currentServer || !api) return [];

      const [userViewRes, nextUpRes, resumeRes] = await Promise.all([
        getUserView(api, currentServer.userId),
        getNextUpItems(api, currentServer.userId, 10),
        getResumeItems(api, currentServer.userId, 10),
      ]);

      const userViewItems = (userViewRes.data.Items || []).filter(
        (f) => f.CollectionType !== 'playlists',
      );

      const latestByFolder: { folderId: string; items: BaseItemDto[]; name: string }[] = [];
      for (const folder of userViewItems) {
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
        items: userViewItems || [],
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
  const navigation = useNavigation();

  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const insets = useSafeAreaInsets();

  const router = useRouter();

  const sectionsQuery = useHomeSections(currentServer);

  const { refreshing, onRefresh } = useRefresh(async () => {
    if (!currentServer) return Promise.resolve();
    await refreshServerInfo(currentServer.id);
    await sectionsQuery.refetch();
  });

  const handleServerSelect = useCallback(
    (serverId: string) => {
      setCurrentServer(servers.find((server) => server.id === serverId)!);
      refreshServerInfo(serverId);
    },
    [servers, setCurrentServer, refreshServerInfo],
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <MenuView
            isAnchoredToRight
            title="服务器列表"
            onPressAction={({ nativeEvent }) => {
              const serverId = nativeEvent.event;
              if (serverId && serverId !== 'current') {
                handleServerSelect(serverId);
              }
            }}
            actions={[
              ...(servers.map((server) => ({
                id: server.id,
                title: server.name,
                state:
                  currentServer?.id === server.id
                    ? 'on'
                    : Platform.select({
                        ios: 'off',
                        android: 'mixed',
                      }),
              })) as MenuAction[]),
            ]}
          >
            <TouchableOpacity style={styles.serverButton}>
              <Image
                source={{ uri: currentServer?.userAvatar }}
                style={styles.serverButtonAvatar}
                contentFit="cover"
              />
            </TouchableOpacity>
          </MenuView>
        </View>
      ),
    });
  }, [currentServer?.userAvatar, navigation, servers, currentServer?.id, handleServerSelect]);

  if (servers.length === 0) {
    return (
      <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <IconSymbol name="externaldrive.connected.to.line.below" size={48} color="#9AA0A6" />
        <ThemedText style={styles.emptyTitle}>还没有服务器</ThemedText>
        <ThemedText style={styles.emptySubtitle}>添加一个媒体服务器以开始使用</ThemedText>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/media')}>
          <ThemedText style={styles.primaryButtonText}>添加服务器</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <PageScrollView
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor }}
      refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />}
    >
      {sectionsQuery.data?.map((section) => {
        if (section.type === 'userview') {
          return <UserViewSection key={section.key} userView={section.items} />;
        }
        if (section.type === 'resume') {
          return (
            <Section
              key={section.key}
              title={section.title}
              onViewAll={() => router.push('/viewall/resume')}
              items={section.items}
              isLoading={sectionsQuery.isLoading}
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
            type="series"
          />
        );
      })}
    </PageScrollView>
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
  },
  serverButton: {
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 64,
    backgroundColor: '#f2f2f2',
    overflow: 'hidden',
  },
  serverButtonAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
