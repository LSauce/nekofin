import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { ImageUrlInfo } from '@/lib/utils/image';
import { MediaItem } from '@/services/media/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models';
import { Image, type ImageProps } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

function ImageWithFallback({
  uri,
  style,
  placeholderBlurhash,
  contentFit,
  cachePolicy,
  fallback,
}: {
  uri?: string;
  style: StyleProp<ImageStyle>;
  placeholderBlurhash?: string;
  contentFit?: ImageProps['contentFit'];
  cachePolicy?: ImageProps['cachePolicy'];
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return <>{fallback}</>;
  }

  return (
    <Image
      source={{ uri: uri }}
      style={style}
      placeholder={placeholderBlurhash ? { blurhash: placeholderBlurhash } : undefined}
      cachePolicy={cachePolicy}
      contentFit={contentFit}
      onError={() => setFailed(true)}
    />
  );
}

export const getSubtitle = (item: MediaItem) => {
  if (item.type === 'Episode') {
    return `S${item.parentIndexNumber}E${item.indexNumber} - ${item.name}`;
  }
  if (item.type === 'Movie') {
    return item.productionYear ?? '未知时间';
  }
  if (item.type === 'Series') {
    const startYear = item.productionYear?.toString() ?? '';
    if (item.status === 'Continuing') {
      return startYear ? `${startYear} - 现在` : '现在';
    }
    if (item.endDate) {
      const endYear = new Date(item.endDate).getFullYear();
      if (startYear && parseInt(startYear) === endYear) {
        return startYear;
      }
      return startYear ? `${startYear} - ${endYear}` : `${endYear}`;
    }
    return startYear ?? '未知时间';
  }
  return item.name;
};

export function EpisodeCard({
  item,
  style,
  hideText,
  imgType = 'Thumb',
  imgInfo,
  onPress,
}: {
  item: MediaItem;
  style?: StyleProp<ViewStyle>;
  hideText?: boolean;
  imgType?: ImageType;
  imgInfo?: ImageUrlInfo;
  onPress?: () => void;
}) {
  const router = useRouter();
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const { accentColor } = useAccentColor();

  const mediaAdapter = useMediaAdapter();

  const imageInfo =
    imgInfo ??
    mediaAdapter.getImageInfo({
      item,
      opts: {
        preferBackdrop: imgType === 'Backdrop',
        preferThumb: imgType === 'Thumb',
        preferBanner: imgType === 'Banner',
        preferLogo: imgType === 'Logo',
        width: 400,
      },
    });

  const imageUrl = imageInfo.url;

  const handlePress = async () => {
    if (!item.id) return;

    if (item.type === 'Movie') {
      router.push({
        pathname: '/movie/[id]',
        params: { id: item.id },
      });
      return;
    }

    router.push({
      pathname: '/episode/[id]',
      params: {
        id: item.id,
      },
    });
  };

  const playedPercentage =
    typeof item.userData?.playedPercentage === 'number'
      ? item.userData.playedPercentage
      : undefined;

  const isPlayed = item.userData?.played === true;

  return (
    <TouchableOpacity style={[styles.card, { width: 200 }, style]} onPress={onPress || handlePress}>
      <View style={styles.coverContainer}>
        <ImageWithFallback
          uri={imageUrl}
          style={styles.cover}
          placeholderBlurhash={imageInfo.blurhash}
          cachePolicy="memory-disk"
          contentFit="cover"
          fallback={
            <View style={[styles.cover, { justifyContent: 'center', alignItems: 'center' }]}>
              <FontAwesome name="film" size={36} color="#ccc" />
            </View>
          }
        />
        {isPlayed && (
          <View style={styles.playedOverlay}>
            <Ionicons name="checkmark-circle" size={24} color={accentColor} />
          </View>
        )}
        {playedPercentage !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${playedPercentage}%`,
                    backgroundColor: accentColor,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>
      {!hideText && (
        <>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
            {item.seriesName || item.name || '未知标题'}
          </Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
            {getSubtitle(item)}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function SeriesCard({
  item,
  style,
  imgType = 'Primary',
  hideSubtitle = false,
}: {
  item: MediaItem;
  style?: StyleProp<ViewStyle>;
  imgType?: ImageType;
  hideSubtitle?: boolean;
}) {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const router = useRouter();

  const mediaAdapter = useMediaAdapter();

  const imageInfo = mediaAdapter.getImageInfo({
    item,
    opts: {
      preferBackdrop: imgType === 'Backdrop',
      preferThumb: imgType === 'Thumb',
      preferBanner: imgType === 'Banner',
      preferLogo: imgType === 'Logo',
      width: 400,
    },
  });

  const imageUrl = imageInfo.url;

  return (
    <TouchableOpacity
      style={[styles.card, { width: 120 }, style]}
      onPress={() => {
        const type = item.type;

        if (type === 'Season') {
          router.push({ pathname: '/season/[id]', params: { id: item.id! } });
          return;
        }

        if (type === 'Series' || type === 'Episode') {
          const seriesId = item.seriesId ?? item.id;
          router.push({ pathname: '/series/[id]', params: { id: seriesId! } });
          return;
        }

        if (type === 'Movie') {
          router.push({ pathname: '/movie/[id]', params: { id: item.id! } });
          return;
        }

        console.warn('Unknown type:', type);
      }}
    >
      <ImageWithFallback
        uri={imageUrl}
        style={styles.posterCover}
        placeholderBlurhash={imageInfo.blurhash}
        cachePolicy="memory-disk"
        contentFit="cover"
        fallback={
          <View style={[styles.posterCover, { justifyContent: 'center', alignItems: 'center' }]}>
            <FontAwesome name="film" size={36} color="#ccc" />
          </View>
        }
      />
      <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
        {hideSubtitle ? item.name : item.seriesName || item.name || '未知标题'}
      </Text>
      {!hideSubtitle && (
        <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
          {getSubtitle(item)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  coverContainer: {
    position: 'relative',
    backgroundColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cover: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
  },
  posterCover: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: '#eee',
    borderRadius: 12,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 1,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    borderRadius: 0,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 0,
  },
  playedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 9999,
    padding: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginHorizontal: 8,
  },
  subtitle: {
    fontSize: 13,
    marginHorizontal: 8,
    marginTop: 2,
  },
});
