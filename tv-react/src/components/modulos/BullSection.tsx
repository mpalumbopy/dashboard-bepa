import type { CtrlFailedState } from "../../hooks/useControllerFailed";
import type { BullData, BullView } from "../../types/bull";
import { CtrlAlert } from "./CtrlAlert";
import { GaugeGrid } from "./GaugeGrid";
import { TopologyMap } from "./TopologyMap";

interface Props {
  data: BullData | null;
  view: BullView;
  setView: (v: BullView) => void;
  ctrl: CtrlFailedState;
  onOpenCtrl: () => void;
}

const legendItem = (bg: string, bd: string, lbl: string) => (
  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
    <i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: bg, border: `1px solid ${bd}` }}></i>{lbl}
  </span>
);

/** Sección "Cola de Trabajos · Futura100": mapa o gauges + alerta del Controller. */
export function BullSection({ data, view, setView, ctrl, onOpenCtrl }: Props) {
  return (
    <div className="bull-section">
      <div className="section-title">⚙️ &nbsp;Cola de Trabajos · Futura100</div>
      <div className="bull-topo-box">
        <div className="bull-topo-hdr">
          <div className="bull-topo-ttl">{view === "topo" ? "🗺 Mapa de Servicios · Futura100" : "📊 Gauges · Futura100"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div className="bull-view-toggle">
              <button className={`bull-view-btn${view === "topo" ? " active" : ""}`} onClick={() => setView("topo")}>🗺 Mapa</button>
              <button className={`bull-view-btn${view === "gauge" ? " active" : ""}`} onClick={() => setView("gauge")}>📊 Gauges</button>
            </div>
            <button className="cf-btn" onClick={onOpenCtrl} title="Análisis de fallos de consultaDocumentoCore">
              🔎 Análisis Controller <span>{ctrl.rows.length ? `(${ctrl.rows.length})` : ""}</span>
            </button>
            <div className="bull-topo-leg" style={{ display: view === "topo" ? "flex" : "none" }}>
              {legendItem("rgba(34,197,94,.15)", "#22c55e", "OK")}
              {legendItem("rgba(245,158,11,.18)", "#f59e0b", "Advertencia")}
              {legendItem("rgba(239,68,68,.18)", "#ef4444", "Error")}
            </div>
          </div>
        </div>
        <div style={{ display: view === "topo" ? "block" : "none" }}>
          <svg width="100%" height="230" viewBox="0 0 900 230" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
            {data && <TopologyMap cQ={data.cQ} tQ={data.tQ} onOpenCtrl={onOpenCtrl} />}
          </svg>
        </div>
        <div style={{ display: view === "gauge" ? "block" : "none", padding: "8px 0" }}>
          <div>{data && <GaugeGrid cQ={data.cQ} tQ={data.tQ} />}</div>
        </div>
        <CtrlAlert state={ctrl} onOpen={onOpenCtrl} />
      </div>
    </div>
  );
}
