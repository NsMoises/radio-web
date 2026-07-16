import { useState } from "react";
import { useNews } from "../hooks/useNews.js";

export default function News() {
  const { data } = useNews();
  const [open, setOpen] = useState(null);
  const sorted = [...(data?.articles || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!data) return (
    <div className="page">
      <header className="page__head"><h1 className="page__title">Noticias</h1></header>
      <p style={{ color: "var(--text-dim)" }}>Cargando noticias…</p>
    </div>
  );

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title">Noticias</h1>
        <p className="page__sub">Crónica musical, novedades y reportajes de nuestra redacción.</p>
      </header>

      <div className="news-list">
        {sorted.map((n) => (
          <article className="news-item" key={n.id}>
            <img src={n.cover} alt={n.title} loading="lazy" />
            <div className="news-item__body">
              <div className="news-item__tags">
                <time className="news-item__date">
                  {new Date(n.date).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                </time>
                {n.category && (
                  <span className={"news-badge news-badge--" + n.category.toLowerCase()}>{n.category}</span>
                )}
              </div>
              <h2 className="news-item__title">{n.title}</h2>
              <p className="news-item__excerpt">{n.excerpt}</p>
              <button
                className="btn btn--ghost btn--small"
                onClick={() => setOpen(open === n.id ? null : n.id)}
              >
                {open === n.id ? "Cerrar" : "Leer más"}
              </button>
              {open === n.id && <p className="news-item__body-text">{n.body}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}