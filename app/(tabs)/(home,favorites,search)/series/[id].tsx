import SeriesDetailView from '@/components/media/SeriesDetailView';
import { useLocalSearchParams } from 'expo-router';

export default function SeriesDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SeriesDetailView itemId={id!} mode="series" />;
}
