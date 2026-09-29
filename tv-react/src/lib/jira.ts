import { JIRA_FIELDS, JIRA_PROXY } from "../config/constantes";
import type { Counts, JiraIssue, JiraSearchResponse } from "../types/jira";
import { dateStr, getTeam } from "./utils";

/** Llama al proxy de Jira con una JQL (paginación por nextPageToken). */
async function callProxy(jql: string, max = 200, tok: string | null = null): Promise<JiraSearchResponse> {
  const body: Record<string, unknown> = { jql, fields: JIRA_FIELDS, maxResults: max };
  if (tok) body.nextPageToken = tok;
  const r = await fetch(JIRA_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json() as Promise<JiraSearchResponse>;
}

/** Trae todos los issues de una JQL (tope de 1000, como tv.html). */
async function fetchAll(jql: string): Promise<JiraIssue[]> {
  let issues: JiraIssue[] = [];
  let token: string | null = null;
  do {
    const d: JiraSearchResponse = await callProxy(jql, 200, token);
    issues = issues.concat(d.issues || []);
    token = d.nextPageToken || null;
    if (issues.length >= 1000) break;
  } while (token);
  return issues;
}

/** Cuenta issues de una JQL sin tope; ante error devuelve 0. */
async function fetchCount(jql: string): Promise<number> {
  try {
    const d = await callProxy(jql, 1, null);
    // API clásica devuelve d.total; la cursor-based no lo tiene
    if (typeof d.total === "number") return d.total;
    let n = (d.issues || []).length;
    let tok = d.nextPageToken || null;
    while (tok) {
      const p = await callProxy(jql, 200, tok);
      n += (p.issues || []).length;
      tok = p.nextPageToken || null;
    }
    return n;
  } catch {
    return 0;
  }
}

export interface JiraSnapshot { active: JiraIssue[]; sin: JiraIssue[]; counts: Counts }

/** Consulta Jira y calcula todos los contadores del panel. Lanza error si falla. */
export async function loadJiraSnapshot(): Promise<JiraSnapshot> {
  const today = new Date();
  const todayStr = dateStr(today);
  const ms = dateStr(new Date(today.getFullYear(), today.getMonth(), 1));
  const [active, mes, sin, totalMes, totalFin, totalFinHoy] = await Promise.all([
    fetchAll("statusCategory != Done ORDER BY updated DESC"),
    fetchAll(`created >= "${ms}" ORDER BY created DESC`),
    fetchAll("assignee is EMPTY AND statusCategory != Done ORDER BY updated DESC"),
    fetchCount(`created >= "${ms}"`),
    // resolutiondate: Jira lo setea al cerrar
    fetchCount(`statusCategory = Done AND resolutiondate >= "${ms}"`),
    fetchCount(`statusCategory = Done AND resolutiondate >= "${todayStr}"`),
  ]);
  let sop = 0, dev = 0, inf = 0;
  for (const i of active) {
    const t = getTeam(i.fields?.assignee?.displayName || null);
    if (t === "soporte") sop++;
    else if (t === "desarrollo") dev++;
    else if (t === "infra") inf++;
  }
  const wa = active.filter((i) => i.fields?.project?.key === "CW");
  return {
    active,
    sin,
    counts: {
      sin: sin.length, sop, dev, inf,
      wa: wa.length,
      waHoy: wa.filter((i) => (i.fields?.created || "").startsWith(todayStr)).length,
      hoy: mes.filter((i) => (i.fields?.created || "").startsWith(todayStr)).length,
      mes: totalMes, fin: totalFin, finHoy: totalFinHoy,
    },
  };
}
