/** Subconjunto de campos de un issue de Jira que usa el panel. */
export interface JiraIssue {
  key: string;
  fields?: {
    summary?: string;
    status?: { name?: string };
    assignee?: { displayName?: string } | null;
    project?: { key?: string };
    created?: string;
    updated?: string;
  };
}

export interface JiraSearchResponse {
  issues?: JiraIssue[];
  nextPageToken?: string | null;
  total?: number;
}

/** Categoría de estado: en curso, por hacer, en pausa, finalizado. */
export type StatusCat = "enc" | "por" | "pau" | "done";
export type Area = "sin-asignar" | "soporte" | "desarrollo" | "infra" | "wa";
export type TeamKey = "sin-asignar" | "soporte" | "desarrollo" | "infra" | "otro";

/** Contadores que se muestran en las tarjetas. */
export interface Counts {
  sin: number; sop: number; dev: number; inf: number;
  wa: number; waHoy: number;
  hoy: number; mes: number; fin: number; finHoy: number;
}
