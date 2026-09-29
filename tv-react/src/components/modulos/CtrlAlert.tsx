import type { CtrlFailedState } from "../../hooks/useControllerFailed";

/** Alerta compacta del diagnóstico de consultaDocumentoCore (clic abre el panel). */
export function CtrlAlert({ state, onOpen }: { state: CtrlFailedState; onOpen: () => void }) {
  const a = state.assess;
  if (!a) return <div style={{ display: "none", marginTop: 8 }}></div>;
  return (
    <div style={{ display: "block", marginTop: 8 }}>
      <div className={`cf-alert lv-${a.lv}`} onClick={onOpen} title="Ver análisis completo">
        <span style={{ fontSize: "1.15rem", flexShrink: 0 }}>{a.icon}</span>
        <div>
          <div className="cf-alert-t">{a.title} · Consulta Doc. Core</div>
          <div className="cf-alert-s">{a.text}{state.rows.length ? ` · ${state.rows.length} caso(s) · ${state.clients.length} RUC` : ""}</div>
        </div>
        <span className="cf-alert-go">Ver análisis ›</span>
      </div>
    </div>
  );
}
