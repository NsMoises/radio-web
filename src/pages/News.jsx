import { useState } from "react";
import { useNews } from "../hooks/useNews.js";
import { extractYouTubeId, youtubeThumb, youtubeEmbed } from "../utils/youtube-utils.js";

export default function News() {
  const { data } = useNews();
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
              {vid ? (
                <div className="news-item__media">
                  {isPlaying ? (
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
                    <button className="news-item__thumb" onClick={() => setPlaying(n.id)} title="Reproducir vídeo">
                      <img src={youtubeThumb(vid)} alt={n.title} loading="lazy" />
                      <span className="news-item__play">▶</span>
                    </button>
                  )}
                </div>
              ) : (
                n.cover && (
                  <div className="news-item__media">
                    <img src={n.cover} alt={n.title} loading="lazy" className="news-item__thumb news-item__thumb--static" />
                  </div>
                )
              )}
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
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}