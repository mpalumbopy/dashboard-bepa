import { CLOSED, ENC, PAUSED, TEAMS } from "../config/constantes";
import type { StatusCat, TeamKey } from "../types/jira";

/** Error de aplicación con código y mensaje en español. */
export interface AppError {
  codigo: string;
  mensaje: string;
  detalle?: unknown;
}

/** Resultado unificado: éxito con datos o error. */
export type Result<T, E = AppError> = { ok: true; data: T } | { ok: false; error: E };

/** Ejecuta una función async y captura cualquier excepción como Result. */
export async function intentar<T>(fn: () => Promise<T>, codigo = "ERROR_INESPERADO"): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    return {
      ok: false,
      error: { codigo, mensaje: err instanceof Error ? err.message : String(err), detalle: err },
    };
  }
}

/** Clasifica el nombre de estado de Jira en una categoría. */
export function sCat(n: string | undefined): StatusCat {
  const l = (n || "").toLowerCase().trim();
  if (CLOSED.has(l)) return "done";
  if (PAUSED.has(l)) return "pau";
  return ENC.has(l) ? "enc" : "por";
}

/** Determina el área según el displayName del asignado. */
export function getTeam(d: string | null | undefined): TeamKey {
  if (!d) return "sin-asignar";
  const l = d.toLowerCase().trim();
  for (const [t, ns] of Object.entries(TEAMS) as [keyof typeof TEAMS, readonly string[]][]) {
    if (ns.some((n) => l.startsWith(n))) return t;
  }
  return "otro";
}

/** Fecha YYYY-MM-DD (en UTC, igual que tv.html). */
export const dateStr = (d: Date): string => d.toISOString().slice(0, 10);

/** Antigüedad relativa: hoy, ayer, hace Nd. */
export function fmtAgo(iso: string | undefined): string {
  if (!iso) return "—";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  return `hace ${d}d`;
}

/** Hora local es-PY HH:MM:SS. */
export const horaActual = (): string =>
  new Date().toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
