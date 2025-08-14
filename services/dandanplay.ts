export type DandanSearchResult = {
  hasMore: boolean;
  animes: DandanAnime[];
  errorCode: number;
  success: boolean;
  errorMessage: string;
};

export type DandanAnime = {
  animeId: number;
  animeTitle: string;
  type: string;
  typeDescription: string;
  episodes: DandanEpisode[];
};

export type DandanEpisode = {
  episodeId: number;
  episodeTitle: string;
};

export type DandanCommentResult = {
  count: number;
  comments: {
    cid: number;
    p: string;
    m: string;
  }[];
};

export type DandanComment = {
  timeInSeconds: number;
  text: string;
  colorHex: string;
  mode: number;
  user: string;
};

const BASE_URL = 'https://ddplay-api.930524.xyz/cors/https://api.dandanplay.net';

async function makeRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function searchAnimesByKeyword(keyword: string): Promise<DandanAnime[]> {
  const res = await makeRequest<DandanSearchResult>('/api/v2/search/episodes', {
    anime: keyword,
  });

  return res?.animes ?? [];
}

export async function searchEpisodesByKeyword(keyword: string): Promise<DandanEpisode[]> {
  const animes = await searchAnimesByKeyword(keyword);
  return (animes ?? []).flatMap((anime) => anime.episodes);
}

export async function getCommentsByEpisodeId(episodeId: number): Promise<DandanComment[]> {
  const res = await makeRequest<DandanCommentResult>(`/api/v2/comment/${episodeId}`, {
    withRelated: true,
    chConvert: 1,
    protect: 1,
  });

  const list = res?.comments ?? [];

  const normalize = (c: DandanCommentResult['comments'][number]): DandanComment | null => {
    if (!c || !c.p) return null;
    const parts = String(c.p).split(',');
    const timeInSeconds = parseFloat(parts[0] || '0') || 0;
    const mode = parseInt(parts[1] || '1', 10) || 1;
    const colorNumber = parseInt(parts[2] || '16777215', 10) || 0xffffff;
    const colorHex = `#${colorNumber.toString(16).padStart(6, '0')}`;
    const text = String(c.m ?? '');
    if (!text) return null;

    // 提取用户信息用于过滤
    const user = parts[3] || '';

    return { timeInSeconds, text, colorHex, mode, user };
  };

  return (Array.isArray(list) ? list : []).map(normalize).filter(Boolean) as DandanComment[];
}

export function groupCommentsBySecond(comments: DandanComment[]): Map<number, DandanComment[]> {
  const map = new Map<number, DandanComment[]>();
  for (const c of comments) {
    const second = Math.floor(c.timeInSeconds);
    const bucket = map.get(second);
    if (bucket) {
      bucket.push(c);
    } else {
      map.set(second, [c]);
    }
  }
  return map;
}
