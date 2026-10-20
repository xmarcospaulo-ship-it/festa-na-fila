// Tipos de domínio. Preparados para mapear tabelas do banco (fase futura)
// e resultados da YouTube Data API (videoId, title, channelTitle, thumbnail).
export type Track = {
  id: string; // futuro: videoId do YouTube
  title: string;
  channel: string;
  duration: string;
  hue: number; // apenas para a miniatura fictícia
};

export type QueueItem = Track & {
  queueId: string;
  requestedBy: string;
};

export type Party = {
  code: string;
  name: string;
  host: string;
  status: "ativa" | "encerrada";
};
