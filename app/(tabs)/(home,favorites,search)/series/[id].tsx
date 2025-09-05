import SeriesDetailView from '@/components/detailview';
import { useLocalSearchParams } from 'expo-router';

export default function SeriesDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SeriesDetailView itemId={id!} mode="series" />;
}
