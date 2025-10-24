import DetailView from '@/components/detail-view';
import { useMediaAdapter } from '@/hooks/useMediaAdapter';
import { useQueryWithFocus } from '@/hooks/useQueryWithFocus';
import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { useLocalSearchParams } from 'expo-router';

export default function EpisodeDetailPage() {
  const { episodeId, seasonId } = useLocalSearchParams<{ episodeId?: string; seasonId?: string }>();
  const { currentServer } = useMediaServers();
  const mediaAdapter = useMediaAdapter();

  const { data: firstEpisode } = useQueryWithFocus({
    queryKey: ['first-episode-by-season', seasonId],
    queryFn: async () => {
      if (!seasonId || !currentServer?.userId) return null;
      const episodesRes = await mediaAdapter.getEpisodesBySeason({
        seasonId,
        userId: currentServer.userId,
      });
      const episodes = episodesRes.data.Items ?? [];
      return episodes.length > 0 ? episodes[0] : null;
    },
    enabled: !episodeId && !!seasonId && !!currentServer?.userId,
  });

  const itemId = episodeId ?? firstEpisode?.id;

  if (!itemId) {
    return null;
  }

  return <DetailView itemId={itemId} seasonId={seasonId} mode="episode" />;
}
