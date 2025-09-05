import { getImageInfo } from '@/lib/utils/image';
import { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client/models/base-item-person';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';

export const PersonItem = ({ item }: { item: BaseItemPerson }) => {
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
      <ThemedText style={styles.personName} numberOfLines={1}>
        {item.Name}
      </ThemedText>
      {!!item.Role && (
        <ThemedText style={styles.personRole} numberOfLines={1}>
          {item.Role}
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
});
