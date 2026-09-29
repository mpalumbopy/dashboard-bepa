import { MONITOR_URLS, Q_LABELS } from "../../config/constantes";
import { sc, sf, sumCount } from "../../lib/bull";
import type { BullQueue } from "../../types/bull";

const FONT = "Segoe UI,Arial,sans-serif";

/** Línea punteada animada (flujo entre nodos). */
function Aln({ x1, y1, x2, y2, c, d }: { x1: number; y1: number; x2: number; y2: number; c: string; d: number }) {
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1.5" strokeDasharray="5 4" opacity=".65">
      <animate attributeName="stroke-dashoffset" from="0" to="-18" dur={`${d}s`} repeatCount="indefinite" />
    </line>
  );
}

/** Badge de la derecha de cada cola: fallos, activos o en espera. */
function Badge({ x, y, f, a, w, fs }: { x: number; y: number; f: number; a: number; w: number; fs: [number, number] }) {
  if (f > 0) return <text x={x} y={y} textAnchor="end" fontSize={fs[0]} fontWeight="700" fill="#ef4444" fontFamily={FONT}>{f}</text>;
  if (a > 0) return <text x={x} y={y} textAnchor="end" fontSize={fs[1]} fill="#60a5fa" fontFamily={FONT}>⚡{a}</text>;
  if (w > 0) return <text x={x} y={y} textAnchor="end" fontSize={fs[1]} fill="#f59e0b" fontFamily={FONT}>{w}</text>;
  return null;
}

/** Anillo pulsante alrededor de un nodo con errores. */
function Pulse({ cy, clr, dur }: { cy: number; clr: string; dur: string }) {
  return (
    <circle cx="380" cy={cy} r="42" fill="none" stroke={clr} strokeWidth="1">
      <animate attributeName="r" values="36;44;36" dur={dur} repeatCount="indefinite" />
      <animate attributeName="opacity" values=".4;0;.4" dur={dur} repeatCount="indefinite" />
    </circle>
  );
}

const CTRL_NM: Record<string, string> = {
  envioDocumentoCore: "Env.Doc.", consultaDocumentoCore: "Con.Doc.", RetornoDocumentoCore: "Ret.Doc.",
  envioEventoCore: "Env.Ev.", consultaEventoCore: "Con.Ev.", RetornoEventoCore: "Ret.Ev.",
};

interface Props { cQ: BullQueue[] | null; tQ: BullQueue[] | null; onOpenCtrl: () => void }

/** Mapa de servicios: Futura100 → Core / Controller → colas → SIFEN. */
export function TopologyMap({ cQ, tQ, onOpenCtrl }: Props) {
  if (!cQ && !tQ) {
    return <text x="450" y="115" textAnchor="middle" fill="#3a4a66" fontSize="13" fontFamily={FONT}>Sin datos de colas</text>;
  }
  const cFailed = sumCount(cQ, "failed"), tFailed = sumCount(tQ, "failed");
  const cActive = sumCount(cQ, "active"), tActive = sumCount(tQ, "active");
  const cClr = sc(cFailed), tClr = sc(tFailed);
  const sifenF = (cQ || []).filter((q) => ["envioSifen", "consultaSifen"].includes(q.name)).reduce((s, q) => s + (q.counts?.failed || 0), 0);
  const sClr = sc(sifenF);

  return (
    <>
      <line x1="0" y1="115" x2="900" y2="115" stroke="#0c1627" strokeWidth="1" />
      <circle cx="68" cy="115" r="54" fill="none" stroke="#1e3a5f" strokeWidth="1">
        <animate attributeName="r" values="46;58;46" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values=".2;0;.2" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="68" cy="115" r="44" fill="#091425" stroke="#1e3a5f" strokeWidth="1.5" />
      <text x="68" y="110" textAnchor="middle" fontSize="11" fontWeight="700" fill="#93c5fd" fontFamily={FONT}>FUTURA</text>
      <text x="68" y="124" textAnchor="middle" fontSize="11" fontWeight="700" fill="#60a5fa" fontFamily={FONT}>100</text>
      <Aln x1={112} y1={106} x2={346} y2={77} c={cClr} d={0.85} />
      <Aln x1={112} y1={124} x2={346} y2={153} c={tClr} d={1.15} />

      {cFailed > 0 && <Pulse cy={72} clr={cClr} dur="1.2s" />}
      <a href={MONITOR_URLS.core} target="_blank">
        <circle cx="380" cy="72" r="34" fill={sf(cFailed)} stroke={cClr} strokeWidth="1.5" />
        <text x="380" y="63" textAnchor="middle" fontSize="11" fontWeight="700" fill={cClr} fontFamily={FONT}>CORE</text>
        <text x="380" y="79" textAnchor="middle" fontSize="17" fontWeight="900" fill={cClr} fontFamily={FONT}>{cFailed === 0 ? "✓" : cFailed}</text>
        <text x="380" y="91" textAnchor="middle" fontSize="8" fill={cFailed > 0 ? cClr : "#3a4a66"} fontFamily={FONT}>{cFailed > 0 ? "errores" : cActive > 0 ? cActive + " act" : "ok"}</text>
        <text x="380" y="103" textAnchor="middle" fontSize="8" fill="#4a6a9f" fontFamily={FONT}>↗ monitor</text>
      </a>

      {tFailed > 0 && <Pulse cy={158} clr={tClr} dur="1s" />}
      <g style={{ cursor: "pointer" }} onClick={onOpenCtrl}>
        <title>Ver análisis de fallos del Controller</title>
        <circle cx="380" cy="158" r="34" fill={sf(tFailed)} stroke={tClr} strokeWidth="1.5" />
        <text x="380" y="149" textAnchor="middle" fontSize="11" fontWeight="700" fill={tClr} fontFamily={FONT}>CTRL</text>
        <text x="380" y="165" textAnchor="middle" fontSize="17" fontWeight="900" fill={tClr} fontFamily={FONT}>{tFailed === 0 ? "✓" : tFailed}</text>
        <text x="380" y="177" textAnchor="middle" fontSize="8" fill={tFailed > 0 ? tClr : "#3a4a66"} fontFamily={FONT}>{tFailed > 0 ? "🔎 análisis" : tActive > 0 ? tActive + " act" : "ok"}</text>
      </g>
      <a href={MONITOR_URLS.controller} target="_blank">
        <text x="380" y="189" textAnchor="middle" fontSize="8" fill="#4a6a9f" fontFamily={FONT}>↗ monitor</text>
      </a>

      <Aln x1={414} y1={72} x2={526} y2={56} c={cClr} d={0.8} />
      <line x1="526" y1="22" x2="526" y2="90" stroke={cClr} strokeWidth="1" opacity=".2" />
      <Aln x1={414} y1={158} x2={526} y2={158} c={tClr} d={1.0} />
      <line x1="526" y1="148" x2="526" y2="222" stroke={tClr} strokeWidth="1" opacity=".2" />
      <text x="528" y="16" fontSize="8" fill="#3a4a66" fontFamily={FONT} fontWeight="700" letterSpacing="1.2">CORE ({(cQ || []).length} colas)</text>
      <text x="528" y="138" fontSize="8" fill="#3a4a66" fontFamily={FONT} fontWeight="700" letterSpacing="1.2">CONTROLLER ({(tQ || []).length} colas)</text>

      {(cQ || []).slice(0, 9).map((q, i) => {
        const x = 528 + (i % 3) * 68, y = 22 + Math.floor(i / 3) * 26;
        const f = q.counts?.failed || 0, a = q.counts?.active || 0, w = q.counts?.waiting || 0;
        const clr = sc(f);
        const nm = (Q_LABELS[q.name] || q.name).replace("Envío ", "Env.").replace("Consulta ", "Con.").replace("Retorno ", "Ret.").replace("Documento", "Doc").replace("Evento", "Ev").replace("Sifen", "Sif").slice(0, 7);
        return (
          <g key={q.name}>
            <rect x={x} y={y} width="60" height="20" rx="3" fill={sf(f)} stroke={clr} strokeWidth="1.1" />
            <text x={x + 4} y={y + 13} fontSize="8" fill={f > 0 ? clr : "#8899bb"} fontFamily={FONT}>{nm}</text>
            <Badge x={x + 56} y={y + 14} f={f} a={a} w={w} fs={[9, 8]} />
          </g>
        );
      })}

      {(tQ || []).slice(0, 6).map((q, i) => {
        const x = 528 + (i % 2) * 104, y = 148 + Math.floor(i / 2) * 26;
        const f = q.counts?.failed || 0, a = q.counts?.active || 0, w = q.counts?.waiting || 0;
        const clr = sc(f), nm = CTRL_NM[q.name] || (Q_LABELS[q.name] || q.name).slice(0, 8);
        return (
          <g key={q.name}>
            <rect x={x} y={y} width="84" height="20" rx="3" fill={sf(f)} stroke={clr} strokeWidth="1.1" />
            <text x={x + 5} y={y + 13} fontSize="9" fill={f > 0 ? clr : "#8899bb"} fontFamily={FONT}>{nm}</text>
            <Badge x={x + 80} y={y + 14} f={f} a={a} w={w} fs={[9, 8]} />
          </g>
        );
      })}

      <Aln x1={614} y1={34} x2={742} y2={86} c={sClr} d={0.75} />
      <polygon points="767,68 792,86 767,104 742,86" fill={sf(sifenF)} stroke={sClr} strokeWidth="1.5" />
      <text x="767" y="83" textAnchor="middle" fontSize="9" fontWeight="700" fill={sClr} fontFamily={FONT}>SIFEN</text>
      <text x="767" y="96" textAnchor="middle" fontSize="9" fill={sClr} fontFamily={FONT}>{sifenF > 0 ? "✗ " + sifenF : "✓ ok"}</text>
    </>
  );
}
