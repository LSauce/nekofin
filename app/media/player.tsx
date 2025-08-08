import { VideoPlayer } from '@/components/VideoPlayer';
import { useLocalSearchParams } from 'expo-router';

export default function Player() {
  const { itemId } = useLocalSearchParams<{
    itemId: string;
  }>();

  return <VideoPlayer itemId={itemId} />;
}
