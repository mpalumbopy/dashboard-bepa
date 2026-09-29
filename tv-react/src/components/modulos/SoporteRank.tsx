import { TEAMS } from "../../config/constantes";
import { sCat } from "../../lib/utils";
import type { JiraIssue } from "../../types/jira";

interface UserLoad { name: string; enc: number; por: number; total: number; disp: string }

/** Carga de trabajo por integrante de Soporte (excluye tickets en pausa). */
export function SoporteRank({ issues }: { issues: JiraIssue[] | null }) {
  let rows: UserLoad[] = [];
  if (issues) {
    const map: Record<string, UserLoad> = {};
    for (const name of TEAMS.soporte) map[name] = { name, enc: 0, por: 0, total: 0, disp: "" };
    for (const i of issues) {
      const d = i.fields?.assignee?.displayName || "";
      const key = TEAMS.soporte.find((n) => d.toLowerCase().startsWith(n));
      if (!key) continue;
      const cat = sCat(i.fields?.status?.name);
      if (cat === "pau") continue;
      if (cat === "enc") map[key].enc++;
      else if (cat === "por") map[key].por++;
      map[key].total++;
      if (!map[key].disp) map[key].disp = d.split(" ")[0];
    }
    rows = Object.values(map).sort((a, b) => b.total - a.total);
  }
  const maxT = rows.reduce((m, u) => Math.max(m, u.total), 1);

  return (
    <div className="sop-section">
      <div className="sop-section-title">🎧 &nbsp;Carga de Trabajo · Soporte</div>
      <div>
        {rows.map((u) => {
          const nm = u.disp || u.name.charAt(0).toUpperCase() + u.name.slice(1);
          return (
            <div className="sop-row" key={u.name}>
              <div className="sop-name">{nm}</div>
              <div className="sop-bar-wrap">
                <div className="sop-bar-enc" style={{ width: `${Math.round((u.enc / maxT) * 100)}%` }}></div>
                <div className="sop-bar-por" style={{ width: `${Math.round((u.por / maxT) * 100)}%` }}></div>
              </div>
              <div className="sop-total">{u.total}</div>
              <div className="sop-badges">
                {u.enc > 0 && <span className="sop-badge enc">⚡ {u.enc}</span>}
                {u.por > 0 && <span className="sop-badge por">○ {u.por}</span>}
                {!u.total && <span className="sop-badge pau">sin tickets</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
