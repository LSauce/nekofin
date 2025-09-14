import DetailView from '@/components/detail-view';
import { useLocalSearchParams } from 'expo-router';

export default function EpisodeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <DetailView itemId={id} mode="episode" />;
}
