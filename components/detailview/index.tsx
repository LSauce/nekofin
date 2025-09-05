import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useDetailBundle } from '@/hooks/useDetailBundle';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { getImageInfo } from '@/lib/utils/image';
import { addFavoriteItem, removeFavoriteItem } from '@/services/jellyfin';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { SkeletonDetailContent, SkeletonDetailHeader } from '../ui/Skeleton';
import { detailViewStyles } from './common';
import { MovieModeContent } from './movie';
import { SeasonModeContent } from './season';
import { SeriesModeContent } from './series';

export type DetailViewProps = {
  itemId: string;
  mode: 'series' | 'season' | 'movie';
};

export default function DetailView({ itemId, mode }: DetailViewProps) {
  const navigation = useNavigation();
  const { currentServer, currentApi } = useMediaServers();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const { data: bundle, isLoading } = useDetailBundle(mode, itemId);

  const item = bundle?.item;
  const seasons = bundle?.seasons ?? [];
  const nextUpItems = bundle?.nextUpItems ?? [];
  const episodes = bundle?.episodes ?? [];
  const similarShows = bundle?.similarShows ?? [];
  const similarMovies = bundle?.similarMovies ?? [];

  useEffect(() => {
    if (!item) return;
    setIsFavorite(!!item.UserData?.IsFavorite);
  }, [item]);

  const isLoadingCombined = isLoading;

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
    item?.Name,
    mode,
    isFavorite,
    currentApi,
    currentServer?.userId,
    item?.Id,
    textColor,
  ]);

  if (isLoadingCombined || !item) {
    return (
      <View style={[detailViewStyles.container, { backgroundColor }]}>
        <SkeletonDetailHeader />
        <SkeletonDetailContent mode={mode} />
      </View>
    );
  }

  const headerImageInfo = getImageInfo(item, { preferBackdrop: true, width: 1200 });
  const headerImageUrl = headerImageInfo.url;

  const logoImageInfo = getImageInfo(item, { preferLogo: true, width: 400 });
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
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: textColor }}>{item.Name}</Text>

        {mode === 'series' ? (
          <SeriesModeContent
            seasons={seasons}
            nextUpItems={nextUpItems}
            people={(item?.People ?? []).slice(0, 20)}
            similarItems={similarShows}
            item={item}
          />
        ) : mode === 'season' ? (
          <SeasonModeContent episodes={episodes} item={item} />
        ) : (
          <MovieModeContent
            people={(item?.People ?? []).slice(0, 20)}
            similarItems={similarMovies}
            item={item}
          />
        )}
      </View>
    </ParallaxScrollView>
  );
}
