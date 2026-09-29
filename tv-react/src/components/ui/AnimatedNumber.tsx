import { useEffect, useRef, useState, type CSSProperties } from "react";

interface Props {
  value: number | null;
  loading?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Número que muestra "—" sin datos y hace el efecto "num-changed"
 * (escala + blanco) cuando cambia respecto al valor anterior, como tv.html.
 */
export function AnimatedNumber({ value, loading = false, className = "card-num", style }: Props) {
  const prev = useRef<number | null>(null);
  const [anim, setAnim] = useState(0);

  useEffect(() => {
    if (value === null) return;
    const p = prev.current;
    prev.current = value;
    if (p !== null && p !== value) {
      setAnim((n) => n + 1);
      const t = window.setTimeout(() => setAnim(0), 600);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [value]);

  const cls = [className, loading ? "loading" : "", anim ? "num-changed" : ""].filter(Boolean).join(" ");
  // La key reinicia la animación si hay dos cambios seguidos
  return <div key={anim} className={cls} style={style}>{value ?? "—"}</div>;
}
