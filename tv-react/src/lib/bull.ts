import { API_BASE, BULL_HIST_MAX, LS_BULL_HIST } from "../config/constantes";
import type { BullData, BullQueue, QueueCounts } from "../types/bull";

/** Suma un contador en todas las colas. */
export const sumCount = (q: BullQueue[] | null, k: keyof QueueCounts): number =>
  (q || []).reduce((s, x) => s + (x.counts?.[k] || 0), 0);

/** Color de estado según fallos: >20 rojo, >0 ámbar, 0 verde. */
export const sc = (f: number): string => (f > 20 ? "#ef4444" : f > 0 ? "#f59e0b" : "#22c55e");
/** Relleno translúcido según fallos. */
export const sf = (f: number): string =>
  f > 20 ? "rgba(239,68,68,.18)" : f > 0 ? "rgba(245,158,11,.18)" : "rgba(34,197,94,.1)";

/** Lee las colas de Core y Controller (cada una puede fallar por separado). */
export async function fetchBullData(): Promise<BullData> {
  const [cr, ctr] = await Promise.allSettled([
    fetch(`${API_BASE}/bull-core`).then((r) => r.json() as Promise<{ queues?: BullQueue[] }>),
    fetch(`${API_BASE}/bull-controller`).then((r) => r.json() as Promise<{ queues?: BullQueue[] }>),
  ]);
  return {
    cQ: cr.status === "fulfilled" ? cr.value.queues ?? null : null,
    tQ: ctr.status === "fulfilled" ? ctr.value.queues ?? null : null,
  };
}

interface HistPoint { ts: number; c: { f: number; a: number; w: number }; t: { f: number; a: number; w: number } }

/** Guarda el histórico de colas en localStorage (misma clave y formato que tv.html). */
export function saveBullHistory(cQ: BullQueue[], tQ: BullQueue[]): void {
  let h: HistPoint[] = [];
  try { h = JSON.parse(localStorage.getItem(LS_BULL_HIST) || "[]") as HistPoint[]; } catch { h = []; }
  h.push({
    ts: Date.now(),
    c: { f: sumCount(cQ, "failed"), a: sumCount(cQ, "active"), w: sumCount(cQ, "waiting") },
    t: { f: sumCount(tQ, "failed"), a: sumCount(tQ, "active"), w: sumCount(tQ, "waiting") },
  });
  if (h.length > BULL_HIST_MAX) h.splice(0, h.length - BULL_HIST_MAX);
  try { localStorage.setItem(LS_BULL_HIST, JSON.stringify(h)); } catch { /* sin espacio o bloqueado */ }
}
