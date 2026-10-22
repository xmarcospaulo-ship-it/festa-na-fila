import { createServerFn } from '@tanstack/react-start';

export type YouTubeTrack = { id: string; videoId: string; title: string; channel: string; duration: string; thumbnail: string; hue: number };
type SearchItem = { id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails?: { high?: { url: string }; medium?: { url: string }; default?: { url: string } } } };
type VideoItem = { id: string; contentDetails?: { duration?: string }; status?: { embeddable?: boolean; privacyStatus?: string } };
type YouTubeApiError = { error?: { message?: string; errors?: Array<{ reason?: string }> } };

function durationLabel(value: string) {
  const m = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '—';
  const minutes = Number(m[2] || 0) + Number(m[1] || 0) * 60;
  return `${minutes}:${String(Number(m[3] || 0)).padStart(2, '0')}`;
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchYouTube(url: URL, stage: 'search' | 'details'): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
      if (response.ok) return response;

      // Only retry temporary failures. A 403 usually means an API key, restriction, or quota issue.
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) {
        let reason = '';
        try {
          const body = (await response.clone().json()) as YouTubeApiError;
          reason = body.error?.errors?.[0]?.reason ?? '';
        } catch { /* response body may not be JSON */ }

        if (response.status === 403) {
          if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
            throw new Error('A cota diária da API do YouTube foi atingida. Tente novamente mais tarde.');
          }
          throw new Error('O YouTube recusou a API (403). Verifique a chave, as restrições e se a YouTube Data API v3 está ativada.');
        }
        if (response.status === 400) throw new Error('O YouTube rejeitou a pesquisa (400). Confira a configuração da API.');
        if (response.status === 401) throw new Error('A chave da API do YouTube é inválida ou não foi aceita (401).');
        if (response.status === 429) throw new Error('O YouTube está limitando as pesquisas neste momento (429). Aguarde um pouco e tente novamente.');
        throw new Error(`Falha ${stage === 'search' ? 'na pesquisa' : 'ao carregar detalhes'} do YouTube (HTTP ${response.status}).`);
      }
      await wait(300 * (attempt + 1));
    } catch (error) {
      if (error instanceof Error && /^(A cota|O YouTube|A chave|Falha )/.test(error.message)) throw error;
      lastError = error;
      if (attempt === 2) break;
      await wait(300 * (attempt + 1));
    }
  }
  if (lastError instanceof Error && lastError.name === 'TimeoutError') {
    throw new Error('O YouTube demorou para responder. Confira a conexão e tente novamente.');
  }
  throw new Error('Não foi possível conectar à API do YouTube após algumas tentativas. Tente novamente.');
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
    const response = await fetchYouTube(search, 'search');
    const found = ((await response.json()) as { items?: SearchItem[] }).items ?? [];
    const valid = found.filter(x => /^[A-Za-z0-9_-]{11}$/.test(x.id?.videoId ?? ''));
    if (!valid.length) return [];
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.search = new URLSearchParams({ key, part: 'contentDetails,status', id: valid.map(x => x.id.videoId).join(',') }).toString();
    const detailsResponse = await fetchYouTube(detailsUrl, 'details');
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
