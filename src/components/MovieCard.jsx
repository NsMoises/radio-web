import { useState } from "react";
import { extractYouTubeId, youtubeThumb, youtubeEmbed } from "../utils/youtube-utils.js";

export default function MovieCard({ movie }) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYouTubeId(movie.url);
  const thumb = youtubeThumb(videoId, "maxresdefault") || movie.poster;

  const fmtDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <article className="movie-card">
      <div className="movie-card__frame">
        {playing ? (
          <iframe
            src={youtubeEmbed(videoId)}
            title={movie.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            className="movie-card__poster"
            onClick={() => setPlaying(true)}
            title={`Reproducir tráiler: ${movie.title}`}
          >
            <img src={thumb} alt={movie.title} loading="lazy" onError={(e) => { e.target.src = movie.poster; }} />
            <span className="movie-card__play">▶</span>
            <span className="movie-card__tag">Tráiler</span>
          </button>
        )}
      </div>
      <div className="movie-card__body">
        <div className="movie-card__head">
          <h3 className="movie-card__title">{movie.title}</h3>
          <span className="movie-card__date">{fmtDate(movie.date)}</span>
        </div>
        <span className="movie-card__genre">{movie.genre}</span>
        <p className="movie-card__desc">{movie.description}</p>
      </div>
    </article>
  );
}