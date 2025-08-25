import { MediaCard, SeriesCard } from '@/components/media/Card';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ItemGridScreenProps = {
  title: string;
  loadItems: () => Promise<BaseItemDto[]>;
  type?: 'series' | 'episode';
};

export function ItemGridScreen({ title, loadItems, type }: ItemGridScreenProps) {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const { currentServer } = useMediaServers();

  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<BaseItemDto[]>({
    queryKey: ['items', title],
    queryFn: loadItems,
  });

  const useThreeCols = type === 'series';

  const renderItem = ({ item }: { item: BaseItemDto }) => {
    return useThreeCols ? (
      <SeriesCard
        item={item}
        currentServer={currentServer}
        style={useThreeCols ? styles.gridItemThird : styles.gridItem}
      />
    ) : (
      <MediaCard item={item} currentServer={currentServer} style={styles.gridItem} />
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9C4DFF" />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: textColor }]}>加载失败，请重试</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              refetch();
            }}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {items.length > 0 ? (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.Id!}
          numColumns={useThreeCols ? 3 : 2}
          key={useThreeCols ? '3-cols' : '2-cols'}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={useThreeCols ? styles.rowLeft : styles.row}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: textColor }]}>暂无内容</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: '48%',
    marginRight: 0,
    marginBottom: 20,
  },
  gridItemThird: {
    width: '30%',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#9C4DFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  },
});
