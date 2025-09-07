import { useThemeColor } from '@/hooks/useThemeColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { BaseItemDto, BaseItemPerson } from '@jellyfin/sdk/lib/generated-client';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { EpisodeCard, SeriesCard } from '../media/Card';
import { ThemedText } from '../ThemedText';
import { detailViewStyles, ItemOverview } from './common';
import { PersonItem } from './PersonItem';

export const EpisodeModeContent = ({
  seasons,
  episodes = [],
  people,
  similarItems,
  item,
}: {
  seasons: BaseItemDto[];
  episodes?: BaseItemDto[];
  people: BaseItemPerson[];
  similarItems: BaseItemDto[];
  item: BaseItemDto;
}) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const router = useRouter();
  const { accentColor } = useAccentColor();

  const [selectedEpisode, setSelectedEpisode] = useState<BaseItemDto>(item ?? episodes[0]);
  const flatListRef = useRef<FlatList<BaseItemDto>>(null);

  const initialIndex = useMemo(() => {
    return episodes.findIndex((e) => e.Id === selectedEpisode.Id);
  }, [episodes, selectedEpisode]);

  const scrollToIndex = useCallback((index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewOffset: 20 });
    }
  }, []);

  useEffect(() => {
    scrollToIndex(initialIndex);
  }, [initialIndex, scrollToIndex]);

  return (
    <>
      <View style={{ gap: 8 }}>
        <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: textColor }}>
          {selectedEpisode.Name}
        </ThemedText>
        <ThemedText style={{ fontSize: 14, color: subtitleColor }}>
          {`${selectedEpisode.SeasonName} 第${selectedEpisode.IndexNumber}集`}
        </ThemedText>
      </View>

      {!!selectedEpisode?.Id && (
        <TouchableOpacity
          onPress={() => {
            router.push({ pathname: '/player', params: { itemId: selectedEpisode.Id! } });
          }}
          style={[detailViewStyles.playButton, { backgroundColor: accentColor }]}
        >
          <Text style={detailViewStyles.playButtonText}>播放</Text>
        </TouchableOpacity>
      )}

      <ItemOverview item={selectedEpisode} />

      {episodes && episodes.length > 0 && (
        <View style={detailViewStyles.sectionBlock}>
          <Text style={[detailViewStyles.sectionTitle, { color: textColor }]}>
            更多来自 {selectedEpisode.SeasonName}
          </Text>
          <FlatList
            ref={flatListRef}
            horizontal
            data={episodes}
            style={detailViewStyles.edgeToEdge}
            onScrollToIndexFailed={() => {
              setTimeout(() => {
                scrollToIndex(initialIndex);
              }, 50);
            }}
            renderItem={({ item: ep }) => {
              const isSelected = ep.Id === selectedEpisode.Id;
              return (
                <EpisodeCard
                  item={ep}
                  style={[detailViewStyles.horizontalCard, { opacity: isSelected ? 1 : 0.8 }]}
                  imgType="Primary"
                  onPress={() => {
                    setSelectedEpisode(ep);
                  }}
                />
              );
            }}
            keyExtractor={(item) => item.Id!}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={detailViewStyles.horizontalList}
          />
        </View>
      )}
      {seasons && seasons.length > 0 && (
        <View style={detailViewStyles.sectionBlock}>
          <Text style={[detailViewStyles.sectionTitle, { color: textColor }]}>季度</Text>
          <FlatList
            horizontal
            data={seasons}
            style={detailViewStyles.edgeToEdge}
            renderItem={({ item }) => (
              <SeriesCard
                item={item}
                style={detailViewStyles.seasonCard}
                imgType="Primary"
                hideSubtitle
              />
            )}
            keyExtractor={(item) => item.Id!}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={detailViewStyles.horizontalList}
          />
        </View>
      )}

      {people && people.length > 0 && (
        <View style={detailViewStyles.sectionBlock}>
          <Text style={[detailViewStyles.sectionTitle, { color: textColor }]}>演职人员</Text>
          <FlatList
            horizontal
            data={people}
            style={detailViewStyles.edgeToEdge}
            renderItem={({ item }) => <PersonItem item={item} />}
            keyExtractor={(item) => `${item.Id ?? item.Name}-${item.Role ?? ''}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={detailViewStyles.horizontalList}
          />
        </View>
      )}

      {similarItems && similarItems.length > 0 && (
        <View style={detailViewStyles.sectionBlock}>
          <Text style={[detailViewStyles.sectionTitle, { color: textColor }]}>更多类似的</Text>
          <FlatList
            horizontal
            data={similarItems}
            style={detailViewStyles.edgeToEdge}
            renderItem={({ item }) => (
              <SeriesCard item={item} style={detailViewStyles.seasonCard} imgType="Primary" />
            )}
            keyExtractor={(item) => item.Id!}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={detailViewStyles.horizontalList}
          />
        </View>
      )}
    </>
  );
};
