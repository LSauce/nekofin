import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaItem } from '@/services/media/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SkeletonCard, SkeletonSectionHeader } from '../ui/Skeleton';
import { EpisodeCard, SeriesCard } from './Card';

export function Section({
  title,
  onViewAll,
  items,
  isLoading,
  type = 'episode',
}: {
  title: string;
  onViewAll: () => void;
  items: MediaItem[];
  isLoading: boolean;
  type?: 'episode' | 'series';
}) {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  return (
    <View>
      {isLoading ? (
        <SkeletonSectionHeader />
      ) : (
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: textColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Ionicons name="chevron-forward" size={20} color={textColor} />
          </TouchableOpacity>
        </View>
      )}
      {isLoading ? (
        <FlatList
          data={Array.from({ length: 5 })}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionListContent}
          renderItem={() => <SkeletonCard type={type} />}
          keyExtractor={(_, index) => `skeleton-${index}`}
        />
      ) : items.length > 0 ? (
        <FlatList
          data={items}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionListContent}
          renderItem={({ item }) =>
            type === 'episode' ? (
              <EpisodeCard item={item} style={{ width: 240 }} showPlayButton />
            ) : (
              <SeriesCard item={item} />
            )
          }
          keyExtractor={(item) => item.id!}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无内容</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  viewAllText: {
    fontSize: 16,
  },
  sectionListContent: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    gap: 12,
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
