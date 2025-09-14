import { useThemeColor } from '@/hooks/useThemeColor';
import { MediaItem, MediaPerson } from '@/services/media/types';
import { FlatList, Text, View } from 'react-native';

import { EpisodeCard, SeriesCard } from '../media/Card';
import { detailViewStyles, ItemInfoList, ItemMeta, ItemOverview } from './common';
import { PersonItem } from './PersonItem';

export const SeriesModeContent = ({
  seasons,
  nextUpItems,
  people,
  similarItems,
  item,
}: {
  seasons: MediaItem[];
  nextUpItems: MediaItem[];
  people: MediaPerson[];
  similarItems: MediaItem[];
  item: MediaItem;
}) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  return (
    <>
      <ItemMeta item={item} />
      <ItemOverview item={item} />
      <ItemInfoList item={item} />

      {nextUpItems.length > 0 && (
        <View style={detailViewStyles.sectionBlock}>
          <Text style={[detailViewStyles.sectionTitle, { color: textColor }]}>接下来</Text>
          <FlatList
            horizontal
            data={nextUpItems}
            style={detailViewStyles.edgeToEdge}
            renderItem={({ item }) => (
              <EpisodeCard item={item} style={detailViewStyles.horizontalCard} imgType="Primary" />
            )}
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
            renderItem={({ item }) => (
              <SeriesCard
                item={item}
                style={detailViewStyles.seasonCard}
                imgType="Primary"
                hideSubtitle
              />
            )}
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
            keyExtractor={(item) => `${item.id ?? item.name}-${item.type ?? ''}`}
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
            keyExtractor={(item) => item.id!}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={detailViewStyles.horizontalList}
          />
        </View>
      )}
    </>
  );
};
