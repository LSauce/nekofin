import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { MediaItem, MediaPerson } from '@/services/media/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MenuView } from '@react-native-menu/menu';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { EpisodeCard, SeriesCard } from '../media/Card';
import { ThemedText } from '../ThemedText';
import { detailViewStyles, ItemOverview, PlayButton } from './common';
import { useDetailView } from './DetailViewContext';
import { PersonItem } from './PersonItem';

export const EpisodeModeContent = ({
  seasons,
  episodes = [],
  people,
  similarItems,
  item,
  seasonId,
}: {
  seasons: MediaItem[];
  episodes?: MediaItem[];
  people: MediaPerson[];
  similarItems: MediaItem[];
  item: MediaItem;
  seasonId?: string;
}) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const { setTitle, setBackgroundImageUrl, setSelectedItem } = useDetailView();
  const mediaAdapter = useMediaAdapter();
  const { currentServer } = useMediaServers();

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(() => {
    return seasonId || (seasons.length > 0 ? seasons[0].id : '');
  });

  const [selectedEpisode, setSelectedEpisode] = useState<MediaItem>(item ?? episodes[0]);
  const flatListRef = useRef<FlatList<MediaItem>>(null);

  const { data: currentSeasonEpisodes = [] } = useQuery({
    queryKey: ['episodes', selectedSeasonId, currentServer?.userId],
    queryFn: async () => {
      if (!currentServer || !selectedSeasonId) return [];
      const response = await mediaAdapter.getEpisodesBySeason({
        seasonId: selectedSeasonId,
        userId: currentServer.userId,
      });
      return response.data.Items ?? [];
    },
    enabled: !!currentServer && !!selectedSeasonId,
  });

  const displayEpisodes = selectedSeasonId ? currentSeasonEpisodes : episodes;

  useEffect(() => {
    if (displayEpisodes.length === 0) return;

    const episodeExists = displayEpisodes.some((e) => e.id === selectedEpisode.id);
    if (!episodeExists) {
      setSelectedEpisode(displayEpisodes[0]);
    }
  }, [displayEpisodes, selectedEpisode]);

  useEffect(() => {
    const index = displayEpisodes.findIndex((e) => e.id === selectedEpisode.id);
    if (flatListRef.current && index >= 0) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewOffset: 20 });
    }
  }, [displayEpisodes, selectedEpisode]);

  useEffect(() => {
    setTitle(selectedEpisode.name);
    setSelectedItem(selectedEpisode);

    const imageInfo = mediaAdapter.getImageInfo({ item: selectedEpisode });
    setBackgroundImageUrl(imageInfo.url);
  }, [selectedEpisode, setTitle, setSelectedItem, mediaAdapter, setBackgroundImageUrl]);

  return (
    <>
      <View style={{ gap: 8 }}>
        <ThemedText style={{ fontSize: 14, color: subtitleColor }}>
          {`${selectedEpisode.seriesName} 第${selectedEpisode.indexNumber}集`}
        </ThemedText>
      </View>

      {!!selectedEpisode?.id && <PlayButton item={selectedEpisode} />}

      <ItemOverview item={selectedEpisode} />

      {seasons && seasons.length > 0 && (
        <View
          style={[
            detailViewStyles.sectionBlock,
            { flexDirection: 'row', alignItems: 'center', gap: 12 },
          ]}
        >
          <MenuView
            actions={seasons.map((season) => ({
              id: season.id!,
              title: season.name || `第${season.indexNumber}季`,
              state: season.id === selectedSeasonId ? 'on' : 'off',
            }))}
            onPressAction={({ nativeEvent }) => {
              setSelectedSeasonId(nativeEvent.event);
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                gap: 6,
              }}
            >
              <Text style={{ color: textColor, fontSize: 16 }}>
                {seasons.find((s) => s.id === selectedSeasonId)?.name ||
                  `第${seasons.find((s) => s.id === selectedSeasonId)?.indexNumber}季`}
              </Text>
              <Ionicons name="chevron-down" size={16} color={textColor} />
            </TouchableOpacity>
          </MenuView>
        </View>
      )}

      {displayEpisodes && displayEpisodes.length > 0 && (
        <View style={detailViewStyles.sectionBlock}>
          <FlatList
            ref={flatListRef}
            horizontal
            data={displayEpisodes}
            style={detailViewStyles.edgeToEdge}
            onScrollToIndexFailed={() => {
              setTimeout(() => {
                const index = displayEpisodes.findIndex((e) => e.id === selectedEpisode.id);
                if (flatListRef.current && index >= 0) {
                  flatListRef.current.scrollToIndex({ index, animated: true, viewOffset: 20 });
                }
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
