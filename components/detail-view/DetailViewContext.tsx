import { MediaItem } from '@/services/media/types';
import { createContext, ReactNode, useContext, useState } from 'react';

interface DetailViewContextType {
  title: string;
  setTitle: (title: string) => void;
  backgroundImageUrl?: string | null;
  setBackgroundImageUrl: (url?: string | null) => void;
  item: MediaItem | null;
  setItem: (item: MediaItem | null) => void;
}

const DetailViewContext = createContext<DetailViewContextType | undefined>(undefined);

export const DetailViewProvider = ({ children }: { children: ReactNode }) => {
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
