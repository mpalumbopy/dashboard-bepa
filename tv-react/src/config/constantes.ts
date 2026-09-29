/**
 * Constantes del panel TV. Mismos valores que tv.html.
 */

/** Base de las Pages Functions (proxies) en Cloudflare. */
export const API_BASE = "https://main.dashboard-bepa.pages.dev/api";
/** Proxy de búsqueda Jira (POST con JQL). */
export const JIRA_PROXY = `${API_BASE}/jira`;
/** URL para abrir un ticket en Jira. */
export const JIRA_BROWSE = "https://grupobepa.atlassian.net/browse/";
/** Segundos entre verificaciones automáticas. */
export const CHECK_INTERVAL = 20;

/** Integrantes de cada área (se compara por el comienzo del displayName). */
export const TEAMS = {
  soporte: ["jaime", "diana", "jorge", "marco", "leticia", "anibal"],
  desarrollo: ["kevin", "daril", "rodrigo", "aldo", "elias", "gustavo", "danays", "blanca"],
  infra: ["richard", "fabian"],
} as const;

export const CLOSED = new Set(["finalizado", "finalizada", "cancelado", "cancelada", "done", "cerrado", "cerrada", "closed", "resuelto", "resuelta", "completado", "completada", "completo", "completa", "complete", "completed", "terminado", "terminada", "cancelled", "canceled", "implementado", "listo", "lista"]);
export const PAUSED = new Set(["en pausa", "paused", "pause", "on hold", "suspendido", "suspendida", "bloqueado", "bloqueada", "blocked", "esperando resp.del cliente", "esperando respuesta del cliente", "en espera respuesta del cliente"]);
export const ENC = new Set(["en curso", "in progress", "in_progress", "en progreso", "en proceso", "en desarrollo", "doing", "activo", "activa", "active", "en revisión", "en revision", "en testing", "testing", "in review", "reviewing", "en qa", "qa", "in qa", "análisis", "analisis", "analysis", "planificado", "planificada", "planned", "sprint activo", "sprint activa"]);

export const JIRA_FIELDS = ["summary", "status", "assignee", "project", "issuetype", "created", "updated", "priority", "labels"];

/** Etiquetas legibles de las colas Bull. */
export const Q_LABELS: Record<string, string> = {
  generarXml: "Generar XML", firmaXml: "Firma XML", envioSifen: "Envío SIFEN",
  consultaSifen: "Consulta SIFEN", generarXmlEventos: "Generar XML Eventos",
  firmaXmlEventos: "Firma XML Eventos", envioEventoSifen: "Envío Evento SIFEN",
  jsonRespuestaDocumentos: "JSON Respuesta Docs", jsonRespuestaEventos: "JSON Respuesta Eventos",
  envioDocumentoCore: "Envío Doc. Core", consultaDocumentoCore: "Consulta Doc. Core",
  RetornoDocumentoCore: "Retorno Doc. Core", envioEventoCore: "Envío Evento Core",
  consultaEventoCore: "Consulta Evento Core", RetornoEventoCore: "Retorno Evento Core",
};

export const MONITOR_URLS = {
  core: "https://core-monitor.futura100.com.py/admin/trabajos",
  controller: "https://controller-monitor.futura100.com.py/admin/trabajos/",
} as const;

/** Cola del Controller que se analiza en detalle. */
export const CTRL_Q = "consultaDocumentoCore";
export const CTRL_MON = "https://controller-monitor.futura100.com.py/admin/trabajos/";

/** Claves de localStorage (compartidas con tv.html por estar en el mismo origen). */
export const LS_BULL_VIEW = "bull_view";
export const LS_BULL_HIST = "bull_h_v2";
export const BULL_HIST_MAX = 60;
