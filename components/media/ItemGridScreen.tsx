import { MediaCard, SeriesCard } from '@/components/media/Card';
import { useGridLayout } from '@/hooks/useGridLayout';
import { MediaFilters } from '@/hooks/useMediaFilters';
import useRefresh from '@/hooks/useRefresh';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { getAvailableFilters } from '@/services/jellyfin';
import { BaseItemDto, BaseItemKind, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
import { InfiniteData, UseInfiniteQueryResult, useQuery } from '@tanstack/react-query';
import { useNavigation } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterButton } from '../ui/FilterButton';

export type ItemGridScreenProps = {
  title: string;
  query: UseInfiniteQueryResult<
    InfiniteData<BaseItemDto[] | { items: BaseItemDto[]; total: number }, unknown>,
    unknown
  >;
  type?: 'series' | 'episode';
  filters?: MediaFilters;
  onChangeFilters?: (next: MediaFilters) => void;
};

export function ItemGridScreen({
  title,
  query,
  type,
  filters,
  onChangeFilters,
}: ItemGridScreenProps) {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const { accentColor } = useAccentColor();
  const { numColumns, itemWidth, gap } = useGridLayout(type);

  const navigation = useNavigation();
  const { currentServer, currentApi: api } = useMediaServers();

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    query;

  const useThreeCols = type === 'series';

  const items = useMemo(() => {
    const pages = data?.pages ?? [];
    const merged: BaseItemDto[] = [];
    const seen = new Set<string | undefined>();
    for (const page of pages) {
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

  const { data: availableFilters } = useQuery({
    enabled: !!api && !!currentServer && !!onChangeFilters,
    queryKey: ['available-filters', currentServer?.id],
    queryFn: async () => {
      const res = await getAvailableFilters(api!, currentServer!.userId);
      return res;
    },
    staleTime: 10 * 60 * 1000,
  });

  const renderItem = ({ item }: { item: BaseItemDto }) => {
    const itemStyle = { width: itemWidth };

    return useThreeCols ? (
      <SeriesCard item={item} style={itemStyle} />
    ) : (
      <MediaCard item={item} style={itemStyle} />
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

  useEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
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
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={`${numColumns}-cols`}
      style={{ backgroundColor }}
      contentContainerStyle={styles.listContainer}
      columnWrapperStyle={numColumns > 1 ? { columnGap: gap } : undefined}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        onChangeFilters ? (
          <View style={styles.filterBar}>
            <ScrollView
              style={{ marginHorizontal: -20 }}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <FilterButton
                label="年份"
                title="选择年份"
                options={[
                  { label: '不限' },
                  ...(availableFilters?.years ?? []).map((y) => ({
                    label: String(y),
                    value: String(y),
                    active: filters?.year === y,
                  })),
                ]}
                onSelect={(v) => {
                  onChangeFilters?.({
                    includeItemTypes: filters?.includeItemTypes,
                    sortBy: filters?.sortBy,
                    sortOrder: filters?.sortOrder,
                    year: v ? Number(v) : undefined,
                    tags: filters?.tags,
                    onlyUnplayed: filters?.onlyUnplayed,
                  });
                }}
              />
              <FilterButton
                label="标签"
                title="选择标签"
                options={[
                  { label: '不限' },
                  ...(availableFilters?.tags ?? []).map((t) => ({
                    label: t,
                    value: t,
                    active: !!filters?.tags?.includes(t),
                  })),
                ]}
                onSelect={(v) => {
                  if (!v) {
                    onChangeFilters?.({
                      includeItemTypes: filters?.includeItemTypes,
                      sortBy: filters?.sortBy,
                      sortOrder: filters?.sortOrder,
                      year: filters?.year,
                      tags: undefined,
                      onlyUnplayed: filters?.onlyUnplayed,
                    });
                  } else {
                    const nextTags = [v];
                    onChangeFilters?.({
                      includeItemTypes: filters?.includeItemTypes,
                      sortBy: filters?.sortBy,
                      sortOrder: filters?.sortOrder,
                      year: filters?.year,
                      tags: nextTags,
                      onlyUnplayed: filters?.onlyUnplayed,
                    });
                  }
                }}
              />
              <FilterButton
                label="排序依据"
                title="选择排序依据"
                options={[
                  {
                    label: '名称',
                    value: 'SortName',
                    active: (filters?.sortBy?.[0] ?? 'SortName') === 'SortName',
                  },
                  {
                    label: '随机',
                    value: 'Random',
                    active: (filters?.sortBy?.[0] ?? '') === 'Random',
                  },
                  {
                    label: '公众评分',
                    value: 'CommunityRating',
                    active: (filters?.sortBy?.[0] ?? '') === 'CommunityRating',
                  },
                  {
                    label: '剧集添加日期',
                    value: 'DateCreated',
                    active: (filters?.sortBy?.[0] ?? '') === 'DateCreated',
                  },
                  {
                    label: '播放日期',
                    value: 'DatePlayed',
                    active: (filters?.sortBy?.[0] ?? '') === 'DatePlayed',
                  },
                  {
                    label: '家长分级',
                    value: 'OfficialRating',
                    active: (filters?.sortBy?.[0] ?? '') === 'OfficialRating',
                  },
                  {
                    label: '发行日期',
                    value: 'PremiereDate',
                    active: (filters?.sortBy?.[0] ?? '') === 'PremiereDate',
                  },
                ]}
                onSelect={(v) => {
                  onChangeFilters?.({
                    includeItemTypes: filters?.includeItemTypes,
                    sortBy: v ? [v as ItemSortBy] : filters?.sortBy,
                    sortOrder: filters?.sortOrder,
                    year: filters?.year,
                    tags: filters?.tags,
                    onlyUnplayed: filters?.onlyUnplayed,
                  });
                }}
              />
              <FilterButton
                label="排序顺序"
                title="选择排序顺序"
                options={[
                  {
                    label: '降序',
                    value: 'Descending',
                    active: (filters?.sortOrder ?? 'Descending') === 'Descending',
                  },
                  {
                    label: '升序',
                    value: 'Ascending',
                    active: (filters?.sortOrder ?? 'Descending') === 'Ascending',
                  },
                ]}
                onSelect={(v) => {
                  onChangeFilters?.({
                    includeItemTypes: filters?.includeItemTypes,
                    sortBy: filters?.sortBy,
                    sortOrder: (v as 'Ascending' | 'Descending') ?? filters?.sortOrder,
                    year: filters?.year,
                    tags: filters?.tags,
                    onlyUnplayed: filters?.onlyUnplayed,
                  });
                }}
              />
            </ScrollView>
          </View>
        ) : undefined
      }
      ListFooterComponent={listFooter}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: textColor }]}>暂无内容</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    paddingBottom: 8,
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    columnGap: 8,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    rowGap: 16,
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
