import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Pause, Play, SkipForward, Volume2 } from 'lucide-react';
import { BigButton, Card } from '@/components/party/ui';
import type { Track } from '@/lib/types';

type Player = {
  destroy(): void; getCurrentTime(): number; setVolume(value: number): void; playVideo(): void; pauseVideo(): void;
  loadVideoById(options: { videoId: string; startSeconds?: number }): void;
  cueVideoById(options: { videoId: string; startSeconds?: number }): void; seekTo(seconds: number, allowSeekAhead: boolean): void;
};
type YTApi = { Player: new (el: HTMLElement, options: Record<string, unknown>) => Player; PlayerState: { ENDED: number; PAUSED: number } };
declare global { interface Window { YT?: YTApi; onYouTubeIframeAPIReady?: () => void } }
let apiPromise: Promise<void> | undefined;
function loadApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) apiPromise = new Promise<void>((resolve, reject) => {
    window.onYouTubeIframeAPIReady = resolve;
    let script = document.querySelector<HTMLScriptElement>('script[data-yt-api]');
    if (!script) { script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api'; script.dataset['ytApi'] = 'true'; script.onerror = () => reject(new Error('YouTube API indisponível')); document.head.appendChild(script); }
  }).catch(e => { apiPromise = undefined; throw e; });
  return apiPromise;
}
const validId = (id?: string): id is string => !!id && /^[A-Za-z0-9_-]{11}$/.test(id);
const targetPosition = (position: number, updated: string | null, playing: boolean) =>
  Math.max(0, position + (playing && updated ? Math.max(0, (Date.now() - Date.parse(updated)) / 1000) : 0));

type Props = { partyId: string; track?: Track | undefined; playing: boolean; volume: number; positionSeconds: number; positionUpdatedAt: string | null; isHost: boolean; canSkip?: boolean; disabled?: boolean; onToggle: () => void; onSkip: () => void; onVolumeChange: (n: number) => void; onPositionChange: (id: string, seconds: number) => void };
export function YouTubePartyPlayer({ partyId, track, playing, volume, positionSeconds, positionUpdatedAt, isHost, canSkip = false, disabled = false, onToggle, onSkip, onVolumeChange, onPositionChange }: Props) {
  const mount = useRef<HTMLDivElement>(null), frame = useRef<HTMLDivElement>(null), player = useRef<Player | null>(null), loadedId = useRef('');
  const host = useRef(isHost), skipRef = useRef(onSkip), syncRef = useRef(onPositionChange);
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [isFullscreen, setIsFullscreen] = useState(false), [fullscreenError, setFullscreenError] = useState('');
  const candidate = track?.videoId ?? track?.id, videoId = validId(candidate) ? candidate : '';
  useEffect(() => { host.current = isHost; skipRef.current = onSkip; syncRef.current = onPositionChange; }, [isHost, onSkip, onPositionChange]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === frame.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = frame.current;
    if (!container) return;
    setFullscreenError('');
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else setFullscreenError('Para sair da tela cheia, use o controle de voltar do navegador.');
        return;
      }
      if (container.requestFullscreen) {
        await container.requestFullscreen();
        return;
      }
      // Fallback for browsers that only expose fullscreen on the embedded iframe.
      const iframe = mount.current?.querySelector('iframe') as (HTMLIFrameElement & { webkitRequestFullscreen?: () => void }) | null;
      if (iframe?.requestFullscreen) await iframe.requestFullscreen();
      else if (iframe?.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
      else setFullscreenError('Este navegador não permite tela cheia neste player. Tente abrir a página no navegador atualizado.');
    } catch {
      setFullscreenError('Não foi possível abrir a tela cheia. Tente novamente pelo botão do player.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadApi().then(() => {
      if (cancelled || !mount.current || !window.YT) return;
      player.current = new window.YT.Player(mount.current, { width: '100%', height: '100%', playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin }, events: {
        onReady: () => {
          const iframe = mount.current?.querySelector('iframe');
          if (iframe) {
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
            iframe.setAttribute('title', 'Player de vídeo do YouTube');
          }
          setReady(true);
          player.current?.setVolume(volume);
        },
        onStateChange: (e: { data: number }) => {
          if (window.YT && e.data === window.YT.PlayerState.ENDED && host.current) skipRef.current();
          if (window.YT && e.data === window.YT.PlayerState.PAUSED && host.current && loadedId.current) {
            const pos = player.current?.getCurrentTime(); if (typeof pos === 'number' && Number.isFinite(pos)) syncRef.current(loadedId.current, pos);
          }
        },
        onError: (e: { data: number }) => setError(e.data === 101 || e.data === 150 ? 'Este vídeo não permite reprodução incorporada. Avance para outra música.' : 'O YouTube não conseguiu reproduzir este vídeo.'),
      } });
    }).catch(() => setError('Não foi possível carregar o player do YouTube.'));
    return () => { cancelled = true; player.current?.destroy(); player.current = null; setReady(false); };
  // IFrame API player is mounted once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { if (ready) player.current?.setVolume(volume); }, [ready, volume]);
  useEffect(() => {
    const p = player.current; if (!ready || !p) return;
    if (!videoId) { loadedId.current = ''; p.pauseVideo(); return; }
    const target = targetPosition(positionSeconds, positionUpdatedAt, playing);
    if (loadedId.current !== videoId) { loadedId.current = videoId; playing ? p.loadVideoById({ videoId, startSeconds: target }) : p.cueVideoById({ videoId, startSeconds: target }); return; }
    const actual = p.getCurrentTime(), threshold = isHost ? 12 : 4;
    if (playing) { p.playVideo(); if (Number.isFinite(actual) && Math.abs(actual - target) > threshold) p.seekTo(target, true); }
    else { p.pauseVideo(); if (Number.isFinite(actual) && Math.abs(actual - target) > threshold) p.seekTo(target, true); }
  }, [ready, videoId, playing, positionSeconds, positionUpdatedAt, isHost]);
  useEffect(() => {
    if (!isHost || !playing || !videoId || !ready) return;
    const timer = window.setInterval(() => { const pos = player.current?.getCurrentTime(); if (typeof pos === 'number' && Number.isFinite(pos)) syncRef.current(videoId, pos); }, 5000);
    return () => window.clearInterval(timer);
  }, [partyId, isHost, playing, videoId, ready]);
  const toggle = useCallback(() => { if (isHost && !disabled) onToggle(); }, [isHost, disabled, onToggle]);
  const skip = useCallback(() => { if (isHost && !disabled) onSkip(); }, [isHost, disabled, onSkip]);
  return <Card className="space-y-3">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-accent">{playing ? 'Tocando agora' : 'Player da festa'}</p><h2 className="mt-1 truncate text-lg font-bold">{track?.title ?? 'Nenhuma música na fila'}</h2>{track?.channel && <p className="truncate text-sm text-muted-foreground">{track.channel}</p>}</div><span className="shrink-0 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">{isHost ? 'Anfitrião' : 'Ao vivo'}</span></div>
    <div ref={frame} className={isFullscreen ? 'fixed inset-0 z-[9999] flex h-[100dvh] w-screen flex-col rounded-none bg-black p-2' : 'relative aspect-video overflow-hidden rounded-2xl bg-black'}>
      <div ref={mount} className={isFullscreen ? 'h-full min-h-0 w-full flex-1' : 'h-full w-full'} />
      <button type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? 'Sair da tela cheia' : 'Assistir em tela cheia'} title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'} className="absolute right-3 top-3 z-10 inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-black/75 p-2 text-white shadow hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
    </div>
    {fullscreenError && <p role="status" className="text-sm text-muted-foreground">{fullscreenError}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!videoId && <p className="text-sm text-muted-foreground">Adicione uma música do YouTube à fila para começar.</p>}
    {isHost ? <div className="flex flex-wrap items-center gap-3"><BigButton disabled={disabled || !videoId} onClick={toggle}>{playing ? <Pause size={18}/> : <Play size={18}/>} {playing ? 'Pausar' : 'Tocar'}</BigButton><BigButton variant="ghost" disabled={disabled || (!videoId && !canSkip)} onClick={skip}><SkipForward size={18}/> Próxima</BigButton><label className="flex min-w-44 flex-1 items-center gap-2 text-sm"><Volume2 size={18}/><input aria-label="Volume do YouTube" className="min-w-0 flex-1 accent-[var(--accent)]" type="range" min={0} max={100} value={volume} disabled={disabled} onChange={e => onVolumeChange(Number(e.target.value))}/><span className="w-9 text-right tabular-nums">{volume}%</span></label></div> : <p className="text-xs text-muted-foreground">Somente o anfitrião controla reprodução, avanço e volume.</p>}
    {!ready && <p className="text-xs text-muted-foreground">Carregando player do YouTube…</p>}
  </Card>;
}
