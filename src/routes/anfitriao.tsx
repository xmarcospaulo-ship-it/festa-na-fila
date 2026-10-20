import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BigButton, Card, DemoBadge, EndedState, Header, QueueList, Thumb } from "@/components/party/ui";
import { DEMO_NOW_PLAYING, DEMO_PARTY, DEMO_QUEUE } from "@/lib/mock-data";
import type { QueueItem } from "@/lib/types";

export const Route = createFileRoute("/anfitriao")({
  head: () => ({
    meta: [
      { title: "Painel do anfitrião — Festa na Fila" },
      { name: "description", content: "Controle a reprodução, o volume e veja a fila de pedidos da sua festa." },
      { property: "og:title", content: "Painel do anfitrião — Festa na Fila" },
      { property: "og:description", content: "Controle a música da sua festa." },
    ],
  }),
  component: Host,
});

// QR Code ilustrativo (padrão determinístico, NÃO é escaneável).
function FakeQr() {
  const cells = Array.from({ length: 121 }, (_, i) => ((i * 7919) % 13) % 3 === 0);
  return (
    <div className="rounded-2xl bg-foreground p-3">
      <div className="grid grid-cols-11 gap-0.5">
        {cells.map((on, i) => (
          <div key={i} className={`aspect-square ${on ? "bg-background" : "bg-foreground"}`} />
        ))}
      </div>
    </div>
  );
}

function Host() {
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(70);
  const [now, setNow] = useState<QueueItem | null>(DEMO_NOW_PLAYING);
  const [queue, setQueue] = useState<QueueItem[]>(DEMO_QUEUE);
  const [ended, setEnded] = useState(false);
  const [copied, setCopied] = useState(false);

  const skip = () => {
    setNow(queue[0] ?? null);
    setQueue((q) => q.slice(1));
  };

  const share = async () => {
    const url = `${window.location.origin}/entrar`;
    const text = `Entre na festa "${DEMO_PARTY.name}" com o código ${DEMO_PARTY.code}`;
    if (navigator.share) await navigator.share({ title: "Festa na Fila", text, url }).catch(() => {});
    else {
      await navigator.clipboard?.writeText(`${text} — ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (ended) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="px-4 pt-10"><EndedState /></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto grid max-w-5xl gap-4 px-4 pb-16 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <p className="text-sm text-muted-foreground">Você é o anfitrião de</p>
            <h1 className="text-3xl font-bold">{DEMO_PARTY.name}</h1>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tocando agora</h2>
              <DemoBadge>Player fictício</DemoBadge>
            </div>
            {now ? (
              <>
                {/* Futuro: YouTube IFrame Player API renderiza o vídeo aqui */}
                <Thumb track={now} size="lg" />
                <p className="mt-4 text-xl font-bold">{now.title}</p>
                <p className="text-muted-foreground">{now.channel} · pedido por <span className="text-accent">{now.requestedBy}</span></p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-1/3 bg-party" />
                </div>
              </>
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Nada tocando. A fila acabou!</p>
            )}
            <div className="mt-5 flex gap-3">
              <BigButton className="flex-1" onClick={() => setPlaying((p) => !p)} disabled={!now} aria-label={playing ? "Pausar" : "Tocar"}>
                {playing ? "⏸ Pausar" : "▶ Tocar"}
              </BigButton>
              <BigButton variant="ghost" onClick={skip} disabled={!now} aria-label="Próxima">⏭ Próxima</BigButton>
            </div>
            <label className="mt-5 flex items-center gap-3">
              <span aria-hidden>🔈</span>
              <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(+e.target.value)} className="h-2 flex-1 accent-[var(--accent)]" aria-label="Volume" />
              <span className="w-10 text-right text-sm">{volume}%</span>
            </label>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-bold">Próximas músicas ({queue.length})</h2>
            <QueueList items={queue} />
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="text-center">
            <p className="text-sm text-muted-foreground">Código de acesso</p>
            <p className="font-display text-4xl font-extrabold tracking-[0.25em] text-accent">{DEMO_PARTY.code}</p>
            <div className="mx-auto mt-4 w-48"><FakeQr /></div>
            <p className="mt-2 text-xs text-muted-foreground">QR Code ilustrativo (não escaneável)</p>
            <BigButton variant="accent" className="mt-4 w-full" onClick={share}>
              {copied ? "✓ Link copiado!" : "📤 Compartilhar"}
            </BigButton>
          </Card>
          <BigButton variant="danger" className="w-full" onClick={() => setEnded(true)}>Encerrar festa</BigButton>
        </aside>
      </main>
    </div>
  );
}
