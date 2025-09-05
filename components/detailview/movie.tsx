import { useThemeColor } from '@/hooks/useThemeColor';
import { useAccentColor } from '@/lib/contexts/ThemeColorContext';
import { BaseItemDto, BaseItemPerson } from '@jellyfin/sdk/lib/generated-client';
import { useRouter } from 'expo-router';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { SeriesCard } from '../media/Card';
import { detailViewStyles, ItemInfoList, ItemMeta, ItemOverview } from './common';
import { PersonItem } from './PersonItem';

export const MovieModeContent = ({
  people,
  similarItems,
  item,
}: {
  people: BaseItemPerson[];
  similarItems: BaseItemDto[];
  item: BaseItemDto;
}) => {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const { accentColor } = useAccentColor();
  const router = useRouter();

  return (
    <>
      <ItemMeta item={item} />
      {!!item.Id && (
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: '/player',
              params: {
                itemId: item.Id!,
              },
            });
          }}
          style={[detailViewStyles.playButton, { backgroundColor: accentColor }]}
        >
          <Text style={detailViewStyles.playButtonText}>播放</Text>
        </TouchableOpacity>
      )}
      <ItemOverview item={item} />
      <ItemInfoList item={item} />

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
