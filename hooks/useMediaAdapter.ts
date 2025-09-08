import { useMediaServers } from '@/lib/contexts/MediaServerContext';
import { getMediaAdapter } from '@/services/media';

export const useMediaAdapter = () => {
  const { currentServer } = useMediaServers();
  const adapter = getMediaAdapter(currentServer?.type);

  return adapter;
};
