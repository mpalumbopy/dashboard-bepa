import type { Counts } from "../../types/jira";
import { AnimatedNumber } from "../ui/AnimatedNumber";

interface Props { counts: Counts | null; loading: boolean }

/** Estadísticas del día y del mes. */
export function StatCards({ counts, loading }: Props) {
  const v = (k: keyof Counts) => (counts ? counts[k] : null);
  return (
    <div className="grid4col">
      <div className="card stat-card acc-y">
        <div className="card-icon">📅</div><div className="card-lbl">Ingresados Hoy</div>
        <AnimatedNumber value={v("hoy")} loading={loading} />
      </div>
      <div className="card stat-card acc-o">
        <div className="card-icon">📆</div><div className="card-lbl">Ingresados en el Mes</div>
        <AnimatedNumber value={v("mes")} loading={loading} />
      </div>
      <div className="card stat-card acc-gr">
        <div className="card-icon">✅</div><div className="card-lbl">Finalizados en el Mes</div>
        <AnimatedNumber value={v("fin")} loading={loading} />
      </div>
      <div className="card stat-card" style={{ ["--accent" as string]: "#06b6d4", background: "linear-gradient(135deg,var(--card),rgba(6,182,212,.04))" }}>
        <div className="card-icon">🎯</div><div className="card-lbl">Cerrados Hoy</div>
        <AnimatedNumber value={v("finHoy")} loading={loading} />
      </div>
    </div>
  );
}
