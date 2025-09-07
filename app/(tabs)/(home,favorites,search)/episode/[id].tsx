import DetailView from '@/components/detailview';
import { useLocalSearchParams } from 'expo-router';

export default function EpisodeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <DetailView itemId={id} mode="episode" />;
}
