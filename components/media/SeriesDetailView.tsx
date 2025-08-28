import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaServerInfo, useMediaServers } from '@/lib/contexts/MediaServerContext';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { formatDurationFromTicks } from '@/lib/utils';
import { getImageInfo } from '@/lib/utils/image';
import {
  addFavoriteItem,
  getEpisodesBySeason,
  getItemDetail,
  getNextUpItemsByFolder,
  getSeasonsBySeries,
  getSimilarShows,
  markItemPlayed,
  markItemUnplayed,
  removeFavoriteItem,
} from '@/services/jellyfin';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BaseItemDto, type BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ColorValue,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { MediaCard, SeriesCard } from './Card';

export type SeriesDetailViewProps = {
  itemId: string;
  mode: 'series' | 'season';
};

export default function SeriesDetailView({ itemId, mode }: SeriesDetailViewProps) {
  const navigation = useNavigation();
  const { currentServer, currentApi } = useMediaServers();
  const { accentColor } = useAccentColor();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');

  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const { data: item } = useQuery({
    queryKey: ['series-or-season-detail', itemId, currentServer?.userId],
    queryFn: async () => {
      if (!itemId || !currentServer?.userId) return null as unknown as BaseItemDto | null;
      const res = await getItemDetail(currentApi!, itemId, currentServer.userId);
      return res.data;
    },
    enabled: !!currentApi && !!itemId && !!currentServer?.userId,
  });

  const { data: seasons = [], isLoading: isLoadingSeasons } = useQuery({
    queryKey: ['series-seasons', itemId, currentServer?.userId],
    queryFn: async () => {
      if (mode !== 'series' || !currentApi || !itemId || !currentServer?.userId)
        return [] as BaseItemDto[];
      const res = await getSeasonsBySeries(currentApi, itemId, currentServer.userId);
      return res.data.Items ?? [];
    },
    enabled: mode === 'series' && !!currentApi && !!itemId && !!currentServer?.userId,
  });

  const { data: nextUpItems = [] } = useQuery({
    queryKey: ['series-nextup', itemId, currentServer?.userId],
    queryFn: async () => {
      if (mode !== 'series' || !currentApi || !itemId || !currentServer?.userId)
        return [] as BaseItemDto[];
      const res = await getNextUpItemsByFolder(currentApi, currentServer.userId, itemId, 30);
      return res.data.Items ?? [];
    },
    enabled: mode === 'series' && !!currentApi && !!itemId && !!currentServer?.userId,
  });

  const { data: episodes = [], isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ['season-episodes', itemId, currentServer?.userId],
    queryFn: async () => {
      if (mode !== 'season' || !currentApi || !itemId || !currentServer?.userId)
        return [] as BaseItemDto[];
      const res = await getEpisodesBySeason(currentApi, itemId, currentServer.userId);
      return res.data.Items ?? [];
    },
    enabled: mode === 'season' && !!currentApi && !!itemId && !!currentServer?.userId,
  });

  const { data: similarShows = [] } = useQuery({
    queryKey: ['series-similar', itemId, currentServer?.userId],
    queryFn: async () => {
      if (mode !== 'series' || !currentApi || !itemId || !currentServer?.userId)
        return [] as BaseItemDto[];
      const res = await getSimilarShows(currentApi, itemId, currentServer.userId, 30);
      return res.data.Items ?? [];
    },
    enabled: mode === 'series' && !!currentApi && !!itemId && !!currentServer?.userId,
  });

  useEffect(() => {
    if (!item) return;
    setIsFavorite(!!item.UserData?.IsFavorite);
  }, [item]);

  const genreText = useMemo(() => {
    const primary = item?.Genres && item.Genres.length > 0 ? item.Genres : undefined;
    if (primary) return primary.join(', ');
    const fallback = item?.GenreItems?.map((g) => g.Name).filter(Boolean) ?? [];
    return fallback.join(', ');
  }, [item?.GenreItems, item?.Genres]);

  const writerText = useMemo(() => {
    const people = item?.People?.filter((p) => p?.Type === 'Writer').map((p) => p.Name) ?? [];
    return people.filter(Boolean).join(', ');
  }, [item?.People]);

  const studioText = useMemo(() => {
    const studios = item?.Studios?.map((s) => s.Name) ?? [];
    return studios.filter(Boolean).join(', ');
  }, [item?.Studios]);

  const yearText = useMemo(() => {
    return typeof item?.ProductionYear === 'number' ? String(item.ProductionYear) : '';
  }, [item?.ProductionYear]);

  const ratingText = useMemo(() => {
    if (typeof item?.CommunityRating === 'number') return item.CommunityRating.toFixed(1);
    if (typeof item?.CriticRating === 'number') return String(item.CriticRating);
    if (item?.OfficialRating) return item.OfficialRating;
    return '';
  }, [item?.CommunityRating, item?.CriticRating, item?.OfficialRating]);

  const isLoading = mode === 'series' ? isLoadingSeasons : isLoadingEpisodes;

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        mode === 'series' && item?.Id ? (
          <TouchableOpacity
            onPress={async () => {
              if (!currentApi || !currentServer?.userId || !item?.Id) return;
              try {
                if (isFavorite) {
                  await removeFavoriteItem(currentApi, currentServer.userId, item.Id);
                  setIsFavorite(false);
                } else {
                  await addFavoriteItem(currentApi, currentServer.userId, item.Id);
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
        ) : null,
    });
  }, [
    navigation,
    item?.Name,
    mode,
    isFavorite,
    currentApi,
    currentServer?.userId,
    item?.Id,
    textColor,
  ]);

  if (isLoading || !item) {
    return (
      <View style={[styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  const headerImageInfo = getImageInfo(item, { preferBackdrop: true, width: 1200 });
  const headerImageUrl = headerImageInfo.url;

  const logoImageInfo = getImageInfo(item, { preferLogo: true, width: 240 });
  const logoImageUrl = logoImageInfo.url;

  return (
    <ParallaxScrollView
      enableMaskView
      headerHeight={400}
      showsVerticalScrollIndicator={false}
      headerBackgroundColor={{ light: '#eee', dark: '#222' }}
      headerImage={
        headerImageUrl ? (
          <Image
            source={{ uri: headerImageUrl }}
            style={styles.header}
            placeholder={{ blurhash: headerImageInfo.blurhash }}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.header, { backgroundColor: '#eee' }]} />
        )
      }
    >
      <View style={styles.content}>
        {!!logoImageUrl && (
          <Image source={{ uri: logoImageUrl }} style={styles.logo} contentFit="contain" />
        )}
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{item.Name}</Text>
        {
          <Text style={[styles.meta, { color: textColor }]}>
            {mode === 'series' ? (
              ratingText ? (
                <>
                  <Text style={styles.star}>★</Text>
                  <Text>{` ${ratingText}`}</Text>
                  {yearText ? <Text>{` · ${yearText}`}</Text> : null}
                </>
              ) : (
                <>{yearText}</>
              )
            ) : (
              `第${item.IndexNumber}季`
            )}
          </Text>
        }
        {!!item.Overview && (
          <Text style={[styles.overview, { color: textColor }]} numberOfLines={5}>
            {item.Overview.trim()}
          </Text>
        )}

        {mode === 'series' && (genreText || writerText || studioText) ? (
          <View style={styles.infoBlock}>
            {!!genreText && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: subtitleColor }]}>类型</Text>
                <ThemedText style={styles.infoValue}>{genreText}</ThemedText>
              </View>
            )}
            {!!writerText && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: subtitleColor }]}>编剧</Text>
                <ThemedText style={styles.infoValue}>{writerText}</ThemedText>
              </View>
            )}
            {!!studioText && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: subtitleColor }]}>工作室</Text>
                <ThemedText style={styles.infoValue}>{studioText}</ThemedText>
              </View>
            )}
          </View>
        ) : null}

        {mode === 'series' ? (
          <SeriesModeContent
            seasons={seasons}
            nextUpItems={nextUpItems}
            people={(item?.People ?? []).slice(0, 20) as BaseItemPerson[]}
            similarItems={similarShows}
            currentServer={currentServer}
            textColor={textColor}
          />
        ) : (
          <SeasonModeContent
            episodes={episodes}
            currentServer={currentServer}
            subtitleColor={subtitleColor}
          />
        )}
      </View>
    </ParallaxScrollView>
  );
}

function SeriesModeContent({
  seasons,
  nextUpItems,
  people,
  similarItems,
  currentServer,
  textColor,
}: {
  seasons: BaseItemDto[];
  nextUpItems: BaseItemDto[];
  people: BaseItemPerson[];
  similarItems: BaseItemDto[];
  currentServer: MediaServerInfo | null;
  textColor: ColorValue;
}) {
  const renderPersonItem = useCallback(({ item }: { item: BaseItemPerson }) => {
    const imageInfo = getImageInfo(item, { width: 300 });

    return (
      <View style={styles.personCard}>
        {imageInfo.blurhash ? (
          <Image
            source={{ uri: imageInfo.url }}
            style={styles.personPoster}
            placeholder={{ blurhash: imageInfo.blurhash }}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.personPoster,
              { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
            ]}
          >
            <IconSymbol name="person.crop.rectangle" size={36} color="#bbb" />
          </View>
        )}
        <Text style={styles.personName} numberOfLines={1}>
          {item.Name}
        </Text>
        {!!item.Role && (
          <Text style={styles.personRole} numberOfLines={1}>
            {item.Role}
          </Text>
        )}
      </View>
    );
  }, []);

  return (
    <>
      {nextUpItems.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>接下来</Text>
          <FlatList
            horizontal
            data={nextUpItems}
            style={styles.edgeToEdge}
            renderItem={({ item }) => (
              <MediaCard
                item={item}
                currentServer={currentServer}
                style={styles.horizontalCard}
                imgType="Primary"
              />
            )}
            keyExtractor={(item) => item.Id!}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {seasons && seasons.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>季度</Text>
          <FlatList
            horizontal
            data={seasons}
            style={styles.edgeToEdge}
            renderItem={({ item }) => (
              <SeriesCard item={item} style={styles.seasonCard} imgType="Primary" hideSubtitle />
            )}
            keyExtractor={(item) => item.Id!}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {people && people.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>演职人员</Text>
          <FlatList
            horizontal
            data={people}
            style={styles.edgeToEdge}
            renderItem={renderPersonItem}
            keyExtractor={(item) => `${item.Id ?? item.Name}-${item.Role ?? ''}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {similarItems && similarItems.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>更多类似的</Text>
          <FlatList
            horizontal
            data={similarItems}
            style={styles.edgeToEdge}
            renderItem={({ item }) => (
              <SeriesCard item={item} style={styles.seasonCard} imgType="Primary" />
            )}
            keyExtractor={(item) => item.Id!}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}
    </>
  );
}

function SeasonModeContent({
  episodes,
  currentServer,
  subtitleColor,
}: {
  episodes: BaseItemDto[];
  currentServer: MediaServerInfo | null;
  subtitleColor: ColorValue;
}) {
  const { currentApi } = useMediaServers();
  const queryClient = useQueryClient();
  return (
    <>
      <View style={styles.listContainer}>
        {episodes.map((item) => (
          <View key={item.Id} style={styles.listItem}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 8,
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <MediaCard
                key={item.Id}
                item={item}
                currentServer={currentServer}
                style={{ width: 140, marginRight: 0 }}
                hideText
                imgType="Primary"
              />
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  alignSelf: 'flex-start',
                }}
              >
                <ThemedText style={{ lineHeight: 20 }}>{item.Name}</ThemedText>
                <ThemedText style={{ color: subtitleColor, fontSize: 12, lineHeight: 16 }}>
                  {`S${item.ParentIndexNumber}E${item.IndexNumber}`}
                </ThemedText>
                <ThemedText style={{ color: subtitleColor, fontSize: 12, lineHeight: 16 }}>
                  {formatDurationFromTicks(item.RunTimeTicks)}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  if (!currentServer?.userId || !item.Id) return;
                  try {
                    const isPlayed = !!item.UserData?.Played;
                    if (isPlayed) {
                      await markItemUnplayed(currentApi!, currentServer.userId, item.Id);
                    } else {
                      await markItemPlayed(currentApi!, currentServer.userId, item.Id);
                    }
                    await queryClient.invalidateQueries({ queryKey: ['season-episodes'] });
                  } catch (e) {}
                }}
                style={{ paddingHorizontal: 8, alignSelf: 'flex-start' }}
              >
                <IconSymbol
                  name={item.UserData?.Played ? 'checkmark.circle.fill' : 'checkmark.circle'}
                  size={24}
                  color={subtitleColor}
                />
              </TouchableOpacity>
            </View>
            <View>
              <ThemedText
                style={{ color: subtitleColor, fontSize: 12, lineHeight: 16 }}
                numberOfLines={3}
              >
                {item.Overview?.trim()}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
      {episodes.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: subtitleColor }]}>暂无内容</Text>
        </View>
      )}
    </>
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
    top: -140,
    padding: 20,
    gap: 8,
  },
  logo: {
    top: -40,
    width: '100%',
    height: 120,
  },
  meta: {
    fontSize: 14,
  },
  star: {
    color: '#F5C518',
  },
  overview: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBlock: {
    marginTop: 6,
    rowGap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  infoLabel: {
    fontSize: 14,
    width: 56,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  sectionBlock: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  horizontalList: {
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  edgeToEdge: {
    marginHorizontal: -20,
  },
  horizontalCard: {
    width: 200,
    marginRight: 8,
  },
  seasonCard: {
    width: 140,
    marginRight: 8,
  },
  personCard: {
    width: 120,
    marginRight: 12,
    alignItems: 'flex-start',
  },
  personPoster: {
    width: 120,
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  personName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    maxWidth: 120,
  },
  personRole: {
    fontSize: 12,
    opacity: 0.7,
    maxWidth: 120,
    marginTop: 2,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gridItem: {
    width: '48%',
    marginRight: 0,
    marginBottom: 20,
  },
  listContainer: {
    marginTop: 16,
    rowGap: 16,
  },
  listItem: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
