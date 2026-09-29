import { useCallback, useState } from "react";
import { CTRL_Q, LS_BULL_VIEW } from "../config/constantes";
import { fetchBullData, saveBullHistory } from "../lib/bull";
import type { BullData, BullView } from "../types/bull";

const vistaInicial = (): BullView => {
  try { return localStorage.getItem(LS_BULL_VIEW) === "gauge" ? "gauge" : "topo"; } catch { return "topo"; }
};

/** Colas Bull (Core + Controller), vista mapa/gauges y disparo del análisis del Controller. */
export function useBull(onCtrlFailed: (failed: number) => void) {
  const [data, setData] = useState<BullData | null>(null);
  const [view, setViewState] = useState<BullView>(vistaInicial);

  const setView = useCallback((v: BullView) => {
    setViewState(v);
    try { localStorage.setItem(LS_BULL_VIEW, v); } catch { /* bloqueado */ }
  }, []);

  const load = useCallback(async (): Promise<void> => {
    try {
      const d = await fetchBullData();
      if (d.cQ && d.tQ) saveBullHistory(d.cQ, d.tQ);
      setData(d);
      // Análisis de fallos de consultaDocumentoCore (solo si la cola respondió)
      if (d.tQ) {
        const q = d.tQ.find((x) => x.name === CTRL_Q);
        onCtrlFailed(q?.counts?.failed || 0);
      }
    } catch (e) {
      console.error("Bull error:", e);
    }
  }, [onCtrlFailed]);

  return { data, view, setView, load };
}
