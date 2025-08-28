import SeriesDetailView from '@/components/media/SeriesDetailView';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function SeasonDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: '季度' }} />
      <SeriesDetailView itemId={id!} mode="season" />
    </>
  );
}
