import ParallaxScrollView from '@/components/ParallaxScrollView';
import { DetailBundle, useDetailBundle } from '@/hooks/useDetailBundle';
import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import useRefresh from '@/hooks/useRefresh';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { HeaderButton } from '@react-navigation/elements';
import { UseQueryResult } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';

import { SkeletonDetailContent, SkeletonDetailHeader } from '../ui/Skeleton';
import { detailViewStyles } from './common';
import { DetailViewProvider, useDetailView } from './DetailViewContext';
import { EpisodeModeContent } from './episode';
import { MovieModeContent } from './movie';
import { SeasonModeContent } from './season';
import { SeriesModeContent } from './series';

export type DetailViewProps = {
  itemId: string;
  mode: 'series' | 'season' | 'movie' | 'episode';
  query: UseQueryResult<DetailBundle, Error>;
};

function DetailViewContent({ itemId, mode, query }: DetailViewProps) {
  const navigation = useNavigation();
  const { currentServer } = useMediaServers();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const { title, backgroundImageUrl, setItem, selectedItem } = useDetailView();

  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const { data: bundle, isLoading, refetch } = query;

  const mediaAdapter = useMediaAdapter();

  const item = bundle?.item;
  const seasons = bundle?.seasons ?? [];
  const nextUpItems = bundle?.nextUpItems ?? [];
  const episodes = bundle?.episodes ?? [];
  const similarShows = bundle?.similarShows ?? [];
  const similarMovies = bundle?.similarMovies ?? [];

  const { refreshing, onRefresh } = useRefresh(refetch, [itemId]);

  useEffect(() => {
    if (!item) return;
    setItem?.(item);
  }, [item, setItem]);

  useEffect(() => {
    if (mode === 'episode' && selectedItem) {
      setIsFavorite(!!selectedItem.userData?.isFavorite);
    } else if (mode !== 'episode' && item) {
      setIsFavorite(!!item.userData?.isFavorite);
    }
  }, [mode, selectedItem, item]);

  useEffect(() => {
    const currentItem = mode === 'episode' ? selectedItem : item;
    const currentItemId = currentItem?.id;

    navigation.setOptions({
      headerRight: () =>
        mode !== 'season' && currentItemId ? (
          <HeaderButton
            onPress={async () => {
              if (!currentServer?.userId || !currentItemId) return;
              if (isFavorite) {
                await mediaAdapter.removeFavoriteItem({
                  userId: currentServer.userId,
                  itemId: currentItemId,
                });
                setIsFavorite(false);
              } else {
                await mediaAdapter.addFavoriteItem({
                  userId: currentServer.userId,
                  itemId: currentItemId,
                });
                setIsFavorite(true);
              }
            }}
            style={{ paddingHorizontal: 6 }}
          >
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={textColor} />
          </HeaderButton>
        ) : null,
    });
  }, [
    navigation,
    item?.name,
    mode,
    isFavorite,
    currentServer?.userId,
    item?.id,
    selectedItem?.id,
    textColor,
    mediaAdapter,
    item,
    selectedItem,
  ]);

  if (isLoading || !item) {
    return (
      <View style={[detailViewStyles.container, { backgroundColor }]}>
        <SkeletonDetailHeader />
        <SkeletonDetailContent mode={mode} />
      </View>
    );
  }

  const headerImageInfo = mediaAdapter.getImageInfo({
    item,
    opts: { preferBackdrop: true, width: 1200 },
  });
  const headerImageUrl = backgroundImageUrl || headerImageInfo.url;

  const logoImageInfo = mediaAdapter.getImageInfo({ item, opts: { preferLogo: true, width: 400 } });
  const logoImageUrl = logoImageInfo.url;

  const renderModeContent = () => {
    const modeComponents = {
      series: (
        <SeriesModeContent
          seasons={seasons}
          nextUpItems={nextUpItems}
          people={(item?.people ?? []).slice(0, 20)}
          similarItems={similarShows}
          item={item}
        />
      ),
      season: <SeasonModeContent episodes={episodes} item={item} />,
      movie: (
        <MovieModeContent
          people={(item?.people ?? []).slice(0, 20)}
          similarItems={similarMovies}
          item={item}
        />
      ),
      episode: (
        <EpisodeModeContent
          seasons={seasons}
          episodes={episodes}
          item={item}
          people={(item?.people ?? []).slice(0, 20)}
          similarItems={similarMovies}
        />
      ),
    };

    return modeComponents[mode];
  };

  return (
    <ParallaxScrollView
      enableMaskView
      headerHeight={500}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      headerBackgroundColor={{ light: '#eee', dark: '#222' }}
      contentStyle={{ paddingBottom: 40 }}
      headerImage={
        headerImageUrl ? (
          <Image
            source={{ uri: headerImageUrl }}
            style={detailViewStyles.header}
            placeholder={{ blurhash: headerImageInfo.blurhash }}
            contentFit="cover"
          />
        ) : (
          <View style={[detailViewStyles.header, { backgroundColor: '#eee' }]} />
        )
      }
    >
      <View style={detailViewStyles.content}>
        {!!logoImageUrl && (
          <Image
            source={{ uri: logoImageUrl }}
            style={detailViewStyles.logo}
            contentFit="contain"
          />
        )}
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: textColor }}>
          {title || item.name}
        </Text>
        {renderModeContent()}
      </View>
    </ParallaxScrollView>
  );
}

export default function DetailView({ itemId, mode }: Omit<DetailViewProps, 'query'>) {
  const query = useDetailBundle(mode, itemId);

  return (
    <DetailViewProvider itemId={itemId} mode={mode} query={query}>
      <DetailViewContent itemId={itemId} mode={mode} query={query} />
    </DetailViewProvider>
  );
}
