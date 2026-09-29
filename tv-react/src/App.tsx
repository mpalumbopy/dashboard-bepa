import { useCallback, useEffect, useRef, useState } from "react";
import { AreaCards } from "./components/modulos/AreaCards";
import { BullSection } from "./components/modulos/BullSection";
import { CtrlPanel } from "./components/modulos/CtrlPanel";
import { Header } from "./components/modulos/Header";
import { SoporteRank } from "./components/modulos/SoporteRank";
import { StatCards } from "./components/modulos/StatCards";
import { TicketPanel, type Tab } from "./components/modulos/TicketPanel";
import { CTRL_Q } from "./config/constantes";
import { useBull } from "./hooks/useBull";
import { useControllerFailed } from "./hooks/useControllerFailed";
import { useJiraDashboard } from "./hooks/useJiraDashboard";
import { usePolling } from "./hooks/usePolling";
import type { Area } from "./types/jira";

/** Panel TV de BEPA: tickets Jira + colas Futura100 + análisis del Controller. */
export default function App() {
  const jira = useJiraDashboard();
  const ctrl = useControllerFailed();
  const bull = useBull(ctrl.load);

  // Igual que tv.html: primero Jira, luego (sin esperar) las colas Bull
  const refresh = useCallback(async () => {
    await jira.load();
    void bull.load();
  }, [jira.load, bull.load]);
  const { countdown, status } = usePolling(refresh);

  // Panel de tickets por área
  const [area, setArea] = useState<Area | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const selectArea = (a: Area) => {
    if (area === a) { setArea(null); return; }
    setArea(a);
    setTab("all");
  };
  useEffect(() => {
    if (area) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [area]);

  // Panel lateral del Controller
  const [ctrlOpen, setCtrlOpen] = useState(false);
  const openCtrl = useCallback(() => {
    setCtrlOpen(true);
    // Si todavía no hay lectura, forzarla
    if (!ctrl.state.time) {
      const q = (bull.data?.tQ || []).find((x) => x.name === CTRL_Q);
      void ctrl.load(q?.counts?.failed || 0);
    }
  }, [ctrl, bull.data]);
  const closeCtrl = useCallback(() => setCtrlOpen(false), []);

  return (
    <>
      <Header lastUpd={jira.lastUpd} flash={jira.flash} status={status} countdown={countdown} />
      <AreaCards counts={jira.counts} loading={jira.loading} activeArea={area} onSelect={selectArea} />
      <SoporteRank issues={jira.active} />
      <StatCards counts={jira.counts} loading={jira.loading} />
      <BullSection data={bull.data} view={bull.view} setView={bull.setView} ctrl={ctrl.state} onOpenCtrl={openCtrl} />
      <TicketPanel ref={panelRef} area={area} tab={tab} setTab={setTab} onClose={() => setArea(null)} active={jira.active || []} sin={jira.sin} />
      <div className="foot">{jira.foot}</div>
      <CtrlPanel open={ctrlOpen} onClose={closeCtrl} state={ctrl.state} tQ={bull.data?.tQ ?? null} />
    </>
  );
}
