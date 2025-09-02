import { MediaCard, SeriesCard } from '@/components/media/Card';
import useRefresh from '@/hooks/useRefresh';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ItemGridScreenProps = {
  title: string;
  query: UseInfiniteQueryResult<
    InfiniteData<BaseItemDto[] | { items: BaseItemDto[]; total: number }, unknown>,
    unknown
  >;
  type?: 'series' | 'episode';
};

export function ItemGridScreen({ title, query, type }: ItemGridScreenProps) {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const { accentColor } = useAccentColor();

  const {
    data,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;

  const useThreeCols = type === 'series';

  const items = useMemo(() => {
    const pages = data?.pages ?? [];
    const merged: BaseItemDto[] = [];
    const seen = new Set<string | undefined>();
    for (const page of pages as (BaseItemDto[] | { items: BaseItemDto[]; total: number })[]) {
      const list = Array.isArray(page) ? page : page.items;
      for (const it of list) {
        const id = it.Id;
        if (id && !seen.has(id)) {
          merged.push(it);
          seen.add(id);
        }
      }
    }
    return merged;
  }, [data]);

  const { refreshing, onRefresh } = useRefresh(refetch);

  const renderItem = ({ item }: { item: BaseItemDto }) => {
    return useThreeCols ? (
      <SeriesCard item={item} style={useThreeCols ? styles.gridItemThird : styles.gridItem} />
    ) : (
      <MediaCard item={item} style={styles.gridItem} />
    );
  };

  const keyExtractor = (item: BaseItemDto) => item.Id!;

  const handleEndReached = async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    await fetchNextPage();
  };

  const listFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoadingContainer}>
          <ActivityIndicator size="small" color={accentColor} />
        </View>
      );
    }
    if (!hasNextPage) return <View style={{ height: 16 }} />;
    return <View style={{ height: 16 }} />;
  }, [isFetchingNextPage, hasNextPage, accentColor]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <Stack.Screen options={{ title }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <Stack.Screen options={{ title }} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: textColor }]}>加载失败，请重试</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: accentColor }]}
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
    <View style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={useThreeCols ? 3 : 2}
        key={useThreeCols ? '3-cols' : '2-cols'}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={useThreeCols ? styles.rowLeft : styles.row}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textColor }]}>暂无内容</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    rowGap: 16,
  },
  row: {
    columnGap: 16,
  },
  rowLeft: {
    columnGap: 12,
  },
  gridItem: {
    width: '48%',
  },
  gridItemThird: {
    width: '31%',
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
  footerLoadingContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
