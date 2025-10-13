import { MediaUserData } from '@/services/media/types';
import { useEffect, useState } from 'react';

export function useUserData(initialUserData?: MediaUserData | null) {
  const [localUserData, setLocalUserData] = useState<MediaUserData | null>(null);

  useEffect(() => {
    setLocalUserData(initialUserData || null);
  }, [initialUserData]);

  const currentUserData = localUserData || initialUserData;

  const updateUserData = (updater: (prev: MediaUserData | null) => MediaUserData | null) => {
    setLocalUserData(updater);
  };

  return {
    currentUserData,
    updateUserData,
  };
}
