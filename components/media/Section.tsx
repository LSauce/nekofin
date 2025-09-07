import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
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
  items: BaseItemDto[];
  isLoading: boolean;
  type?: 'episode' | 'series';
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  return (
    <View style={[styles.section, { backgroundColor }]}>
      {isLoading ? (
        <SkeletonSectionHeader />
      ) : (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>查看所有</Text>
            <MaterialIcons name="keyboard-arrow-right" size={20} color={styles.viewAllText.color} />
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
            type === 'episode' ? <EpisodeCard item={item} /> : <SeriesCard item={item} />
          }
          keyExtractor={(item) => item.Id!}
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
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#9C4DFF',
    fontSize: 16,
  },
  sectionListContent: {
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
