import { useThemeColor } from '@/hooks/useThemeColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { getImageInfo } from '@/lib/utils/image';
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { IconSymbol } from '../ui/IconSymbol';

export const getSubtitle = (item: BaseItemDto) => {
  if (item.Type === 'Episode') {
    return `S${item.ParentIndexNumber}E${item.IndexNumber} - ${item.Name}`;
  }
  if (item.Type === 'Movie') {
    return item.ProductionYear ?? '未知时间';
  }
  if (item.Type === 'Series') {
    const startYear = item.ProductionYear?.toString() ?? '';
    if (item.Status === 'Continuing') {
      return startYear ? `${startYear} - 现在` : '现在';
    }
    if (item.EndDate) {
      const endYear = new Date(item.EndDate).getFullYear();
      return startYear ? `${startYear} - ${endYear}` : `${endYear}`;
    }
    return startYear ?? '未知时间';
  }
  return item.Name;
};

export function MediaCard({
  item,
  style,
  hideText,
  imgType = 'Thumb',
}: {
  item: BaseItemDto;
  style?: StyleProp<ViewStyle>;
  hideText?: boolean;
  imgType?: ImageType;
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const router = useRouter();
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const { accentColor } = useAccentColor();

  const imageInfo = getImageInfo(item, {
    preferBackdrop: imgType === 'Backdrop',
    preferThumb: imgType === 'Thumb',
    preferBanner: imgType === 'Banner',
    preferLogo: imgType === 'Logo',
    width: 400,
  });

  const imageUrl = imageInfo.url;

  const handlePress = async () => {
    if (!item.Id) return;

    if (item.Type === 'Movie') {
      router.push({
        pathname: '/movie/[id]',
        params: { id: item.Id },
      });
      return;
    }

    router.push({
      pathname: '/media/player',
      params: {
        itemId: item.Id,
      },
    });
  };

  const playedPercentage =
    typeof item.UserData?.PlayedPercentage === 'number'
      ? item.UserData.PlayedPercentage
      : undefined;

  const isPlayed = item.UserData?.Played === true;

  return (
    <TouchableOpacity
      style={[styles.card, { width: 200, backgroundColor }, style]}
      onPress={handlePress}
    >
      {imageUrl ? (
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.cover}
            placeholder={{
              blurhash: imageInfo.blurhash,
            }}
            cachePolicy="memory-disk"
            contentFit="cover"
          />
          {isPlayed && (
            <View style={styles.playedOverlay}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={accentColor} />
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
      ) : (
        <View style={[styles.cover, { justifyContent: 'center', alignItems: 'center' }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={48} color="#ccc" />
        </View>
      )}
      {!hideText && (
        <>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
            {item.SeriesName || item.Name || '未知标题'}
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
  item: BaseItemDto;
  style?: StyleProp<ViewStyle>;
  imgType?: ImageType;
  hideSubtitle?: boolean;
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const router = useRouter();

  const imageInfo = getImageInfo(item, {
    preferBackdrop: imgType === 'Backdrop',
    preferThumb: imgType === 'Thumb',
    preferBanner: imgType === 'Banner',
    preferLogo: imgType === 'Logo',
    width: 400,
  });

  const imageUrl = imageInfo.url;

  return (
    <TouchableOpacity
      style={[styles.card, { width: 120, backgroundColor }, style]}
      onPress={() => {
        const type = item.Type;

        if (type === 'Season') {
          router.push({ pathname: '/season/[id]', params: { id: item.Id! } });
          return;
        }

        if (type === 'Series' || type === 'Episode') {
          const seriesId = item.SeriesId ?? item.Id;
          router.push({ pathname: '/series/[id]', params: { id: seriesId! } });
          return;
        }

        if (type === 'Movie') {
          router.push({ pathname: '/movie/[id]', params: { id: item.Id! } });
          return;
        }

        console.warn('Unknown type:', type);
      }}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.posterCover}
          placeholder={{
            blurhash: imageInfo.blurhash,
          }}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
      ) : (
        <View style={[styles.posterCover, { justifyContent: 'center', alignItems: 'center' }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={48} color="#ccc" />
        </View>
      )}
      <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
        {hideSubtitle ? `第${item.IndexNumber}季` : item.SeriesName || item.Name || '未知标题'}
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
    fontWeight: 'semibold',
    marginTop: 8,
    marginHorizontal: 8,
  },
  subtitle: {
    fontSize: 13,
    marginHorizontal: 8,
    marginTop: 2,
  },
});
