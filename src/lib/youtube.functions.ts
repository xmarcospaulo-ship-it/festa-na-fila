import { createServerFn } from '@tanstack/react-start';

export type YouTubeTrack = { id: string; videoId: string; title: string; channel: string; duration: string; thumbnail: string; hue: number };
type SearchItem = { id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails?: { high?: { url: string }; medium?: { url: string }; default?: { url: string } } } };
type VideoItem = { id: string; contentDetails?: { duration?: string }; status?: { embeddable?: boolean; privacyStatus?: string } };

function durationLabel(value: string) {
  const m = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '—';
  const minutes = Number(m[2] || 0) + Number(m[1] || 0) * 60;
  return `${minutes}:${String(Number(m[3] || 0)).padStart(2, '0')}`;
}

export const searchYouTubeTracks = createServerFn({ method: 'GET' })
  .inputValidator((input: { query: string }) => {
    const query = input.query.trim().slice(0, 100);
    if (query.length < 2) throw new Error('Digite pelo menos 2 caracteres.');
    return { query };
  })
  .handler(async ({ data }): Promise<YouTubeTrack[]> => {
    const key = process.env['YOUTUBE_API_KEY'];
    if (!key) throw new Error('Configure YOUTUBE_API_KEY nos segredos do servidor para habilitar a busca.');
    const search = new URL('https://www.googleapis.com/youtube/v3/search');
    search.search = new URLSearchParams({ key, part: 'snippet', type: 'video', maxResults: '10', q: data.query, videoEmbeddable: 'true', videoSyndicated: 'true', safeSearch: 'moderate' }).toString();
    const response = await fetch(search);
    if (!response.ok) throw new Error(response.status === 403 ? 'A API do YouTube recusou a busca. Confira a chave e a cota.' : 'Falha ao pesquisar no YouTube.');
    const found = ((await response.json()) as { items?: SearchItem[] }).items ?? [];
    const valid = found.filter(x => /^[A-Za-z0-9_-]{11}$/.test(x.id?.videoId ?? ''));
    if (!valid.length) return [];
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.search = new URLSearchParams({ key, part: 'contentDetails,status', id: valid.map(x => x.id.videoId).join(',') }).toString();
    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) throw new Error('Falha ao carregar detalhes dos vídeos.');
    const details = ((await detailsResponse.json()) as { items?: VideoItem[] }).items ?? [];
    const byId = new Map(details.filter(x => x.status?.embeddable !== false && x.status?.privacyStatus === 'public').map(x => [x.id, x]));
    return valid.filter(x => byId.has(x.id.videoId)).map((x, i) => {
      const id = x.id.videoId;
      return { id, videoId: id, title: x.snippet.title.slice(0, 120), channel: x.snippet.channelTitle.slice(0, 120),
        duration: durationLabel(byId.get(id)?.contentDetails?.duration ?? ''),
        thumbnail: x.snippet.thumbnails?.high?.url ?? x.snippet.thumbnails?.medium?.url ?? x.snippet.thumbnails?.default?.url ?? `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        hue: (i * 37 + 180) % 360 };
    });
  });
