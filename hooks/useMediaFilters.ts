import { MediaItemType, MediaSortBy, MediaSortOrder } from '@/services/media/types';
import { useState } from 'react';

export type MediaFilters = {
  includeItemTypes?: MediaItemType[];
  sortBy?: MediaSortBy[];
  sortOrder?: MediaSortOrder;
  onlyUnplayed?: boolean;
  year?: number;
  tags?: string[];
};

export function createDefaultFilters(overrides?: Partial<MediaFilters>): MediaFilters {
  return {
    includeItemTypes: ['Movie', 'Series', 'Episode'],
    sortBy: ['DateCreated'],
    sortOrder: 'Descending',
    onlyUnplayed: false,
    year: undefined,
    tags: undefined,
    ...overrides,
  };
}

export function useMediaFilters(initial?: Partial<MediaFilters>) {
  const [filters, setFilters] = useState<MediaFilters>(createDefaultFilters(initial));
  return { filters, setFilters };
}
