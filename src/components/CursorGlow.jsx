import { useRef, useState, useEffect, useCallback } from "react";

export default function CursorGlow() {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const handlePointer = useCallback((e) => {
    setPos({
      x: (e.clientX / window.innerWidth) * 100,
      y: (e.clientY / window.innerHeight) * 100,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointer);
    return () => window.removeEventListener("pointermove", handlePointer);
  }, [handlePointer]);

  return (
    <div
      ref={ref}
      className="cursor-glow"
      style={{
        background: `radial-gradient(800px circle at ${pos.x}% ${pos.y}%, rgba(212,168,71,0.10), transparent 60%)`,
      }}
    />
  );
}
