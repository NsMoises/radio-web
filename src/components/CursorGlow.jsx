import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    const tick = () => {
      const p = pos.current;
      const t = target.current;
      p.x += (t.x - p.x) * 0.12;
      p.y += (t.y - p.y) * 0.12;
      el.style.background = `radial-gradient(480px circle at ${p.x}px ${p.y}px, rgba(0,229,255,0.28) 0%, rgba(0,229,255,0.10) 42%, transparent 72%)`;
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" />;
}
