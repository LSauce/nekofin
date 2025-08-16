import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaServerInfo } from '@/lib/contexts/MediaServerContext';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { IconSymbol } from '../ui/IconSymbol';

const getSubtitle = (item: BaseItemDto) => {
  if (item.Type === 'Episode') {
    return `S${item.ParentIndexNumber}E${item.IndexNumber} - ${item.Name}`;
  }
  if (item.Type === 'Movie') {
    return item.ProductionYear;
  }
  if (item.Type === 'Series') {
    return `${item.ProductionYear} - ${item.Status === 'Continuing' ? '现在' : new Date(item.EndDate ?? '').getFullYear()}`;
  }
  return item.Name;
};

export function MediaCard({
  item,
  onPress,
  currentServer,
}: {
  item: BaseItemDto;
  onPress?: () => void;
  currentServer?: MediaServerInfo | null;
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const router = useRouter();
  const { width } = useWindowDimensions();
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const progressColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  const imageUrl = useMemo(() => {
    if (item.Type === 'Episode') {
      if (item.ParentThumbItemId) {
        return `${currentServer?.address}/Items/${item.ParentThumbItemId}/Images/Thumb?maxWidth=300`;
      }
      return `${currentServer?.address}/Items/${item.SeriesId}/Images/Backdrop?maxWidth=300`;
    }
    return `${currentServer?.address}/Items/${item.Id}/Images/Backdrop?maxWidth=300`;
  }, [item, currentServer]);

  const handlePress = async () => {
    if (!currentServer || !item.Id) return;

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

  return (
    <TouchableOpacity
      style={[styles.card, { width: width * 0.5, backgroundColor }]}
      onPress={handlePress}
    >
      {imageUrl ? (
        <View style={styles.coverContainer}>
          <Image source={{ uri: imageUrl }} style={styles.cover} contentFit="cover" />
          {playedPercentage !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${playedPercentage}%`,
                      backgroundColor: progressColor,
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
      <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
        {item.SeriesName || item.Name || '未知标题'}
      </Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
        {getSubtitle(item)}
      </Text>
    </TouchableOpacity>
  );
}

export function SeriesCard({
  item,
  onPress,
  currentServer,
}: {
  item: BaseItemDto;
  onPress: () => void;
  currentServer?: MediaServerInfo | null;
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const { width } = useWindowDimensions();
  const imageUrl = useMemo(() => {
    if (!currentServer) return null;
    const imgId = item.SeriesId ?? item.Id;
    if (item.ImageTags?.Primary) {
      return `${currentServer.address}/Items/${imgId}/Images/Primary?maxWidth=400`;
    }
    return `${currentServer.address}/Items/${imgId}/Images/Backdrop?maxWidth=400`;
  }, [item, currentServer]);

  return (
    <TouchableOpacity style={[styles.card, { width: width * 0.4, backgroundColor }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.posterCover} contentFit="cover" />
      ) : (
        <View style={[styles.posterCover, { justifyContent: 'center', alignItems: 'center' }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={48} color="#ccc" />
        </View>
      )}
      <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
        {item.SeriesName || item.Name || '未知标题'}
      </Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
        {getSubtitle(item)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 16,
    overflow: 'hidden',
    paddingBottom: 8,
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
