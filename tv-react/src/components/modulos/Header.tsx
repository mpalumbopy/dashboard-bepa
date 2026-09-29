interface Props { lastUpd: string; flash: boolean; status: string; countdown: number }

/** Encabezado: título, última actualización, estado y cuenta regresiva. */
export function Header({ lastUpd, flash, status, countdown }: Props) {
  return (
    <div className="hdr">
      <div>
        <div className="hdr-title"><span className="dot-live"></span>Panel de Tickets · BEPA
          <span style={{ fontSize: ".9rem", fontWeight: 500, color: "var(--gr)", marginLeft: 12, opacity: flash ? 1 : 0, transition: "opacity .4s" }}>⚡ Actualizado</span>
        </div>
        <div className="hdr-sub">{lastUpd}</div>
      </div>
      <div className="hdr-right">
        <div style={{ marginBottom: 4, fontSize: ".8rem", color: "var(--muted)" }}>{status}</div>
        <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>próx. verificación <span style={{ color: "var(--text)", fontSize: ".9rem", fontWeight: 700 }}>{countdown}s</span></div>
      </div>
    </div>
  );
}
