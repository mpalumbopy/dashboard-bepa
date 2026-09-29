import type { Area, Counts } from "../../types/jira";
import { AnimatedNumber } from "../ui/AnimatedNumber";

interface Props {
  counts: Counts | null;
  loading: boolean;
  activeArea: Area | null;
  onSelect: (a: Area) => void;
}

interface Def { area: Area; cls: string; icon: string; lbl: string; key: keyof Counts; sub: string; members?: string }

const DEFS: Def[] = [
  { area: "sin-asignar", cls: "acc-r", icon: "🔴", lbl: "Sin Asignar", key: "sin", sub: "tickets activos" },
  { area: "soporte", cls: "acc-b", icon: "🎧", lbl: "Soporte", key: "sop", sub: "tickets activos", members: "Jaime · Diana · Jorge · Marcos · Leticia · Anibal" },
  { area: "desarrollo", cls: "acc-p", icon: "💻", lbl: "Desarrollo", key: "dev", sub: "tickets activos", members: "Kevin · Daril · Rodrigo · Aldo · Elias · Gustavo · Danays · Blanca" },
  { area: "infra", cls: "acc-g", icon: "🖥️", lbl: "Infraestructura", key: "inf", sub: "tickets activos", members: "Richard · Fabian" },
];

/** Fila superior: tarjetas por área (clic abre el panel de tickets). */
export function AreaCards({ counts, loading, activeArea, onSelect }: Props) {
  const cardCls = (a: Area, cls: string) => `card clickable ${cls}${activeArea === a ? " active-card" : ""}`;
  return (
    <div className="grid4">
      {DEFS.map((d) => (
        <div key={d.area} className={cardCls(d.area, d.cls)} onClick={() => onSelect(d.area)}>
          <div className="card-icon">{d.icon}</div><div className="card-lbl">{d.lbl}</div>
          <AnimatedNumber value={counts ? counts[d.key] : null} loading={loading} />
          <div className="card-sub">{d.sub}</div>
          {d.members && <div className="card-members">{d.members}</div>}
        </div>
      ))}
      <div className={cardCls("wa", "acc-wa")} onClick={() => onSelect("wa")}>
        <div className="card-icon">💬</div><div className="card-lbl">WhatsApp IA</div>
        <AnimatedNumber value={counts ? counts.wa : null} loading={loading} />
        <div className="card-sub">tickets abiertos</div>
        <AnimatedNumber className="" value={counts ? counts.waHoy : null}
          style={{ marginTop: 10, fontSize: "2rem", fontWeight: 900, lineHeight: 1, color: "#25d366", fontVariantNumeric: "tabular-nums" }} />
        <div className="card-sub">ingresados hoy</div>
      </div>
    </div>
  );
}
