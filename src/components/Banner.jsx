import { useState, useEffect } from "react";

export default function Banner({ slides, seasonLabel }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(t);
  }, [slides]);

  if (!slides || slides.length === 0) return null;
  const current = slides[idx];

  const go = (n) => setIdx((n + slides.length) % slides.length);

  return (
    <section className="banner" aria-label="Portada">
      <div className="banner__slides">
        {slides.map((s, i) => (
          <div
            key={s.id != null ? s.id : i}
            className={"banner__slide" + (i === idx ? " banner__slide--active" : "")}
            style={s.image ? { backgroundImage: `url(${s.image})` } : undefined}
          >
            <div className="banner__overlay" />
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