import { useEffect, useRef, useState } from "react";
import { CTRL_Q } from "../../config/constantes";
import { byFailedDesc, cfQueueUrl, fmtDt } from "../../lib/controllerFailed";
import type { CtrlFailedState } from "../../hooks/useControllerFailed";
import type { BullQueue, FailedClient, FailedRow } from "../../types/bull";

interface QueueItem { qname: string; count: number }
type ListItem = FailedRow | FailedClient | QueueItem;
type Detail = { kind: "list"; title: string; items: ListItem[] } | { kind: "job"; row: FailedRow } | null;

const isClient = (x: ListItem): x is FailedClient => "rows" in x;
const isQueue = (x: ListItem): x is QueueItem => "qname" in x;

interface Props {
  open: boolean;
  onClose: () => void;
  state: CtrlFailedState;
  tQ: BullQueue[] | null;
}

/** Panel lateral con el análisis completo de fallos de consultaDocumentoCore. */
export function CtrlPanel({ open, onClose, state, tQ }: Props) {
  const [query, setQuery] = useState("");
  const [allClients, setAllClients] = useState(false);
  const [detail, setDetail] = useState<Detail>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Al abrir siempre se muestra la vista principal
  useEffect(() => { if (open) setDetail(null); }, [open]);

  // Esc: vuelve del detalle o cierra el panel
  useEffect(() => {
    if (!open) return undefined;
    const h = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (detail) setDetail(null); else onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, detail, onClose]);

  const show = (d: Detail) => { setDetail(d); if (panelRef.current) panelRef.current.scrollTop = 0; };
  const openClient = (ruc: string) => {
    const c = state.clients.find((x) => x.ruc === ruc);
    if (c) show({ kind: "list", title: `${c.name || "Nombre no disponible"} · RUC ${c.ruc}`, items: [...c.rows].sort(byFailedDesc) });
  };
  const openJob = (id: string) => {
    const r = state.rows.find((x) => x.id === id);
    if (r) show({ kind: "job", row: r });
  };

  const a = state.assess || { lv: "info", icon: "✅", title: "SIN FALLOS EN CONSULTA DOC. CORE", text: "No hay trabajos Failed en la cola." };
  const multi = state.clients.filter((c) => c.count > 1);
  const affQ = (tQ || []).filter((q) => (q.counts?.failed || 0) > 0);
  const waitingLots = state.clients.reduce((s, c) => s + c.waiting, 0);
  const q = query.toLocaleLowerCase("es");
  const visible = state.rows
    .filter((r) => `${r.ruc} ${r.name} ${r.number} ${r.queue} ${r.error}`.toLocaleLowerCase("es").includes(q))
    .sort(byFailedDesc).slice(0, 10);

  const metric = (lbl: string, val: number, onClick: () => void, sub?: string) => (
    <button className="cf-metric" onClick={onClick}><span>{lbl}</span><strong>{val}</strong><small>{sub || "Ver detalle"}</small></button>
  );

  return (
    <div className={`cf-overlay${open ? " open" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="cf-panel" role="dialog" aria-modal="true" aria-label="Análisis de fallos del Controller" ref={panelRef}>
        <button className="cf-close" onClick={onClose} aria-label="Cerrar">×</button>

        <div style={{ display: detail ? "none" : "block" }}>
          <div className="cf-head">
            <div>
              <div className="cf-kicker">Futura100 · Controller · consultaDocumentoCore</div>
              <h2>Análisis de fallos</h2>
              <div className="cf-sub" style={{ color: state.error ? "#f87171" : undefined }}>
                {state.error || (state.time ? `Última lectura: ${fmtDt(state.time)} · se actualiza con el dashboard (20s)` : "Consultando…")}
              </div>
            </div>
            <a className="cf-a" href={cfQueueUrl(CTRL_Q, "failed")} target="_blank" rel="noreferrer">↗ Abrir cola en el monitor</a>
          </div>

          <div className={`cf-verdict lv-${a.lv}`} style={{ animation: "none" }}>
            <div>
              <div className="cf-verdict-k">Análisis de inconvenientes</div>
              <div className="cf-verdict-t">{a.icon} {a.title}</div>
              <div className="cf-verdict-s">{a.text}</div>
            </div>
            <div className="cf-verdict-n">{state.rows.length} <span style={{ fontSize: ".9rem", fontWeight: 700 }}>casos</span></div>
          </div>

          <div className="cf-metrics">
            {metric("Inconvenientes", state.rows.length, () => show({ kind: "list", title: "Inconvenientes", items: [...state.rows].sort(byFailedDesc) }), waitingLots ? `${waitingLots} lote(s) en proceso` : "")}
            {metric("Clientes identificados", state.clients.length, () => show({ kind: "list", title: "Clientes identificados", items: state.clients }))}
            {metric("Clientes con varios casos", multi.length, () => show({ kind: "list", title: "Clientes con varios casos", items: multi }))}
            {metric("Colas afectadas", affQ.length, () => show({ kind: "list", title: "Colas afectadas · Controller", items: affQ.map((x) => ({ qname: x.name, count: x.counts?.failed || 0 })) }), "Todas las colas del Controller")}
          </div>

          <section>
            <div className="cf-sec-hd">
              <h3>Clientes afectados</h3>
              <button className="cf-link" style={{ display: state.clients.length > 4 ? "" : "none" }} onClick={() => setAllClients((v) => !v)}>
                {allClients ? "Mostrar 4" : `Ver todos (${state.clients.length})`}
              </button>
            </div>
            <p className="cf-note">Nombre del emisor cuando aparece en Data o XML (dNomEmi). dNomRec es el receptor y no se usa.</p>
            <div className="cf-clients">
              {state.clients.slice(0, allClients ? undefined : 4).map((c) => (
                <button key={c.ruc} className="cf-client" onClick={() => openClient(c.ruc)}>
                  <span title={c.name || "Nombre no disponible"}>{c.name || "Nombre no disponible"}</span>
                  <strong>RUC {c.ruc}</strong>
                  <small>{c.count} caso(s) · {c.documents.size} documento(s){c.waiting > 0 && <> · <b className="cf-wait">{c.waiting} en proceso</b></>}</small>
                </button>
              ))}
              {!state.clients.length && <p className="cf-empty">No se identificaron emisores en estos trabajos.</p>}
            </div>
          </section>

          <section>
            <div className="cf-sec-hd">
              <h3>Registro de fallos</h3>
              <input className="cf-input" placeholder="Buscar cliente, RUC, documento o error" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <p className="cf-note">Hasta diez trabajos, ordenados por hora de fallo. Los indicadores abarcan todos los Failed obtenidos.</p>
            <div className="cf-log">
              {!visible.length ? (
                <p className="cf-empty">{state.rows.length ? "Sin casos que coincidan con la búsqueda." : "Sin trabajos Failed."}</p>
              ) : (
                <table className="tbl">
                  <thead><tr><th>Hora</th><th>Cliente y RUC</th><th>Documento</th><th>Situación</th><th>Mensaje del sistema</th><th></th></tr></thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.id}>
                        <td className="tbl-date">{fmtDt(r.failedAt)}</td>
                        <td>{r.name || "Nombre no disponible"}<br /><span className="cf-mono">{r.ruc || "RUC no disponible"}</span></td>
                        <td className="tbl-key">{r.number || "—"}</td>
                        <td>{r.status
                          ? <span className={`badge ${r.status.toLowerCase() === "en proceso" ? "b-por" : "b-pau"}`}>{r.status}</span>
                          : <span className="tbl-who">Revisar error</span>}</td>
                        <td><div className="cf-err" title={r.error}>{r.error || "Sin mensaje"}</div></td>
                        <td><button className="cf-link" onClick={() => openJob(r.id)}>Ver todo</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          <p className="cf-note" style={{ marginTop: 22 }}>Los mensajes son hipótesis para revisar: ningún patrón prueba la causa sin verificar el Error de cada trabajo.</p>
        </div>

        {detail && (
          <div>
            <button className="cf-link" onClick={() => setDetail(null)} style={{ marginBottom: 10 }}>‹ Volver al análisis</button>
            {detail.kind === "list" ? (
              <>
                <h2>{detail.title}</h2>
                <p className="cf-sub" style={{ marginBottom: 12 }}>{detail.items.length} resultado(s)</p>
                {detail.items.map((it, i) => isClient(it) ? (
                  <button key={i} className="cf-row" onClick={() => openClient(it.ruc)}>
                    {it.name || "Nombre no disponible"} · <span className="cf-mono">RUC {it.ruc}</span> · {it.count} caso(s)
                    {it.waiting > 0 && <> · <b style={{ color: "#fb923c" }}>{it.waiting} en proceso</b></>}
                  </button>
                ) : isQueue(it) ? (
                  <a key={i} className="cf-row" href={cfQueueUrl(it.qname, "failed")} target="_blank" rel="noreferrer">
                    {it.qname} · <b style={{ color: "#f87171" }}>{it.count} inconvenientes</b> ↗
                  </a>
                ) : (
                  <button key={i} className="cf-row" onClick={() => openJob(it.id)}>
                    <span className="tbl-date">{fmtDt(it.failedAt)}</span> · {it.name || "Nombre no disponible"} · <span className="cf-mono">RUC {it.ruc || "—"}</span> · {it.number || "Sin documento"}
                    {it.status && <> · <b>{it.status}</b></>}
                    <div className="cf-err" style={{ maxWidth: "none", marginTop: 4 }}>{it.error || "Sin mensaje"}</div>
                  </button>
                ))}
                {!detail.items.length && <p className="cf-empty">Sin resultados.</p>}
              </>
            ) : (
              <JobDetail r={detail.row} />
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

/** Detalle completo de un trabajo Failed. */
function JobDetail({ r }: { r: FailedRow }) {
  const pre = (v: unknown) => <pre className="cf-pre">{typeof v === "string" ? v : JSON.stringify(v, null, 2)}</pre>;
  return (
    <>
      <h2>Trabajo #{r.id}</h2>
      <p className="cf-sub">{r.name || "Nombre no disponible"} · RUC <span className="cf-mono">{r.ruc || "No disponible"}</span></p>
      <dl className="cf-dl">
        <dt>Cola</dt><dd>{r.queue}</dd>
        <dt>Documento</dt><dd>{r.number || "No disponible"}</dd>
        <dt>Lote</dt><dd className="cf-mono">{r.lot || "No disponible"}</dd>
        <dt>Situación</dt><dd>{r.status || "Revisar error"}</dd>
        <dt>Hora del fallo</dt><dd>{fmtDt(r.failedAt)}</dd>
        <dt>Creado</dt><dd>{fmtDt(r.createdAt)}</dd>
        <dt>Intentos</dt><dd>{r.attempts === "" ? "No disponible" : r.attempts}</dd>
      </dl>
      <h3>Error original</h3>{pre(r.error || "No disponible")}
      <h3>Data</h3>{pre(r.data)}
      <h3>Options</h3>{pre(r.options)}
      <h3>Stacktrace</h3>{pre(r.stacktrace)}
      <a className="cf-a" href={cfQueueUrl(r.queue, "failed")} target="_blank" rel="noreferrer">↗ Abrir cola de origen</a>
    </>
  );
}
