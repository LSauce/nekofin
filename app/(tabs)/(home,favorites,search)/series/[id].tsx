import DetailView from '@/components/detailview';
import { useLocalSearchParams } from 'expo-router';

export default function SeriesDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <DetailView itemId={id!} mode="series" />;
}
