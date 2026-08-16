import { useState } from "react";
import { extractYouTubeId, youtubeThumb } from "../utils/youtube-utils.js";

// Cuántos puestos subió (+) o bajó (−) respecto a la semana anterior.
function rankDiff(song) {
  const last = song.lastWeekPosition;
  if (last == null || last <= 0) return null;
  return last - song.position;
}

// Genera la miniatura con fallback automático:
// maxresdefault → hqdefault → mqdefault → placeholder.
function useThumb(song) {
  const videoId = extractYouTubeId(song.url);
  const qualities = ["maxresdefault", "hqdefault", "mqdefault", "default"];
  const [idx, setIdx] = useState(0);

  if (!videoId) {
    return {
      src: `https://picsum.photos/seed/${song.videoId || song.id}/400/400`,
      onError: () => {}
    };
  }
  return {
    src: youtubeThumb(videoId, qualities[idx]),
    onError: () => setIdx((i) => (i < qualities.length - 1 ? i + 1 : i))
  };
}

export default function SongCard({ song, onPick, isPicked, votes, myVote, onVote }) {
  const diff = rankDiff(song);
  const { src, onError } = useThumb(song);
  const voteId = song.videoId || extractYouTubeId(song.url) || song.id;
  const voteCount = votes?.[voteId] ?? 0;
  const isMyVote = myVote === voteId;

  const handleVote = (e) => {
    e.stopPropagation();
    if (onVote) onVote(voteId);
  };

  return (
    <button
      className={"songcard" + (isPicked ? " songcard--picked" : "") + (song.position === 1 ? " songcard--top1" : "")}
      onClick={onPick}
      title={`Reproducir vídeo: ${song.title}`}
    >
      <div className="songcard__cover">
        <img src={src} alt={song.title} loading="lazy" onError={onError} />
        <span className="songcard__pos">#{song.position}</span>
        {song.badge && <span className="songcard__badge" title={song.badge}>{song.badge}</span>}
        {song.position === 1 && <span className="songcard__crown" aria-hidden="true">👑</span>}
        <span
          className={"songcard__trend " + (song.trend?.className || "")}
          title={song.trend?.label}
        >
          {song.trend?.symbol}
          {diff != null && diff !== 0 && (
            <span className="songcard__trend-diff">{Math.abs(diff)}</span>
          )}
        </span>
        <span
          className={"songcard__vote" + (isMyVote ? " songcard__vote--done" : "")}
          onClick={handleVote}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleVote(e); }}
          title={isMyVote ? "Retirar voto" : "Votar"}
          aria-label="Votar"
        >
          {isMyVote ? "❤" : "♡"}
          {voteCount > 0 && <span className="songcard__vote-count">{voteCount}</span>}
        </span>
        {isPicked && (
          <span className="songcard__playing" aria-hidden="true">
            <span/><span/><span/><span/>
          </span>
        )}
      </div>
      <div className="songcard__body">
        <div className="songcard__title">{song.title}</div>
        <div className="songcard__artist">{song.artist}</div>
        <div className="songcard__meta">
          <span title="Tendencia">
            {song.trend?.label}
            {diff != null && diff > 0 && ` +${diff}`}
            {diff != null && diff < 0 && ` −${Math.abs(diff)}`}
          </span>
          <span title="Posición anterior">
            Sem. ant. {song.lastWeekPosition > 0 ? `#${song.lastWeekPosition}` : "—"}
          </span>
        </div>
        <div className="songcard__stats">
          <span className="songcard__stat" title="Pico histórico">
            <span className="songcard__stat-label">Pico</span>
            <span className="songcard__stat-value">#{song.peak || song.position}</span>
          </span>
          <span className="songcard__stat songcard__stat--weeks" title="Semanas en lista (auto)">
            <span className="songcard__stat-label">En lista</span>
            <span className="songcard__stat-value">{song.weeksLabel}</span>
          </span>
        </div>
      </div>
    </button>
  );
}