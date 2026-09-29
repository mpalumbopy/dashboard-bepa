import { API_BASE, CTRL_MON, CTRL_Q } from "../config/constantes";
import type { Assessment, BullJob, BullQueue, FailedClient, FailedRow } from "../types/bull";

/*
 * Análisis de fallos de consultaDocumentoCore (Controller).
 * Portado de failed-dashboard: lee todos los Failed vía /api/bull-failed,
 * normaliza cada job y arma el diagnóstico:
 * 1 RUC con lotes "En proceso" → revisar certificado · 2 → verificar cada error
 * 3-4 → revisar cada cliente · ≥5 → posible intermitencia SIFEN.
 */

type Obj = Record<string, unknown>;

/** URL de una cola del monitor del Controller filtrada por estado. */
export const cfQueueUrl = (q: string, st: string): string =>
  `${CTRL_MON}queue/${encodeURIComponent(q)}?status=${st}`;

/** Primer valor no vacío. */
const firstOf = (...v: unknown[]): unknown => v.find((x) => x !== undefined && x !== null && x !== "") ?? "";

/** Intenta parsear JSON si es string. */
function jparse(v: unknown): unknown {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
}

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object";
const pick = (o: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((acc, k) => (isObj(acc) ? acc[k] : undefined), o);

/** Busca una clave en profundidad (hasta 6 niveles), parseando strings JSON. */
function findField(v: unknown, k: string, d = 0): unknown {
  const o = jparse(v);
  if (!isObj(o) || d > 6) return undefined;
  if (o[k] != null) return o[k];
  for (const c of Object.values(o)) {
    const f = findField(c, k, d + 1);
    if (f !== undefined) return f;
  }
  return undefined;
}

/** Decodifica entidades XML de un texto. */
function xmlText(v: string): string {
  if (!v) return "";
  try {
    const x = new DOMParser().parseFromString(`<v>${v}</v>`, "application/xml");
    return x.querySelector("v")?.textContent || v;
  } catch { return v; }
}

function toDt(v: unknown): Date | null {
  if (!v || (typeof v !== "number" && typeof v !== "string")) return null;
  const d = new Date(typeof v === "number" && v < 1e12 ? v * 1000 : v);
  return isNaN(d.valueOf()) ? null : d;
}

/** Fecha y hora en zona America/Asuncion. */
export function fmtDt(d: Date | null): string {
  if (!d) return "No disponible";
  return new Intl.DateTimeFormat("es-PY", { timeZone: "America/Asuncion", dateStyle: "short", timeStyle: "medium" }).format(d);
}

/** Normaliza un job Bull Failed a una fila de análisis. */
export function normJob(job: BullJob, queue: string): FailedRow {
  const data = (jparse(job.data) || {}) as Obj;
  const doc = (pick(data, "jobData", "jsonData") || pick(data, "jsonData") || data) as Obj;
  const lot = String(firstOf(doc.nro_lote, pick(data, "jobData", "nro_lote"), findField(data, "nro_lote")));
  const xv = findField(data, "xml");
  const xml = typeof xv === "string" ? xv : "";
  const ruc = String(firstOf(
    pick(data, "jobData", "empresa", "ruc"), pick(data, "empresa", "ruc"),
    lot.match(/^(\d{6,12})-/)?.[1], xml.match(/<dRucEm>(\d+)<\/dRucEm>/)?.[1],
  ));
  const ld = lot.match(/-(\d{3})-(\d{3})-(\d{7})(?:-|$)/);
  const number = String(firstOf(doc.nro_documento, findField(data, "nro_documento"), ld ? `${ld[1]}-${ld[2]}-${ld[3]}` : undefined));
  // dNomRec es el RECEPTOR; para el emisor solo razón social del job o dNomEmi del XML.
  const name = xmlText(String(firstOf(
    pick(data, "jobData", "empresa", "razon_social"), pick(data, "empresa", "razon_social"),
    pick(data, "empresa", "nombre"), xml.match(/<dNomEmi>([^<]+)<\/dNomEmi>/)?.[1],
  )));
  const ev = firstOf(job.failedReason, job.error, job.stacktrace?.[0]);
  const error = typeof ev === "string" ? ev : ev ? JSON.stringify(ev) : "";
  let ef: Obj = {};
  try { ef = JSON.parse(error.match(/\{[^{}]*"estado_documento"[^{}]*\}/)?.[0] ?? "") as Obj; } catch { /* sin estado_documento */ }
  const att = firstOf(job.attemptsMade, job.attempts);
  return {
    id: String(job.id ?? ""), queue, ruc, name, number, lot, error,
    status: String(firstOf(ef.estado_documento)),
    failedAt: toDt(firstOf(job.finishedOn, job.failedAt, job.failed_at)),
    createdAt: toDt(job.timestamp),
    attempts: typeof att === "number" ? att : String(att),
    data, options: job.opts || {}, stacktrace: job.stacktrace || [],
  };
}

/** Lee todas las páginas de Failed de la cola (máx. 40 páginas de 50). */
export async function readCtrlFailed(): Promise<FailedRow[]> {
  const jobs: BullJob[] = [];
  let page = 1, pageCount = 1;
  do {
    const r = await fetch(`${API_BASE}/bull-failed?queue=${CTRL_Q}&page=${page}&_t=${Date.now()}`, {
      cache: "no-store", headers: { Accept: "application/json" },
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const b = (await r.json()) as { error?: string; queues?: BullQueue[] };
    if (b.error) throw new Error(b.error);
    const q = (b.queues || []).find((x) => x.name === CTRL_Q);
    if (!q) throw new Error("No se encontró la cola " + CTRL_Q);
    jobs.push(...(q.jobs || []));
    pageCount = q.pagination?.pageCount || 1;
    page++;
  } while (page <= pageCount && page <= 40);
  const rows = jobs.map((j) => normJob(j, CTRL_Q));
  // Completa nombres faltantes con los de otros jobs del mismo RUC
  const names: Record<string, string> = {};
  rows.forEach((r) => { if (r.ruc && r.name) names[r.ruc] = r.name; });
  rows.forEach((r) => { if (!r.name) r.name = names[r.ruc] || ""; });
  return rows;
}

/** Agrupa filas por RUC (emisor). */
export function buildClients(rows: FailedRow[]): FailedClient[] {
  const m: Record<string, FailedClient> = {};
  for (const r of rows) {
    if (!r.ruc) continue;
    const c = (m[r.ruc] ??= { ruc: r.ruc, name: r.name, count: 0, documents: new Set(), waiting: 0, rows: [] });
    c.rows.push(r);
    c.count++;
    if (r.number) c.documents.add(r.number);
    if (r.status.toLowerCase() === "en proceso") c.waiting++;
    if (!c.name && r.name) c.name = r.name;
  }
  return Object.values(m).sort((a, b) => b.count - a.count);
}

/** Diagnóstico según cantidad de RUC con lotes "En proceso". */
export function assess(rows: FailedRow[], clients: FailedClient[]): Assessment | null {
  if (!rows.length) return null;
  const p = clients.filter((c) => c.waiting > 0);
  const n = p.length;
  if (n >= 5) return { lv: "sifen", icon: "⚡", title: "POSIBLE INTERMITENCIA SIFEN", text: `${n} RUC distintos con lotes en proceso. Verificar errores y semáforo.` };
  if (n >= 3) return { lv: "multi", icon: "⚠️", title: `${n} CLIENTES CON LOTES EN PROCESO`, text: "Revisar cada caso y sus certificados." };
  if (n === 2) return { lv: "multi", icon: "⚠️", title: "DOS CLIENTES CON LOTES EN PROCESO", text: "Verificar cada error antes de atribuir una causa común." };
  if (n === 1) {
    const c = p[0];
    return { lv: "cert", icon: "🔐", title: `POSIBLE ERROR EN CERTIFICADO · RUC ${c.ruc}`, text: `${c.name ? c.name + " · " : ""}${c.waiting} lote(s) en proceso. Revisar respuesta del lote y certificado del cliente.` };
  }
  return { lv: "info", icon: "ℹ️", title: `${rows.length} FALLO(S) SIN LOTES EN PROCESO`, text: "No se detectaron lotes en proceso entre los trabajos consultados. Revisar el Error de cada trabajo." };
}

/** Ordena por hora de fallo, más reciente primero. */
export const byFailedDesc = (a: FailedRow, b: FailedRow): number =>
  (b.failedAt?.getTime() || 0) - (a.failedAt?.getTime() || 0);
