import { useEffect, useRef, useState } from "react";
import { CHECK_INTERVAL } from "../config/constantes";

/**
 * Carga inicial y verificación cada CHECK_INTERVAL segundos, con cuenta regresiva.
 * Igual que tv.html: la cuenta arranca recién cuando termina la primera carga.
 */
export function usePolling(refresh: () => Promise<void>) {
  const [countdown, setCountdown] = useState(CHECK_INTERVAL);
  const [status, setStatus] = useState("● en vivo");
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let timer: number | undefined;
    let vivo = true;
    let restante = CHECK_INTERVAL;

    const tick = () => {
      restante--;
      setCountdown(restante);
      if (restante <= 0) {
        restante = CHECK_INTERVAL;
        setStatus("🔄 actualizando...");
        refreshRef.current()
          .then(() => { if (vivo) setStatus("● en vivo"); })
          .catch(() => { if (vivo) setStatus("⚠ error"); });
      }
    };

    refreshRef.current().then(() => {
      if (!vivo) return;
      restante = CHECK_INTERVAL;
      timer = window.setInterval(tick, 1000);
    });

    return () => { vivo = false; window.clearInterval(timer); };
  }, []);

  return { countdown, status };
}
