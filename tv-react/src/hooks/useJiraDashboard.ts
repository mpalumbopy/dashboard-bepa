import { useCallback, useRef, useState } from "react";
import { loadJiraSnapshot } from "../lib/jira";
import { horaActual, intentar } from "../lib/utils";
import type { Counts, JiraIssue } from "../types/jira";

/** Estado y carga de los datos de Jira (tarjetas, soporte, panel de tickets). */
export function useJiraDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [active, setActive] = useState<JiraIssue[] | null>(null);
  const [sin, setSin] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpd, setLastUpd] = useState("Cargando datos...");
  const [foot, setFoot] = useState("");
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number>();

  /** Consulta Jira. Nunca lanza: ante error muestra el aviso y conserva los datos previos. */
  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    const res = await intentar(loadJiraSnapshot, "JIRA_ERROR");
    if (res.ok) {
      const { active: act, sin: s, counts: c } = res.data;
      setActive(act);
      setSin(s);
      setCounts(c);
      const now = horaActual();
      setLastUpd(`Actualizado: ${now}  ·  ${act.length} tickets activos`);
      setFoot(`grupobepa.atlassian.net  ·  Total activos: ${act.length}  ·  ${now}`);
      setFlash(true);
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false), 2500);
    } else {
      console.error(res.error.detalle);
      setLastUpd("Error al conectar con Jira — reintentando...");
    }
    setLoading(false);
  }, []);

  return { counts, active, sin, loading, lastUpd, foot, flash, load };
}
