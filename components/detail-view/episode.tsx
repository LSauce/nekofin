import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { MediaItem, MediaPerson } from '@/services/media/types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { EpisodeCard, SeriesCard } from '../media/Card';
import { ThemedText } from '../ThemedText';
import { detailViewStyles, ItemOverview } from './common';
import { useDetailView } from './DetailViewContext';
import { PersonItem } from './PersonItem';

export const EpisodeModeContent = ({
  seasons,
  episodes = [],
  people,
  similarItems,
  item,
}: {
  seasons: MediaItem[];
  episodes?: MediaItem[];
  people: MediaPerson[];
  similarItems: MediaItem[];
  item: MediaItem;
}) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const router = useRouter();
  const { accentColor } = useAccentColor();
  const { setTitle, setBackgroundImageUrl, setSelectedItem } = useDetailView();
  const mediaAdapter = useMediaAdapter();

  const [selectedEpisode, setSelectedEpisode] = useState<MediaItem>(item ?? episodes[0]);
  const flatListRef = useRef<FlatList<MediaItem>>(null);

  const initialIndex = useMemo(() => {
    return episodes.findIndex((e) => e.id === selectedEpisode.id);
  }, [episodes, selectedEpisode]);

  const scrollToIndex = useCallback((index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewOffset: 20 });
    }
  }, []);

  useEffect(() => {
    scrollToIndex(initialIndex);
  }, [initialIndex, scrollToIndex]);

  useEffect(() => {
    setTitle(selectedEpisode.name);
    setSelectedItem(selectedEpisode);
  }, [selectedEpisode.name, selectedEpisode, setTitle, setSelectedItem]);

  useEffect(() => {
    const imageInfo = mediaAdapter.getImageInfo({
      item: selectedEpisode,
    });
    setBackgroundImageUrl(imageInfo.url);
  }, [mediaAdapter, selectedEpisode, setBackgroundImageUrl]);

  return (
    <>
      <View style={{ gap: 8 }}>
        <ThemedText style={{ fontSize: 14, color: subtitleColor }}>
          {`${selectedEpisode.seriesName} 第${selectedEpisode.indexNumber}集`}
        </ThemedText>
      </View>

      {!!selectedEpisode?.id && (
        <TouchableOpacity
          onPress={() => {
            router.push({ pathname: '/player', params: { itemId: selectedEpisode.id! } });
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
            更多来自 {selectedEpisode.seriesName}
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
              const isSelected = ep.id === selectedEpisode.id;
              return (
                <EpisodeCard
                  item={ep}
                  style={[detailViewStyles.horizontalCard, { opacity: isSelected ? 1 : 0.8 }]}
                  imgType="Primary"
                  onPress={() => {
                    setSelectedEpisode(ep);
                  }}
                  imgInfo={mediaAdapter.getImageInfo({
                    item: ep,
                  })}
                />
              );
            }}
            keyExtractor={(item) => item.id!}
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
            renderItem={({ item }) => <SeriesCard item={item} imgType="Primary" hideSubtitle />}
            keyExtractor={(item) => item.id!}
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
            keyExtractor={(item) => `${item.id ?? item.name}-${item.role ?? ''}`}
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
            renderItem={({ item }) => <SeriesCard item={item} imgType="Primary" />}
            keyExtractor={(item) => item.id!}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={detailViewStyles.horizontalList}
          />
        </View>
      )}
    </>
  );
};
