import SeriesDetailView from '@/components/media/SeriesDetailView';
import { useLocalSearchParams } from 'expo-router';

export default function SeasonDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SeriesDetailView itemId={id!} mode="season" />;
}
