import DetailView from '@/components/detail-view';
import { useLocalSearchParams } from 'expo-router';

export default function SeasonDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <DetailView itemId={id} mode="season" />;
}
