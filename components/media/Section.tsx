import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaServerInfo } from '@/lib/contexts/MediaServerContext';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MediaCard, SeriesCard } from './Card';

export function Section({
  title,
  onViewAll,
  items,
  isLoading,
  currentServer,
  type = 'episode',
}: {
  title: string;
  onViewAll: () => void;
  items: BaseItemDto[];
  isLoading: boolean;
  currentServer?: MediaServerInfo | null;
  type?: 'episode' | 'series';
}) {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>查看所有 {'>'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>查看所有 {'>'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无内容</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, { backgroundColor }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>查看所有 {'>'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sectionList}
        contentContainerStyle={styles.sectionListContent}
        renderItem={({ item }) =>
          type === 'episode' ? (
            <MediaCard item={item} onPress={() => {}} currentServer={currentServer} />
          ) : (
            <SeriesCard item={item} onPress={() => {}} currentServer={currentServer} />
          )
        }
        keyExtractor={(item) => item.Id!}
      />
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
  viewAllText: {
    color: '#9C4DFF',
    fontSize: 16,
  },
  sectionList: {
    marginLeft: 20,
  },
  sectionListContent: {
    paddingRight: 20,
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
