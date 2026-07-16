import { useState, useEffect } from "react";

const FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E";

export default function ImgPreview({ src, alt, width = 60, height = 40, style }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) {
    return <img src={FALLBACK} alt="" style={{ width, height, objectFit: "cover", borderRadius: 4, background: "var(--bg-elev)", ...style }} />;
  }
  return (
    <img
      key={src}
      src={src}
      alt={alt || ""}
      style={{ width, height, objectFit: "cover", borderRadius: 4, ...style }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}