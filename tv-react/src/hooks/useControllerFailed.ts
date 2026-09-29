import { useCallback, useRef, useState } from "react";
import { assess, buildClients, readCtrlFailed } from "../lib/controllerFailed";
import { intentar } from "../lib/utils";
import type { Assessment, FailedClient, FailedRow } from "../types/bull";

export interface CtrlFailedState {
  rows: FailedRow[];
  clients: FailedClient[];
  assess: Assessment | null;
  error: string;
  time: Date | null;
}

const VACIO: CtrlFailedState = { rows: [], clients: [], assess: null, error: "", time: null };

/** Estado del análisis de fallos de consultaDocumentoCore. */
export function useControllerFailed() {
  const [state, setState] = useState<CtrlFailedState>(VACIO);
  const running = useRef(false);
  const hasRows = useRef(false);

  /** Recarga el análisis. Si failedCount es 0 limpia sin consultar. */
  const load = useCallback(async (failedCount: number): Promise<void> => {
    if (!failedCount) {
      hasRows.current = false;
      setState({ ...VACIO, time: new Date() });
      return;
    }
    if (running.current) return;
    running.current = true;
    const res = await intentar(readCtrlFailed, "CONTROLLER_ERROR");
    running.current = false;
    if (res.ok) {
      const rows = res.data;
      const clients = buildClients(rows);
      hasRows.current = rows.length > 0;
      setState({ rows, clients, assess: assess(rows, clients), error: "", time: new Date() });
    } else {
      console.warn("Análisis Controller:", res.error.detalle);
      const error = "Sin conexión con Controller: " + res.error.mensaje;
      setState((prev) => ({
        ...prev,
        error,
        // Conserva el análisis previo; si no había, informa que no está disponible
        assess: hasRows.current ? prev.assess : { lv: "info", icon: "⚠️", title: `${failedCount} FALLO(S) · ANÁLISIS NO DISPONIBLE`, text: error },
      }));
    }
  }, []);

  return { state, load };
}
