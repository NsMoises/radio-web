import { useState, useEffect } from "react";
import bannerFallback from "../data/banner.json";

const FALLBACK_IMAGES = (bannerFallback.slides || []).map((s) => s.image).filter(Boolean);

export default function Banner({ slides, seasonLabel }) {
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState({});

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(t);
  }, [slides]);

  useEffect(() => {
    if (!slides) return;
    slides.forEach((s, i) => {
      if (!s.image) { setFailed((f) => ({ ...f, [i]: true })); return; }
      const img = new Image();
      img.onload = () => setFailed((f) => ({ ...f, [i]: false }));
      img.onerror = () => setFailed((f) => ({ ...f, [i]: true }));
      img.src = s.image;
    });
  }, [slides]);

  if (!slides || slides.length === 0) return null;
  const current = slides[idx];

  const go = (n) => setIdx((n + slides.length) % slides.length);

  const imageFor = (s, i) => {
    if (!s.image || failed[i]) {
      return FALLBACK_IMAGES[i % FALLBACK_IMAGES.length] || "";
    }
    return s.image;
  };

  return (
    <section className="banner" aria-label="Portada">
      <div className="banner__slides">
        {slides.map((s, i) => (
          <div
            key={s.id != null ? s.id : i}
            className={"banner__slide" + (i === idx ? " banner__slide--active" : "")}
          >
            {imageFor(s, i) ? (
              <img className="banner__img" src={imageFor(s, i)} alt={s.title} loading={i === 0 ? "eager" : "lazy"} />
            ) : null}
            <div className="banner__caption">
              <span className="banner__season">{seasonLabel}</span>
              <h2 className="banner__title">{s.title}</h2>
              <p className="banner__subtitle">{s.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button className="banner__arrow banner__arrow--prev"
            onClick={() => go(idx - 1)} aria-label="Anterior">‹</button>
          <button className="banner__arrow banner__arrow--next"
            onClick={() => go(idx + 1)} aria-label="Siguiente">›</button>
          <div className="banner__dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={"banner__dot" + (i === idx ? " banner__dot--active" : "")}
                onClick={() => go(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}