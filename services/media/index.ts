import { embyAdapter } from './emby/embyAdapter';
import { jellyfinAdapter } from './jellyfin/jellyfinAdapter';
import type { MediaAdapter, MediaServerType } from './types';

export function getMediaAdapter(type: MediaServerType = 'jellyfin'): MediaAdapter {
  if (type === 'emby') return embyAdapter;
  return jellyfinAdapter;
}

export type { MediaAdapter, MediaServerType } from './types';
