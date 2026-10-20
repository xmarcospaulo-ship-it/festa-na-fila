import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BigButton, Card, DemoBadge, EndedState, Header, QueueList, Thumb } from "@/components/party/ui";
import { DEMO_NOW_PLAYING, DEMO_PARTY, DEMO_QUEUE, ENDED_CODE, searchDemoTracks } from "@/lib/mock-data";
import type { QueueItem, Track } from "@/lib/types";

export const Route = createFileRoute("/festa/$codigo")({
  validateSearch: (s: Record<string, unknown>) => ({ apelido: typeof s.apelido === "string" ? s.apelido : "Convidado" }),
  head: ({ params }) => ({
    meta: [
      { title: `Festa ${params.codigo} — Festa na Fila` },
      { name: "description", content: "Pesquise músicas e adicione à fila da festa." },
      { property: "og:title", content: `Festa ${params.codigo} — Festa na Fila` },
      { property: "og:description", content: "Peça sua música pelo celular." },
    ],
  }),
  component: Guest,
});

function Guest() {
  const { codigo } = Route.useParams();
  const { apelido } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>(DEMO_QUEUE);
  const [added, setAdded] = useState<string | null>(null);
  const results = useMemo(() => searchDemoTracks(query), [query]);

  if (codigo === ENDED_CODE) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="px-4 pt-10"><EndedState /></main>
      </div>
    );
  }

  const add = (t: Track) => {
    setQueue((q) => [...q, { ...t, queueId: `${t.id}-${Date.now()}`, requestedBy: apelido }]);
    setAdded(t.title);
    setTimeout(() => setAdded(null), 2500);
  };

  return (
    <div className="min-h-screen">
      <Header right={<span className="rounded-full bg-secondary px-3 py-1 text-sm">👤 {apelido}</span>} />
      <main className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Código {codigo}</p>
                <h1 className="text-2xl font-bold">{DEMO_PARTY.name}</h1>
              </div>
              <DemoBadge />
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary/60 p-2">
              <Thumb track={DEMO_NOW_PLAYING} />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-accent">Tocando agora</p>
                <p className="truncate font-semibold">{DEMO_NOW_PLAYING.title}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Só o anfitrião controla o player. Você pode pedir músicas à vontade!</p>
          </Card>

          <Card>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔎 Pesquisar música ou artista"
              className="min-h-14 w-full rounded-2xl border border-input bg-secondary px-4 text-lg outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-2 text-xs text-muted-foreground">Busca em catálogo fictício — a pesquisa no YouTube chega na próxima etapa.</p>
            <ul className="mt-4 space-y-2">
              {results.length === 0 && <li className="p-6 text-center text-muted-foreground">Nenhuma música encontrada.</li>}
              {results.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-2">
                  <Thumb track={t} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{t.channel} · {t.duration}</p>
                  </div>
                  <BigButton variant="accent" className="min-h-12 px-4 text-sm" onClick={() => add(t)}>+ Adicionar à fila</BigButton>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="h-fit">
          <h2 className="mb-3 text-lg font-bold">Fila ({queue.length})</h2>
          <QueueList items={queue} highlightName={apelido} />
        </Card>
      </main>

      {added && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-accent p-4 text-center font-semibold text-accent-foreground shadow-glow animate-in slide-in-from-bottom-4">
          ✓ “{added}” adicionada à fila!
        </div>
      )}
    </div>
  );
}
