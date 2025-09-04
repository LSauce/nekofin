import { BaseItemKind, ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models';
import { useState } from 'react';

export type MediaFilters = {
  includeItemTypes?: BaseItemKind[];
  sortBy?: ItemSortBy[];
  sortOrder?: 'Ascending' | 'Descending';
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
