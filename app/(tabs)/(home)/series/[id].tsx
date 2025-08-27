import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import {
  addFavoriteItem,
  createApiFromServerInfo,
  getEpisodesBySeason,
  getItemDetail,
  getSeasonsBySeries,
  removeFavoriteItem,
} from '@/services/jellyfin';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SeriesDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentServer } = useMediaServers();
  const accentColor = useAccentColor().accentColor;
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const api = useMemo(
    () => (currentServer ? createApiFromServerInfo(currentServer) : null),
    [currentServer],
  );

  const { data: series } = useQuery({
    queryKey: ['series-detail', id, currentServer?.userId],
    queryFn: async () => {
      if (!api || !id || !currentServer?.userId) return null as unknown as BaseItemDto | null;
      const res = await getItemDetail(api, id, currentServer.userId);
      return res.data;
    },
    enabled: !!api && !!id && !!currentServer?.userId,
  });

  const { data: seasons, isLoading } = useQuery({
    queryKey: ['series-seasons', id, currentServer?.userId],
    queryFn: async () => {
      if (!api || !id || !currentServer?.userId) return [] as BaseItemDto[];
      const res = await getSeasonsBySeries(api, id, currentServer.userId);
      return res.data.Items ?? [];
    },
    enabled: !!api && !!id && !!currentServer?.userId,
  });

  const totalEpisodeCount = series?.RecursiveItemCount ?? series?.ChildCount ?? 0;

  useEffect(() => {
    if (!series) return;
    setIsFavorite(!!series.UserData?.IsFavorite);
  }, [series]);

  if (isLoading || !series) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  const headerImageUrl = `${currentServer?.address}/Items/${series.Id}/Images/Backdrop?maxWidth=1200`;
  const logoImageUrl = `${currentServer?.address}/Items/${series.Id}/Images/Logo?quality=90`;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={async () => {
                if (!api || !currentServer?.userId || !series?.Id) return;
                try {
                  if (isFavorite) {
                    await removeFavoriteItem(api, currentServer.userId, series.Id);
                    setIsFavorite(false);
                  } else {
                    await addFavoriteItem(api, currentServer.userId, series.Id);
                    setIsFavorite(true);
                  }
                } catch (e) {}
              }}
              style={{ padding: 8 }}
            >
              <MaterialCommunityIcons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={textColor}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ParallaxScrollView
        enableMaskView
        headerBackgroundColor={{ light: '#eee', dark: '#222' }}
        headerImage={
          headerImageUrl ? (
            <Image source={{ uri: headerImageUrl }} style={styles.header} contentFit="cover" />
          ) : (
            <View style={[styles.header, { backgroundColor: '#eee' }]} />
          )
        }
      >
        <View style={styles.content}>
          <Image source={{ uri: logoImageUrl }} style={styles.logo} contentFit="contain" />
          <Text style={[styles.meta, { color: subtitleColor }]}>
            季：{seasons?.length ?? 0} · 集数：{totalEpisodeCount}
          </Text>
          {!!series.Overview && (
            <Text style={[styles.overview, { color: subtitleColor }]} numberOfLines={5}>
              {series.Overview}
            </Text>
          )}

          {seasons?.map((season) => (
            <SeasonBlock
              key={season.Id}
              season={season}
              api={api as Api}
              userId={currentServer?.userId ?? ''}
              serverAddress={currentServer?.address ?? ''}
              onPlay={(episodeId) => {
                router.push({ pathname: '/media/player', params: { itemId: episodeId } });
              }}
            />
          ))}
        </View>
      </ParallaxScrollView>
    </>
  );
}

function SeasonBlock({
  season,
  api,
  userId,
  serverAddress,
  onPlay,
}: {
  season: BaseItemDto;
  api: Api;
  userId: string;
  serverAddress: string;
  onPlay: (episodeId: string) => void;
}) {
  const { data: episodes, isLoading } = useQuery({
    queryKey: ['season-episodes', season.Id, userId],
    queryFn: async () => {
      if (!api || !season.Id || !userId) return [] as BaseItemDto[];
      const res = await getEpisodesBySeason(api, season.Id!, userId);
      return res.data.Items ?? [];
    },
    enabled: !!api && !!season.Id && !!userId,
  });

  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');

  return (
    <View style={styles.seasonBlock}>
      <Text style={[styles.seasonTitle, { color: textColor }]}>{season.Name}</Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.episodeList}>
          {episodes?.map((ep) => {
            const cover = ep.ImageTags?.Thumb
              ? `${serverAddress}/Items/${ep.Id}/Images/Thumb?maxWidth=400`
              : ep.ParentThumbItemId
                ? `${serverAddress}/Items/${ep.ParentThumbItemId}/Images/Thumb?maxWidth=400`
                : `${serverAddress}/Items/${ep.SeriesId}/Images/Backdrop?maxWidth=400`;
            return (
              <TouchableOpacity
                key={ep.Id}
                style={styles.episodeItem}
                onPress={() => onPlay(ep.Id!)}
              >
                <Image source={{ uri: cover }} style={styles.episodeCover} contentFit="cover" />
                <View style={styles.episodeInfo}>
                  <Text style={[styles.episodeTitle, { color: textColor }]} numberOfLines={1}>
                    {`E${ep.IndexNumber} ${ep.Name}`}
                  </Text>
                  <Text
                    style={[styles.episodeSubtitle, { color: subtitleColor }]}
                    numberOfLines={2}
                  >
                    {ep.Overview || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
  },
  content: {
    top: -160,
    padding: 20,
    gap: 8,
  },
  logo: {
    width: 240,
    height: 120,
    borderRadius: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
  },
  overview: {
    fontSize: 14,
    lineHeight: 20,
  },
  seasonBlock: {
    marginTop: 16,
  },
  seasonTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  episodeList: {
    gap: 12,
  },
  episodeItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  episodeCover: {
    width: 140,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  episodeInfo: {
    flex: 1,
    gap: 6,
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  episodeSubtitle: {
    fontSize: 13,
  },
});
