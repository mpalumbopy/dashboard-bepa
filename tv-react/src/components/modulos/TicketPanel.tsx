import { forwardRef } from "react";
import { JIRA_BROWSE } from "../../config/constantes";
import { fmtAgo, getTeam, sCat } from "../../lib/utils";
import type { Area, JiraIssue, StatusCat } from "../../types/jira";

export type Tab = "all" | StatusCat;

export const AREA_META: Record<Area, { label: string; accent: string }> = {
  "sin-asignar": { label: "Sin Asignar", accent: "#ef4444" },
  soporte: { label: "Soporte", accent: "#3b82f6" },
  desarrollo: { label: "Desarrollo", accent: "#a855f7" },
  infra: { label: "Infraestructura", accent: "#10b981" },
  wa: { label: "💬 WhatsApp IA", accent: "#25d366" },
};

const BADGE: Record<StatusCat, string> = { enc: "b-enc", por: "b-por", pau: "b-pau", done: "b-done" };

interface Props {
  area: Area | null;
  tab: Tab;
  setTab: (t: Tab) => void;
  onClose: () => void;
  active: JiraIssue[];
  sin: JiraIssue[];
}

/** Panel desplegable con la lista de tickets activos del área seleccionada. */
export const TicketPanel = forwardRef<HTMLDivElement, Props>(function TicketPanel({ area, tab, setTab, onClose, active, sin }, ref) {
  const m = area ? AREA_META[area] : null;
  const issues = !area ? [] : area === "wa"
    ? active.filter((i) => i.fields?.project?.key === "CW")
    : area === "sin-asignar" ? sin
    : active.filter((i) => getTeam(i.fields?.assignee?.displayName || null) === area);
  const cats: Record<StatusCat, number> = { enc: 0, por: 0, pau: 0, done: 0 };
  for (const i of issues) cats[sCat(i.fields?.status?.name)]++;
  const tabs: { id: Tab; cls: string; lbl: string; n: number }[] = [
    { id: "all", cls: "t-all", lbl: "Todos", n: issues.length },
    { id: "enc", cls: "t-enc", lbl: "● En Curso", n: cats.enc },
    { id: "por", cls: "t-por", lbl: "● Por Hacer", n: cats.por },
    ...(cats.pau ? [{ id: "pau" as Tab, cls: "t-pau", lbl: "⏸ En Pausa", n: cats.pau }] : []),
    ...(cats.done ? [{ id: "done" as Tab, cls: "t-done", lbl: "✅ Finalizadas", n: cats.done }] : []),
  ];
  const shown = tab === "all" ? issues : issues.filter((i) => sCat(i.fields?.status?.name) === tab);

  return (
    <div className={`panel${area ? " open" : ""}`} ref={ref}>
      <div className="panel-hdr">
        <div className="panel-title" style={{ color: m?.accent }}>{m ? `${m.label} — Tickets Activos` : "Tickets"}</div>
        <button className="panel-close" onClick={onClose}>✕ Cerrar</button>
      </div>
      <div className="tabs">
        {m && tabs.map((t) => (
          <span key={t.id} className={`tab ${t.cls}${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>
            {t.lbl}<span className="tc">{t.n}</span>
          </span>
        ))}
      </div>
      <div>
        {m && (!shown.length ? <div className="empty">No hay tickets en esta categoría</div> : (
          <table className="tbl">
            <thead><tr><th>Ticket</th><th>Descripción</th><th>Estado</th><th>Asignado</th><th>Proyecto</th><th>Actualizado</th></tr></thead>
            <tbody>
              {shown.map((i) => {
                const f = i.fields, sn = f?.status?.name || "";
                return (
                  <tr key={i.key}>
                    <td className="tbl-key"><a href={`${JIRA_BROWSE}${i.key}`} target="_blank">{i.key}</a></td>
                    <td className="tbl-sum">{f?.summary || "—"}</td>
                    <td><span className={`badge ${BADGE[sCat(sn)]}`}>{sn}</span></td>
                    <td className="tbl-who">{f?.assignee?.displayName || <em style={{ color: "var(--r)" }}>Sin asignar</em>}</td>
                    <td className="tbl-proj">{f?.project?.key || "—"}</td>
                    <td className="tbl-date">{fmtAgo(f?.updated)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
});
