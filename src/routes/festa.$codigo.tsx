import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { BigButton, Card, EndedState, Header, QueueList, Thumb } from '@/components/party/ui';
import { YouTubePartyPlayer } from '@/components/party/youtube-player';
import { supabase } from '@/integrations/supabase/client';
import { partyOptions, queueItems, inputCls } from '@/lib/party-data';
import { guestNickname } from '@/lib/party-rules';
import { searchYouTubeTracks } from '@/lib/youtube.functions';
import type { Track } from '@/lib/types';

export const Route = createFileRoute('/festa/$codigo')({
  validateSearch: (s: Record<string, unknown>) => ({ apelido: guestNickname(typeof s['apelido'] === 'string' ? s['apelido'] : '') }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(partyOptions(params.codigo)),
  head: ({ params }) => ({ meta: [
    { title: `Festa ${params.codigo} — Festa na Fila` },
    { name: 'description', content: 'Entre na festa e acompanhe os pedidos.' },
    { property: 'og:title', content: `Festa ${params.codigo} — Festa na Fila` },
    { property: 'og:description', content: 'Acompanhe a fila compartilhada da festa.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Guest,
});

function Guest() {
  const { codigo } = Route.useParams();
  const { apelido } = Route.useSearch();
  const { data: party } = useSuspenseQuery(partyOptions(codigo));
  const cache = useQueryClient();
  const [query, setQuery] = useState('');
  const [nick, setNick] = useState(apelido);
  const [error, setError] = useState('');
  const [added, setAdded] = useState('');
  const [busy, setBusy] = useState(false);
  const term = query.trim();
  const results = useQuery({ queryKey: ['youtube-search', term], queryFn: () => searchYouTubeTracks({ data: { query: term } }), enabled: term.length >= 2, staleTime: 30_000 });
  const host = useQuery({ queryKey: ['party-host', codigo], queryFn: async () => {
    const result = await supabase.rpc('is_party_host', { p_code: codigo });
    if (result.error) throw result.error;
    return result.data;
  }, staleTime: 30_000 });
  const current = party ? queueItems(party, 'current')[0] : undefined;
  const queue = party ? queueItems(party, 'queued') : [];
  const isHost = host.data === true;
  const searchError = results.error instanceof Error ? results.error.message : '';

  async function control(action: string, value?: number) {
    if (!party || !isHost) return;
    setBusy(true); setError('');
    try {
      const result = await supabase.rpc('control_party', { p_id: party.id, p_action: action, ...(value === undefined ? {} : { p_value: value }) });
      if (result.error) throw result.error;
      await cache.invalidateQueries({ queryKey: ['party', codigo] });
    } catch { setError('Não foi possível controlar o player. Confirme o acesso do anfitrião.'); }
    finally { setBusy(false); }
  }
  async function syncPosition(videoId: string, seconds: number) {
    if (!party || !isHost) return;
    const result = await supabase.rpc('sync_party_player', { p_id: party.id, p_video_id: videoId, p_position_seconds: seconds });
    if (result.error) console.error('Falha ao sincronizar o player:', result.error.message);
  }
  async function add(track: Track) {
    setBusy(true); setError(''); setAdded('');
    try {
      const result = await supabase.rpc('add_party_request', { p_code: codigo, p_track: track, p_nickname: guestNickname(nick) });
      if (result.error) throw result.error;
      await cache.invalidateQueries({ queryKey: ['party', codigo] });
      setAdded(`“${track.title}” adicionada à fila!`);
    } catch { setError('Não foi possível adicionar essa música. A festa pode ter sido encerrada.'); }
    finally { setBusy(false); }
  }

  if (!party) return <div className="min-h-screen"><Header /><main className="mx-auto max-w-md px-4 pt-8"><Card><h1 className="text-2xl font-bold">Festa não encontrada</h1><p className="mt-2 text-muted-foreground">Confira o código ou peça um novo link ao anfitrião.</p><Link to="/entrar" className="mt-5 block text-accent">Voltar à entrada</Link></Card></main></div>;
  if (party.status === 'encerrada') return <div className="min-h-screen"><Header /><main className="px-4 pt-10"><EndedState /></main></div>;

  return <div className="min-h-screen">
    <Header right={<span className="text-sm text-accent">{guestNickname(nick)}</span>} />
    <main className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-4">
        <Card><p className="text-sm text-muted-foreground">Código {party.code}</p><h1 className="break-words text-2xl font-bold">{party.name}</h1>
          <label className="mt-4 block"><span className="mb-1 block text-sm">Seu apelido (opcional)</span><input className={inputCls} maxLength={20} value={nick} onChange={e => setNick(e.target.value)} /></label>
        </Card>
        <YouTubePartyPlayer partyId={party.id} track={current} playing={party.playing} volume={party.volume} positionSeconds={party.playbackPositionSeconds} positionUpdatedAt={party.playerUpdatedAt} isHost={isHost} canSkip={queue.length > 0} disabled={busy || party.status !== 'ativa'}
          onToggle={() => { void control('toggle'); }} onSkip={() => { void control('skip'); }} onVolumeChange={value => { void control('volume', value); }} onPositionChange={(id, seconds) => { void syncPosition(id, seconds); }} />
        <Card><h2 className="text-lg font-bold">Pedir uma música</h2><p className="my-2 text-xs text-muted-foreground">Pesquise vídeos públicos do YouTube que permitem reprodução incorporada.</p>
          <input aria-label="Pesquisar música ou artista" type="search" className={inputCls} placeholder="Pesquisar música ou artista" value={query} onChange={e => setQuery(e.target.value)} />
          {term.length === 1 && <p className="mt-3 text-sm text-muted-foreground">Digite mais um caractere para pesquisar.</p>}
          {results.isFetching && <p className="mt-3 text-sm text-muted-foreground">Buscando no YouTube…</p>}
          {searchError && <p role="alert" className="mt-3 text-sm text-destructive">{searchError}</p>}
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          {added && <p role="status" className="mt-3 text-sm text-accent">✓ {added}</p>}
          {term.length >= 2 && !results.isFetching && !searchError && results.data?.length === 0 && <p className="mt-4 text-center text-sm text-muted-foreground">Nenhum vídeo incorporável encontrado.</p>}
          <ul className="mt-4 space-y-2">{(results.data ?? []).map(track => <li key={track.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/60 p-2">
            <Thumb track={track} /><div className="min-w-0 flex-1 basis-32"><p className="line-clamp-2 font-semibold">{track.title}</p><p className="truncate text-sm text-muted-foreground">{track.channel} · {track.duration}</p></div>
            <BigButton variant="accent" className="min-h-12 px-4 text-sm" onClick={() => { void add(track); }} disabled={busy} aria-label={`Adicionar ${track.title}`}>+ Adicionar</BigButton>
          </li>)}</ul>
        </Card>
      </div>
      <Card className="h-fit"><h2 className="mb-3 text-lg font-bold">Fila ({queue.length})</h2><QueueList items={queue} highlightName={guestNickname(nick)} /></Card>
    </main>
  </div>;
}
