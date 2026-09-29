/** Contadores de estados de una cola Bull. */
export interface QueueCounts {
  waiting?: number; active?: number; completed?: number;
  failed?: number; delayed?: number; paused?: number;
}

/** Cola Bull tal como la devuelve /admin/trabajos/api/queues. */
export interface BullQueue {
  name: string;
  counts?: QueueCounts;
  jobs?: BullJob[];
  pagination?: { pageCount?: number };
}

/** Job Bull (solo campos usados). */
export interface BullJob {
  id?: string | number;
  data?: unknown;
  opts?: Record<string, unknown>;
  failedReason?: unknown;
  error?: unknown;
  stacktrace?: unknown[];
  finishedOn?: number;
  failedAt?: number | string;
  failed_at?: number | string;
  timestamp?: number;
  attemptsMade?: number;
  attempts?: number;
}

export interface BullData { cQ: BullQueue[] | null; tQ: BullQueue[] | null }
export type BullView = "topo" | "gauge";

/** Trabajo Failed normalizado para el análisis. */
export interface FailedRow {
  id: string; queue: string; ruc: string; name: string; number: string; lot: string;
  error: string; status: string;
  failedAt: Date | null; createdAt: Date | null;
  attempts: string | number;
  data: unknown; options: Record<string, unknown>; stacktrace: unknown[];
}

/** Cliente (emisor) agrupado por RUC. */
export interface FailedClient {
  ruc: string; name: string; count: number;
  documents: Set<string>; waiting: number; rows: FailedRow[];
}

export type AssessLevel = "cert" | "sifen" | "multi" | "info";
export interface Assessment { lv: AssessLevel; icon: string; title: string; text: string }
