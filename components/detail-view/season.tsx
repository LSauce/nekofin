import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { formatDurationFromTicks } from '@/lib/utils';
import { MediaItem } from '@/services/media/types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQueryClient } from '@tanstack/react-query';
import { Text, TouchableOpacity, View } from 'react-native';

import { EpisodeCard } from '../media/Card';
import { ThemedText } from '../ThemedText';
import { detailViewStyles, ItemOverview } from './common';
import { useDetailView } from './DetailViewContext';

export const SeasonModeContent = ({
  episodes,
  item,
}: {
  episodes: MediaItem[];
  item: MediaItem;
}) => {
  const { currentServer } = useMediaServers();
  const queryClient = useQueryClient();
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');
  const mediaAdapter = useMediaAdapter();
  const { query } = useDetailView();

  return (
    <>
      <ItemOverview item={item} />
      <View style={detailViewStyles.listContainer}>
        {episodes.map((item) => (
          <View key={item.id} style={detailViewStyles.listItem}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 8,
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <EpisodeCard
                key={item.id}
                item={item}
                style={{ width: 140, marginRight: 0 }}
                hideText
                imgType="Primary"
              />
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  alignSelf: 'flex-start',
                }}
              >
                <ThemedText style={{ lineHeight: 20 }}>{item.name}</ThemedText>
                <ThemedText style={{ color: subtitleColor, fontSize: 12, lineHeight: 16 }}>
                  {`S${item.parentIndexNumber}E${item.indexNumber}`}
                </ThemedText>
                <ThemedText style={{ color: subtitleColor, fontSize: 12, lineHeight: 16 }}>
                  {formatDurationFromTicks(item.runTimeTicks ?? 0)}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  if (!currentServer?.userId || !item.id) return;
                  const isPlayed = !!item.userData?.played;
                  if (isPlayed) {
                    await mediaAdapter.markItemUnplayed({
                      userId: currentServer.userId,
                      itemId: item.id!,
                    });
                  } else {
                    await mediaAdapter.markItemPlayed({
                      userId: currentServer.userId,
                      itemId: item.id!,
                    });
                  }
                  query?.refetch();
                }}
                style={{ paddingHorizontal: 8, alignSelf: 'flex-start' }}
              >
                <MaterialCommunityIcons
                  name={item.userData?.played ? 'check-circle' : 'check-circle-outline'}
                  size={24}
                  color={subtitleColor}
                />
              </TouchableOpacity>
            </View>
            <View>
              <ThemedText
                style={{ color: subtitleColor, fontSize: 12, lineHeight: 16 }}
                numberOfLines={3}
              >
                {item.overview?.trim()}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
      {episodes.length === 0 && (
        <View style={detailViewStyles.emptyContainer}>
          <Text style={[detailViewStyles.emptyText, { color: subtitleColor }]}>暂无内容</Text>
        </View>
      )}
    </>
  );
};
