import { useThemeColor } from '@/hooks/useThemeColor';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { formatDurationFromTicks } from '@/lib/utils';
import { markItemPlayed, markItemUnplayed } from '@/services/jellyfin';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useQueryClient } from '@tanstack/react-query';
import { Text, TouchableOpacity, View } from 'react-native';

import { EpisodeCard } from '../media/Card';
import { ThemedText } from '../ThemedText';
import { detailViewStyles, ItemOverview } from './common';

export const SeasonModeContent = ({
  episodes,
  item,
}: {
  episodes: BaseItemDto[];
  item: BaseItemDto;
}) => {
  const { currentApi, currentServer } = useMediaServers();
  const queryClient = useQueryClient();
  const subtitleColor = useThemeColor({ light: '#666', dark: '#999' }, 'text');

  return (
    <>
      <ItemOverview item={item} />
      <View style={detailViewStyles.listContainer}>
        {episodes.map((item) => (
          <View key={item.Id} style={detailViewStyles.listItem}>
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
                key={item.Id}
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
                <ThemedText style={{ lineHeight: 20 }}>{item.Name}</ThemedText>
                <ThemedText style={{ color: subtitleColor, fontSize: 12, lineHeight: 16 }}>
                  {`S${item.ParentIndexNumber}E${item.IndexNumber}`}
                </ThemedText>
                <ThemedText style={{ color: subtitleColor, fontSize: 12, lineHeight: 16 }}>
                  {formatDurationFromTicks(item.RunTimeTicks)}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  if (!currentServer?.userId || !item.Id) return;
                  const isPlayed = !!item.UserData?.Played;
                  if (isPlayed) {
                    await markItemUnplayed(currentApi!, currentServer.userId, item.Id);
                  } else {
                    await markItemPlayed(currentApi!, currentServer.userId, item.Id);
                  }
                  await queryClient.invalidateQueries({
                    queryKey: ['detail-bundle', 'season', item.SeasonId],
                  });
                }}
                style={{ paddingHorizontal: 8, alignSelf: 'flex-start' }}
              >
                <MaterialCommunityIcons
                  name={item.UserData?.Played ? 'check-circle' : 'check-circle-outline'}
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
                {item.Overview?.trim()}
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
