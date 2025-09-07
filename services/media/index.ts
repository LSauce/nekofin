import { embyAdapter } from './embyAdapter';
import { jellyfinAdapter } from './jellyfinAdapter';
import type { MediaAdapter, MediaServerType } from './types';

export function getMediaAdapter(type: MediaServerType = 'jellyfin'): MediaAdapter {
  if (type === 'emby') return embyAdapter;
  return jellyfinAdapter;
}

export type { MediaAdapter, MediaServerType } from './types';
