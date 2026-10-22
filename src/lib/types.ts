// Tipos de domínio da fila e dos metadados retornados pela YouTube Data API.
export type Track = {
  id: string; // futuro: videoId do YouTube
  title: string;
  channel: string;
  duration: string;
  hue: number;
  videoId?: string;
  thumbnail?: string;
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
