// ⚠️ DADOS FICTÍCIOS — apenas para demonstração da interface.
// Nenhuma destas músicas vem do YouTube. Substituir por chamadas reais
// (YouTube Data API para busca + banco em tempo real para a fila) na próxima etapa.
import type { Party, QueueItem, Track } from "./types";

export const DEMO_PARTY: Party = {
  code: "FESTA1",
  name: "Aniversário da Ju (demo)",
  host: "Marcos",
  status: "ativa",
};

/** Código que simula uma festa encerrada na tela do convidado. */
export const ENDED_CODE = "FIM000";

export const DEMO_CATALOG: Track[] = [
  { id: "demo-1", title: "Música Exemplo Um", channel: "Canal Fictício", duration: "3:24", hue: 305 },
  { id: "demo-2", title: "Batida de Teste", channel: "Artista Demo", duration: "2:58", hue: 150 },
  { id: "demo-3", title: "Refrão Imaginário", channel: "Banda Placeholder", duration: "4:10", hue: 250 },
  { id: "demo-4", title: "Pista Simulada", channel: "DJ Exemplo", duration: "3:45", hue: 20 },
  { id: "demo-5", title: "Canção de Mentirinha", channel: "Coral Demo", duration: "3:02", hue: 90 },
  { id: "demo-6", title: "Hit Fictício do Verão", channel: "Canal Fictício", duration: "2:49", hue: 200 },
  { id: "demo-7", title: "Balada de Amostra", channel: "Artista Demo", duration: "4:33", hue: 340 },
  { id: "demo-8", title: "Groove Inventado", channel: "DJ Exemplo", duration: "3:17", hue: 60 },
];

export const DEMO_QUEUE: QueueItem[] = [
  { ...DEMO_CATALOG[1], queueId: "q1", requestedBy: "Ana" },
  { ...DEMO_CATALOG[2], queueId: "q2", requestedBy: "Pedro" },
  { ...DEMO_CATALOG[3], queueId: "q3", requestedBy: "Lu" },
];

export const DEMO_NOW_PLAYING: QueueItem = { ...DEMO_CATALOG[0], queueId: "q0", requestedBy: "Ju" };

/** Busca fictícia local. Futuro: substituir por chamada server-side à YouTube Data API. */
export function searchDemoTracks(query: string): Track[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEMO_CATALOG;
  return DEMO_CATALOG.filter((t) => `${t.title} ${t.channel}`.toLowerCase().includes(q));
}
