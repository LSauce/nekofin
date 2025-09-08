import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { MediaPerson } from '@/services/media/types';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';

export const PersonItem = ({ item }: { item: MediaPerson }) => {
  const mediaAdapter = useMediaAdapter();

  const imageInfo = mediaAdapter.getImageInfo({ item, opts: { width: 300 } });

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
      <ThemedText style={styles.personName} numberOfLines={1}>
        {item.name}
      </ThemedText>
      {!!item.role && (
        <ThemedText style={styles.personRole} numberOfLines={1}>
          {item.role}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 8,
    maxWidth: 120,
  },
  personRole: {
    fontSize: 12,
    lineHeight: 14,
    opacity: 0.7,
    maxWidth: 120,
    marginTop: 2,
  },
});
