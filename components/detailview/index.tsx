import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useDetailBundle } from '@/hooks/useDetailBundle';
import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import useRefresh from '@/hooks/useRefresh';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native';

import { SkeletonDetailContent, SkeletonDetailHeader } from '../ui/Skeleton';
import { detailViewStyles } from './common';
import { EpisodeModeContent } from './episode';
import { MovieModeContent } from './movie';
import { SeasonModeContent } from './season';
import { SeriesModeContent } from './series';

export type DetailViewProps = {
  itemId: string;
  mode: 'series' | 'season' | 'movie' | 'episode';
};

export default function DetailView({ itemId, mode }: DetailViewProps) {
  const navigation = useNavigation();
  const { currentServer } = useMediaServers();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const { data: bundle, isLoading, refetch } = useDetailBundle(mode, itemId);
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
    setIsFavorite(!!item.userData?.isFavorite);
  }, [item]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        mode === 'series' && item?.id ? (
          <TouchableOpacity
            onPress={async () => {
              if (!currentServer?.userId || !item?.id) return;
              try {
                if (isFavorite) {
                  await mediaAdapter.removeFavoriteItem(currentServer.userId, item.id);
                  setIsFavorite(false);
                } else {
                  await mediaAdapter.addFavoriteItem(currentServer.userId, item.id);
                  setIsFavorite(true);
                }
              } catch (e) {}
            }}
            style={{ marginLeft: 6 }}
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
    item?.name,
    mode,
    isFavorite,
    currentServer?.userId,
    item?.id,
    textColor,
    mediaAdapter,
  ]);

  if (isLoading || !item) {
    return (
      <View style={[detailViewStyles.container, { backgroundColor }]}>
        <SkeletonDetailHeader />
        <SkeletonDetailContent mode={mode} />
      </View>
    );
  }

  const headerImageInfo = mediaAdapter.getImageInfo(item, { preferBackdrop: true, width: 1200 });
  const headerImageUrl = headerImageInfo.url;

  const logoImageInfo = mediaAdapter.getImageInfo(item, { preferLogo: true, width: 400 });
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
      headerHeight={400}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      headerBackgroundColor={{ light: '#eee', dark: '#222' }}
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
        {mode !== 'episode' && (
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: textColor }}>{item.name}</Text>
        )}

        {renderModeContent()}
      </View>
    </ParallaxScrollView>
  );
}
