import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaItem } from '@/services/media/types';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '../ui/IconSymbol';

export const UserViewCard = ({ item, title }: { item: MediaItem; title: string }) => {
  const router = useRouter();
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  const mediaAdapter = useMediaAdapter();

  const imageInfo = mediaAdapter.getImageInfo({ item });

  return (
    <TouchableOpacity
      style={styles.userViewCard}
      onPress={() => {
        if (!item) return;
        router.push({
          pathname: '/folder/[id]',
          params: {
            id: item.id!,
            name: title,
            itemTypes: item.collectionType === 'movies' ? 'Movie' : 'Series',
          },
        });
      }}
    >
      {imageInfo.url ? (
        <Image
          source={{ uri: imageInfo.url }}
          placeholder={{
            blurhash: imageInfo.blurhash,
          }}
          style={styles.cover}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.cover, { justifyContent: 'center', alignItems: 'center' }]}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={48} color="#ccc" />
        </View>
      )}
      <View style={styles.userViewInfo}>
        <Text style={[styles.userViewTitle, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userViewCard: {
    overflow: 'hidden',
  },
  userViewInfo: {
    padding: 8,
  },
  userViewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  cover: {
    width: 200,
    aspectRatio: 16 / 9,
    backgroundColor: '#eee',
    borderRadius: 12,
  },
});
