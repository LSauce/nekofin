import { MediaCard, SeriesCard } from '@/components/media/Card';
import PageScrollView from '@/components/PageScrollView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { getRecommendedSearchKeywords, searchItems } from '@/services/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React, { RefObject, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SearchBarCommands } from 'react-native-screens';

export default function SearchScreen() {
  const { currentApi, currentServer } = useMediaServers();
  const [keyword, setKeyword] = useState<string>('');
  const [selected, setSelected] = useState<string>('');

  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const { accentColor } = useAccentColor();

  const searchBarRef = useRef<SearchBarCommands>(null);

  const canQuery = Boolean(currentApi && currentServer?.userId);

  const { data: suggestions = [], isLoading: loadingSuggest } = useQuery<string[]>({
    enabled: canQuery,
    queryKey: ['recommend-keywords', currentServer?.id],
    queryFn: async () => {
      if (!currentApi || !currentServer?.userId) return [];
      return await getRecommendedSearchKeywords(currentApi, currentServer.userId, 20);
    },
  });

  const debouncedKeyword = useDebouncedValue(keyword, 300);

  const effectiveKeyword = useMemo(
    () => selected || debouncedKeyword,
    [selected, debouncedKeyword],
  );

  const {
    data: results = [],
    isLoading: loadingResults,
    isError: isResultsError,
    refetch,
  } = useQuery<BaseItemDto[]>({
    enabled: canQuery && effectiveKeyword.length > 0,
    queryKey: ['search-items', currentServer?.id, effectiveKeyword],
    queryFn: async () => {
      if (!currentApi || !currentServer?.userId) return [];
      return await searchItems(currentApi, currentServer.userId, effectiveKeyword, 120);
    },
  });

  const groupedResults = useMemo(() => {
    const typeToItems: Record<string, BaseItemDto[]> = {};
    results.forEach((item) => {
      const key = item.Type || 'Other';
      if (!typeToItems[key]) typeToItems[key] = [];
      typeToItems[key].push(item);
    });
    const order = ['Series', 'Movie', 'Episode', 'MusicVideo', 'Other'];
    const titleMap: Record<string, string> = {
      Series: '剧集',
      Movie: '电影',
      Episode: '单集',
      MusicVideo: '音乐视频',
      Other: '其他',
    };
    const entries = Object.entries(typeToItems);
    entries.sort(
      (a, b) =>
        (order.indexOf(a[0]) === -1 ? 999 : order.indexOf(a[0])) -
        (order.indexOf(b[0]) === -1 ? 999 : order.indexOf(b[0])),
    );
    return entries.map(([type, items]) => ({ key: type, title: titleMap[type] || type, items }));
  }, [results]);

  const renderItem = ({ item }: { item: BaseItemDto }) => {
    if (item.Type === 'Series') {
      return <SeriesCard item={item} />;
    }
    return <MediaCard item={item} />;
  };

  return (
    <PageScrollView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            ref: searchBarRef as RefObject<SearchBarCommands>,
            placeholder: '搜索影片、剧集...',
            onChangeText: (t) => {
              const text = t.nativeEvent.text;
              if (text.length === 0) {
                setSelected('');
              }
              setKeyword(text);
            },
            onCancelButtonPress: () => {
              setKeyword('');
              setSelected('');
            },
            hideWhenScrolling: false,
            cancelButtonText: '取消',
          },
        }}
      />

      {effectiveKeyword.length === 0 && suggestions.length > 0 && (
        <View style={styles.suggestContainerCentered}>
          <Text style={[styles.suggestText, { color: textColor, fontSize: 20 }]}>建议</Text>
          <View style={styles.suggestColumn}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  setKeyword(s);
                  setSelected(s);
                  searchBarRef.current?.setText(s);
                }}
              >
                <Text style={[styles.suggestText, { color: accentColor }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {effectiveKeyword.length > 0 && (
        <View style={styles.resultsHeader}>
          {(loadingResults || loadingSuggest) && (
            <ActivityIndicator size="small" color={accentColor} />
          )}
        </View>
      )}

      {effectiveKeyword.length > 0 && groupedResults.length === 0 && !loadingResults && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>没有找到相关内容</Text>
          {isResultsError && (
            <TouchableOpacity
              style={[styles.retryButton, { borderColor: accentColor }]}
              onPress={() => refetch()}
            >
              <Text style={[styles.retryText, { color: accentColor }]}>重试</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {effectiveKeyword.length > 0 &&
        groupedResults.map((group) => (
          <View key={group.key} style={styles.groupSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{group.title}</Text>
            <FlatList
              data={group.items}
              renderItem={renderItem}
              keyExtractor={(item) => item.Id!}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalListContainer}
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            />
          </View>
        ))}
    </PageScrollView>
  );
}

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = React.useState<string>(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  hintsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  hintsContent: {
    gap: 8,
  },
  hintChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  hintText: {
    fontSize: 14,
  },
  suggestContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  suggestContainerCentered: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  suggestChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestColumn: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestText: {
    fontSize: 14,
    textAlign: 'center',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupSection: {
    paddingTop: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    rowGap: 16,
  },
  horizontalListContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    columnGap: 16,
  },
  gridItem: {
    width: '48%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
