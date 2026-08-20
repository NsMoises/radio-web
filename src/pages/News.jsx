import { useState } from "react";
import { useNews } from "../hooks/useNews.js";
import { extractYouTubeId, youtubeThumb, youtubeEmbed } from "../utils/youtube-utils.js";

export default function News() {
  const { data } = useNews();
  const [open, setOpen] = useState(null);
  const [playing, setPlaying] = useState(null);

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
        <p className="page__sub">Vídeos y novedades de nuestra redacción. Pulsa la miniatura para reproducir.</p>
      </header>

      <div className="news-list">
        {sorted.map((n) => {
          const vid = extractYouTubeId(n.video);
          const isPlaying = playing === n.id;
          return (
            <article className="news-item" key={n.id}>
              {vid || n.cover ? (
                <div className="news-item__media">
                  {isPlaying && vid ? (
                    <div className="news-item__video">
                      <iframe
                        src={youtubeEmbed(vid, true)}
                        title={n.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                      <button className="news-item__video-close" onClick={() => setPlaying(null)} title="Cerrar vídeo">✕</button>
                    </div>
                  ) : (
                    <button
                      className="news-item__thumb"
                      onClick={vid ? () => setPlaying(n.id) : undefined}
                      disabled={!vid}
                      title={vid ? "Reproducir vídeo" : n.title}
                    >
                      <img src={youtubeThumb(vid) || n.cover} alt={n.title} loading="lazy" />
                      {vid && <span className="news-item__play">▶</span>}
                    </button>
                  )}
                </div>
              ) : null}
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
                {n.excerpt && <p className="news-item__excerpt">{n.excerpt}</p>}
                {n.body && (
                  <button
                    className="btn btn--ghost btn--small"
                    onClick={() => setOpen(open === n.id ? null : n.id)}
                  >
                    {open === n.id ? "Cerrar" : "Leer más"}
                  </button>
                )}
                {open === n.id && n.body && <p className="news-item__body-text">{n.body}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}