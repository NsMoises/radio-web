import React, { useEffect, useRef } from "react";

const STREAKS = [
  {
    mask: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0) 36%, rgb(0, 0, 0) 55%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)",
  },
  {
    mask: "linear-gradient(90deg, rgba(0, 0, 0, 0) 11%, rgb(0, 0, 0) 25%, rgba(0, 0, 0, 0.55) 41%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 78%, rgba(0, 0, 0, 0) 97%)",
  },
  {
    mask: "linear-gradient(90deg, rgba(0, 0, 0, 0) 9%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0.55) 28%, rgba(0, 0, 0, 0.424) 40%, rgb(0, 0, 0) 48%, rgba(0, 0, 0, 0.267) 54%, rgba(0, 0, 0, 0.13) 78%, rgb(0, 0, 0) 88%, rgba(0, 0, 0, 0) 97%)",
  },
  {
    mask: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 17%, rgba(0, 0, 0, 0.55) 26%, rgb(0, 0, 0) 35%, rgba(0, 0, 0, 0) 47%, rgba(0, 0, 0, 0.13) 69%, rgb(0, 0, 0) 79%, rgba(0, 0, 0, 0) 97%)",
  },
  {
    mask: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 20%, rgba(0, 0, 0, 0.55) 27%, rgb(0, 0, 0) 42%, rgba(0, 0, 0, 0) 48%, rgba(0, 0, 0, 0.13) 67%, rgb(0, 0, 0) 74%, rgb(0, 0, 0) 82%, rgba(0, 0, 0, 0.47) 88%, rgba(0, 0, 0, 0) 97%)",
  },
];

const ORBS = [
  { top: "-12%", left: "-8%", size: 560, color: "0, 229, 255", depth: 36, dur: 18, op: 0.32, delay: 0 },
  { top: "15%", left: "78%", size: 480, color: "59, 130, 246", depth: 64, dur: 22, op: 0.26, delay: 2 },
  { top: "55%", left: "-10%", size: 420, color: "139, 92, 246", depth: 50, dur: 26, op: 0.24, delay: 4 },
  { top: "62%", left: "72%", size: 380, color: "0, 207, 255", depth: 80, dur: 20, op: 0.22, delay: 1 },
  { top: "88%", left: "22%", size: 520, color: "217, 70, 239", depth: 56, dur: 24, op: 0.20, delay: 3 },
];

const FILL = "absolute inset-0";

const STYLES = `
@keyframes dgb-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(34px, -44px, 0) scale(1.18); }
}
.dark-bg-orb-wrap { position: absolute; inset: 0; pointer-events: none; }
.dark-bg-orb {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
  animation: dgb-float 18s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .dark-bg-orb { animation: none; }
  .dark-bg-orb-wrap { transform: none !important; }
}
`;

export default function DarkGradientBg({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      el.style.setProperty("--mx", nx.toFixed(4));
      el.style.setProperty("--my", ny.toFixed(4));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="dark-gradient-bg"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "#000",
        pointerEvents: "none",
      }}
    >
      <style>{STYLES}</style>

      <div
        className={FILL}
        style={{
          background:
            "radial-gradient(100% 100% at 0% 0%, rgb(58, 58, 58) 0%, rgb(0, 0, 0) 100%)",
          mask: "radial-gradient(140% 110% at 35% 20%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 55%, rgba(0, 0, 0, 0) 90%)",
        }}
      />
      {STREAKS.map((s, i) => (
        <div
          key={i}
          className={FILL}
          style={{
            opacity: 0.35,
            transform: "skewX(45deg)",
            background:
              "linear-gradient(rgb(0, 207, 255) 0%, rgba(0, 207, 255, 0) 100%)",
            mask: s.mask,
          }}
        />
      ))}

      {/* Orbes de luz 3D con parallax */}
      {ORBS.map((o, i) => (
        <div
          key={i}
          className="dark-bg-orb-wrap"
          style={{
            transform: `translate3d(calc(var(--mx, 0) * ${o.depth}px), calc(var(--my, 0) * ${o.depth}px), 0)`,
          }}
        >
          <div
            className="dark-bg-orb"
            style={{
              width: o.size,
              height: o.size,
              top: o.top,
              left: o.left,
              opacity: o.op,
              filter: "blur(72px)",
              background: `radial-gradient(circle, rgba(${o.color}, 0.7) 0%, rgba(${o.color}, 0) 62%)`,
              animationDuration: `${o.dur}s`,
              animationDelay: `${o.delay}s`,
            }}
          />
        </div>
      ))}

      <div
        className={FILL}
        style={{
          opacity: 0.08,
          backgroundRepeat: "repeat",
          backgroundImage:
            'url("https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png")',
          backgroundSize: "149.76px",
        }}
      />
      <div
        className={FILL}
        style={{
          opacity: 0.25,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      <div
        className={FILL}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(30, 41, 59, 0.2) 0%, rgba(0, 0, 0, 0) 50%)",
        }}
      />
      {children ? <div style={{ position: "relative", zIndex: 1, pointerEvents: "auto" }}>{children}</div> : null}
    </div>
  );
}
