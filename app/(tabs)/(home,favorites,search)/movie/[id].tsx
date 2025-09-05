import SeriesDetailView from '@/components/detailview';
import { useLocalSearchParams } from 'expo-router';

export default function MovieDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SeriesDetailView itemId={id!} mode="movie" />;
}
