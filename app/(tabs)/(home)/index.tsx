import { AvatarImage } from '@/components/AvatarImage';
import { getSubtitle } from '@/components/media/Card';
import { Section } from '@/components/media/Section';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { UserViewSection } from '@/components/user-view/UserViewSection';
import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { useQueryWithFocus } from '@/hooks/useQueryWithFocus';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { MediaItem, MediaServerInfo } from '@/services/media/types';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import { Image } from 'expo-image';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { interpolate, useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeSection = {
  key: string;
  title: string;
  items: MediaItem[];
  type?: 'latest' | 'nextup' | 'resume' | 'userview';
};

function useHomeSections(currentServer: MediaServerInfo | null) {
  const mediaAdapter = useMediaAdapter();

  const query = useQueryWithFocus({
    refetchOnScreenFocus: true,
    queryKey: ['homeSections', currentServer?.id],
    queryFn: async (): Promise<HomeSection[]> => {
      if (!currentServer) return [];

      const [userViewRes, nextUpRes, resumeRes] = await Promise.all([
        mediaAdapter.getUserView({ userId: currentServer.userId }),
        mediaAdapter.getNextUpItems({ userId: currentServer.userId, limit: 10 }),
        mediaAdapter.getResumeItems({ userId: currentServer.userId, limit: 10 }),
      ]);

      const userViewItems = (userViewRes || []).filter((f) => f.collectionType !== 'playlists');

      const latestByFolder: { folderId: string; items: MediaItem[]; name: string }[] = [];
      for (const folder of userViewItems) {
        if (!folder.id) continue;
        const latest = await mediaAdapter.getLatestItemsByFolder({
          userId: currentServer.userId,
          folderId: folder.id,
          limit: 16,
        });
        latestByFolder.push({
          folderId: folder.id,
          items: latest.data.Items || [],
          name: folder.name || '',
        });
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
  const { servers, currentServer, setCurrentServer, refreshServerInfo, isInitialized } =
    useMediaServers();
  const navigation = useNavigation();
  const mediaAdapter = useMediaAdapter();

  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const carouselSkeletonColor = useThemeColor(
    { light: '#f0f0f5', dark: 'rgba(255, 255, 255, 0.08)' },
    'background',
  );
  const carouselPlaceholderColor = useThemeColor(
    { light: '#d1d1d6', dark: '#2b2b2b' },
    'background',
  );
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const carouselHeight = windowHeight * 0.6;

  const router = useRouter();

  const sectionsQuery = useHomeSections(currentServer);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselScrollOffset = useSharedValue(0);
  const carouselProgress = useSharedValue(0);

  const carouselItems = useMemo(() => {
    const sections = sectionsQuery.data;
    if (!sections) return [];

    const candidates = sections
      .filter((section) => section.type && section.type !== 'userview')
      .flatMap((section) => section.items ?? [])
      .filter((item): item is MediaItem => !!item?.id);

    if (candidates.length === 0) return [];

    const uniqueById = new Map<string, MediaItem>();
    for (const item of candidates) {
      if (!item.id) continue;
      uniqueById.set(item.id, item);
    }

    const uniqueItems = Array.from(uniqueById.values()).filter((item) =>
      ['Movie', 'Series', 'Episode', 'Season'].includes(item.type),
    );

    if (uniqueItems.length <= 6) {
      return uniqueItems;
    }

    const shuffled = [...uniqueItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 6);
  }, [sectionsQuery.data]);

  const handleServerSelect = useCallback(
    (serverId: string) => {
      setCurrentServer(servers.find((server) => server.id === serverId)!);
      refreshServerInfo(serverId);
    },
    [servers, setCurrentServer, refreshServerInfo],
  );

  useEffect(() => {
    if (carouselItems.length === 0) {
      setCarouselIndex(0);
      carouselScrollOffset.value = 0;
      return;
    }

    setCarouselIndex((current) =>
      current >= carouselItems.length ? Math.max(carouselItems.length - 1, 0) : current,
    );
  }, [carouselItems.length, carouselScrollOffset]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        servers && servers.length > 0 ? (
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
                <AvatarImage
                  key={currentServer?.id}
                  avatarUri={currentServer?.userAvatar}
                  style={styles.serverButtonAvatar}
                />
              </TouchableOpacity>
            </MenuView>
          </View>
        ) : undefined,
    });
  }, [
    currentServer?.userAvatar,
    navigation,
    servers,
    currentServer?.id,
    handleServerSelect,
    currentServer,
  ]);

  const handleCarouselItemPress = useCallback(
    (item: MediaItem) => {
      if (!item?.id) return;

      switch (item.type) {
        case 'Movie':
          router.push({ pathname: '/movie/[id]', params: { id: item.id } });
          return;
        case 'Series':
          router.push({ pathname: '/series/[id]', params: { id: item.id } });
          return;
        case 'Season':
          router.push({ pathname: '/season/[id]', params: { id: item.id } });
          return;
        case 'Episode':
          router.push({ pathname: '/episode/[id]', params: { id: item.id } });
          return;
        default:
          if (item.seriesId) {
            router.push({ pathname: '/series/[id]', params: { id: item.seriesId } });
          }
      }
    },
    [router],
  );

  if (servers.length === 0 && isInitialized) {
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
    <ParallaxScrollView
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      contentInset={{ top: -100 }}
      style={{ flex: 1, backgroundColor }}
      headerHeight={carouselHeight}
      enableMaskView
      headerImage={
        <>
          {carouselItems.length > 0 && (
            <Carousel
              width={windowWidth}
              height={carouselHeight}
              data={carouselItems}
              defaultScrollOffsetValue={carouselScrollOffset}
              loop={carouselItems.length > 1}
              autoPlay={carouselItems.length > 1}
              autoPlayInterval={6500}
              scrollAnimationDuration={900}
              pagingEnabled
              onSnapToItem={(index) => setCarouselIndex(index)}
              onConfigurePanGesture={(panGesture) => {
                return panGesture.activeOffsetX([-10, 10]);
              }}
              onProgressChange={carouselProgress}
              renderItem={({ item }) => {
                const imageInfo = mediaAdapter.getImageInfo({
                  item,
                  opts: {
                    preferBackdrop: true,
                    preferThumb: true,
                  },
                });
                const imageUrl = imageInfo.url;

                return (
                  <View style={[styles.carouselItemWrapper, { height: carouselHeight }]}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.carouselCard}
                      onPress={() => handleCarouselItemPress(item)}
                    >
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.carouselImage}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          placeholder={
                            imageInfo.blurhash ? { blurhash: imageInfo.blurhash } : undefined
                          }
                        />
                      ) : (
                        <View
                          style={[
                            styles.carouselImage,
                            styles.carouselPlaceholder,
                            { backgroundColor: carouselPlaceholderColor },
                          ]}
                        >
                          <IconSymbol name="video.fill" size={48} color="rgba(255,255,255,0.9)" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </>
      }
    >
      {sectionsQuery.isLoading ? (
        <>
          <UserViewSection userView={[]} isLoading={true} />
          <Section
            key="skeleton-resume"
            title=""
            onViewAll={() => {}}
            items={[]}
            isLoading={true}
          />
          <Section
            key="skeleton-nextup"
            title=""
            onViewAll={() => {}}
            items={[]}
            isLoading={true}
          />
          <Section
            key="skeleton-latest"
            title=""
            onViewAll={() => {}}
            items={[]}
            isLoading={true}
            type="series"
          />
        </>
      ) : (
        <>
          {carouselItems.length > 0 && (
            <Carousel
              width={windowWidth}
              height={100}
              data={carouselItems}
              defaultScrollOffsetValue={carouselScrollOffset}
              loop={carouselItems.length > 1}
              autoPlay={false}
              autoPlayInterval={6500}
              scrollAnimationDuration={900}
              pagingEnabled
              onSnapToItem={(index) => setCarouselIndex(index)}
              onConfigurePanGesture={(panGesture) => {
                return panGesture.activeOffsetX([-10, 10]);
              }}
              onProgressChange={carouselProgress}
              style={styles.carouselContainer}
              renderItem={({ item }) => {
                const title = item.seriesName || item.name || '未知标题';
                const subtitle = getSubtitle(item);

                return (
                  <View style={styles.carouselTextContainer}>
                    <ThemedText style={styles.carouselTitle} numberOfLines={2}>
                      {title}
                    </ThemedText>
                    {subtitle ? (
                      <ThemedText style={styles.carouselSubtitle} numberOfLines={1}>
                        {subtitle}
                      </ThemedText>
                    ) : null}
                  </View>
                );
              }}
            />
          )}
          {sectionsQuery.data?.map((section) => {
            if (section.type === 'userview') {
              return <UserViewSection key={section.key} userView={section.items} />;
            }
            if (section.type === 'resume') {
              if (section.items.length === 0) return null;
              return (
                <Section
                  key={section.key}
                  title={section.title}
                  onViewAll={() => router.push('/view-all/resume')}
                  items={section.items}
                  isLoading={false}
                />
              );
            }
            if (section.type === 'nextup') {
              if (section.items.length === 0) return null;
              return (
                <Section
                  key={section.key}
                  title={section.title}
                  onViewAll={() => router.push('/view-all/nextup')}
                  items={section.items}
                  isLoading={false}
                />
              );
            }
            const folderId = section.key.replace('latest_', '');
            return (
              <Section
                key={section.key}
                title={section.title}
                onViewAll={() =>
                  router.push({
                    pathname: '/view-all/[type]',
                    params: {
                      folderId,
                      folderName: section.title.replace('最近添加的 ', ''),
                      type: 'latest',
                    },
                  })
                }
                items={section.items}
                isLoading={false}
                type="series"
              />
            );
          })}
        </>
      )}
    </ParallaxScrollView>
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
  carouselSkeleton: {
    marginTop: 0,
    marginBottom: 24,
  },
  carouselContainer: {
    position: 'absolute',
    bottom: 0,
    justifyContent: 'center',
  },
  carouselItemWrapper: {
    flex: 1,
    width: '100%',
  },
  carouselCard: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#151718',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: '35%',
  },
  carouselTextContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    gap: 6,
    zIndex: 2,
  },
  carouselTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  carouselSubtitle: {
    fontSize: 15,
  },
  carouselIndicators: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  carouselIndicatorsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  carouselIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  carouselIndicatorDotActive: {
    width: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
