import { DetailBundle } from '@/hooks/useDetailBundle';
import { MediaItem } from '@/services/media/types';
import { UseQueryResult } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useState } from 'react';

import { DetailViewProps } from '.';

type DetailViewContextType = {
  title: string;
  setTitle: (title: string) => void;
  backgroundImageUrl?: string | null;
  setBackgroundImageUrl: (url?: string | null) => void;
  item?: MediaItem | null;
  setItem: (item: MediaItem | null) => void;
} & DetailViewProps;

const DetailViewContext = createContext<DetailViewContextType | undefined>(undefined);

export const DetailViewProvider = ({
  children,
  itemId,
  mode,
  query,
}: {
  children: ReactNode;
} & DetailViewProps) => {
  const [title, setTitle] = useState<string>('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null | undefined>(null);
  const [item, setItem] = useState<MediaItem | null>(null);

  return (
    <DetailViewContext.Provider
      value={{
        title,
        setTitle,
        backgroundImageUrl,
        setBackgroundImageUrl,
        item,
        setItem,
        query,
        itemId,
        mode,
      }}
    >
      {children}
    </DetailViewContext.Provider>
  );
};

export const useDetailView = () => {
  const context = useContext(DetailViewContext);
  if (context === undefined) {
    throw new Error('useDetailView must be used within a DetailViewProvider');
  }
  return context;
};
