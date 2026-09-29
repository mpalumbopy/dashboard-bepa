import { MONITOR_URLS, Q_LABELS } from "../../config/constantes";
import type { BullQueue } from "../../types/bull";

const FONT = "Segoe UI,Arial,sans-serif";

function p2c(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Path SVG de un arco (vacío si el barrido es despreciable). */
function arc(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number): string {
  if (Math.abs(sweepDeg) < 0.5) return "";
  const s = p2c(cx, cy, r, startDeg), e = p2c(cx, cy, r, startDeg + sweepDeg);
  return `M${s.x.toFixed(2)} ${s.y.toFixed(2)} A${r} ${r} 0 ${sweepDeg > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

const badgeStyle = (bg: string, c: string) => ({ background: bg, color: c, padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 700 });

/** Gauge radial de una cola: fallos (rojo), activos (azul), en espera (ámbar). */
function Gauge({ q, gMax, sz = 88 }: { q: BullQueue; gMax: number; sz?: number }) {
  const f = q.counts?.failed || 0, a = q.counts?.active || 0, w = q.counts?.waiting || 0;
  const tot = f + a + w, cx = sz / 2, cy = sz * 0.54, r = sz * 0.32, sw = sz * 0.09;
  const k = gMax > 0 ? 270 / gMax : 0, fD = f * k, aD = a * k, wD = w * k;
  const mc = f > 0 ? "#ef4444" : a > 0 ? "#60a5fa" : w > 0 ? "#f59e0b" : "#22c55e";
  const mv = tot > 0 ? (f > 0 ? f : a > 0 ? a : w) : "✓";
  const nm = (Q_LABELS[q.name] || q.name).replace("Envío ", "Env ").replace("Consulta ", "Con ").replace("Retorno ", "Ret ").replace("Documento", "Doc").replace("Evento", "Ev").replace(" Sifen", "").slice(0, 9);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: 4 }}>
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        <path d={arc(cx, cy, r, 135, 270)} fill="none" stroke="#1a2535" strokeWidth={sw} strokeLinecap="round" />
        {fD > 0.5 && <path d={arc(cx, cy, r, 135, fD)} fill="none" stroke="#ef4444" strokeWidth={sw} strokeLinecap="round" />}
        {aD > 0.5 && <path d={arc(cx, cy, r, 135 + fD, aD)} fill="none" stroke="#60a5fa" strokeWidth={sw} strokeLinecap="round" />}
        {wD > 0.5 && <path d={arc(cx, cy, r, 135 + fD + aD, wD)} fill="none" stroke="#f59e0b" strokeWidth={sw} strokeLinecap="round" />}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.round(sz * 0.2)} fontWeight="900" fill={mc} fontFamily={FONT}>{mv}</text>
        <text x={cx} y={(cy + sz * 0.22).toFixed(0)} textAnchor="middle" fontSize={Math.round(sz * 0.1)} fill="#8899bb" fontFamily={FONT}>{nm}</text>
      </svg>
      {(f > 0 || a > 0 || w > 0) && (
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
          {f > 0 && <span style={badgeStyle("rgba(239,68,68,.2)", "#f87171")}>✗{f}</span>}
          {a > 0 && <span style={badgeStyle("rgba(59,130,246,.2)", "#60a5fa")}>⚡{a}</span>}
          {w > 0 && <span style={badgeStyle("rgba(245,158,11,.2)", "#f59e0b")}>⏳{w}</span>}
        </div>
      )}
    </div>
  );
}

/** Grupo de gauges de un servicio (Core o Controller). */
function Group({ queues, label, clr, url }: { queues: BullQueue[] | null; label: string; clr: string; url: string }) {
  const qs = queues || [];
  const gMax = Math.max(1, ...qs.map((q) => (q.counts?.failed || 0) + (q.counts?.active || 0) + (q.counts?.waiting || 0)));
  const totFail = qs.reduce((s, q) => s + (q.counts?.failed || 0), 0);
  const dot = totFail > 20 ? "#ef4444" : totFail > 0 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, display: "inline-block", flexShrink: 0 }}></span>
        <span style={{ fontSize: ".72rem", fontWeight: 700, color: clr, textTransform: "uppercase", letterSpacing: "1.1px" }}>{label} ({qs.length} colas)</span>
        {totFail > 0 && <span style={{ fontSize: ".7rem", color: "#f87171", fontWeight: 700 }}>· {totFail} errores totales</span>}
        <a href={url} target="_blank" style={{ marginLeft: "auto", fontSize: ".7rem", color: "#4a6a9f", textDecoration: "none", opacity: 0.7, flexShrink: 0 }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = "1"; }} onMouseOut={(e) => { e.currentTarget.style.opacity = ".7"; }}>↗ Monitor</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(108px,1fr))", gap: 4 }}>
        {qs.map((q) => <Gauge key={q.name} q={q} gMax={gMax} />)}
      </div>
    </div>
  );
}

/** Vista de gauges radiales de todas las colas. */
export function GaugeGrid({ cQ, tQ }: { cQ: BullQueue[] | null; tQ: BullQueue[] | null }) {
  if (!cQ && !tQ) return <div style={{ textAlign: "center", padding: 20, color: "#3a4a66", fontSize: ".85rem" }}>Sin datos de colas</div>;
  return (
    <>
      <Group queues={cQ} label="Core" clr="#93c5fd" url={MONITOR_URLS.core} />
      <Group queues={tQ} label="Controller" clr="#c084fc" url={MONITOR_URLS.controller} />
    </>
  );
}
