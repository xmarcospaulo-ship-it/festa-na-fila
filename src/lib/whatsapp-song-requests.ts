import type { Track } from './types';

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Builds a public YouTube search URL. This deliberately does not call the
 * YouTube Data API and therefore does not consume search.list quota.
 */
export function buildYouTubeSearchUrl(query: string): string {
  const normalized = query.trim().slice(0, 120);
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(normalized)}`;
}

/**
 * Extracts a video ID only from supported, exact YouTube hostnames.
 * Returns null for unrelated hosts, malformed URLs, and playlist-only links.
 */
export function extractYouTubeVideoId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let id: string | null = null;

  if (host === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/);
      id = match?.[1] ?? null;
    }
  }

  return id && YOUTUBE_VIDEO_ID.test(id) ? id : null;
}

/**
 * Creates the minimal Track shape accepted by the existing public queue RPC.
 * Metadata is intentionally marked as unknown: resolving title/channel would
 * require a catalog lookup, which this hybrid flow is designed to avoid.
 */
export function trackFromYouTubeVideoId(videoId: string): Track | null {
  if (!YOUTUBE_VIDEO_ID.test(videoId)) return null;

  return {
    id: videoId,
    videoId,
    title: `Vídeo do YouTube (${videoId})`,
    channel: 'Pedido pelo WhatsApp',
    duration: '—',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    hue: 210,
  };
}
