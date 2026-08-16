import { useState, useEffect, useMemo } from "react";
import { useVideos } from "../hooks/useVideos.js";
import { useVotoVideo } from "../hooks/useVotoVideo.js";
import { decorateSongs } from "../utils/ranking-utils";
import { extractYouTubeId, youtubeEmbed } from "../utils/youtube-utils.js";
import { weekRangeLabel } from "../utils/date-utils.js";
import SongCard from "../components/SongCard.jsx";
import { RankingHeaderSkeleton, RankingGridSkeleton } from "../components/Skeleton.jsx";

const COLS = 3;

function videoToSong(v, fallbackDate) {
  return {
    id: v.videoId || v.id,
    position: v.rank,
    lastWeekPosition: v.lastWeekPosition || 0,
    peakPosition: v.peakPosition || v.rank,
    title: v.title,
    artist: v.artist,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    enteredAt: v.enteredAt || fallbackDate,
    isNew: !!v.isNew,
    badge: v.badge || ""
  };
}

export default function Top15Videos() {
  const { data: videosData, loading } = useVideos();
  const { votes, myVote, vote, voteMsg } = useVotoVideo();
  const videos = videosData?.videos || [];
  const cols = COLS;

  const songs = useMemo(() => {
    const fallbackDate = videosData?.lastUpdatedAt || new Date().toISOString().slice(0, 10);
    return decorateSongs(videos.map((v) => videoToSong(v, fallbackDate)));
  }, [videos, videosData]);

  const [active, setActive] = useState(null);

  const updated = videosData?.lastUpdatedAt
    ? new Date(videosData.lastUpdatedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const weekTitle = videosData?.lastUpdatedAt ? weekRangeLabel(videosData.lastUpdatedAt) : "Semana actual";

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  if (loading) {
    return (
      <div className="page">
        <RankingHeaderSkeleton />
        <RankingGridSkeleton count={15} cols={COLS} />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__head page__head--center">
        <p className="page__kicker">TOP VÍDEOS DE LA SEMANA</p>
        <h1 className="page__title page__title--xl">Top 15</h1>
        <div className="page__weeklabel">{weekTitle}</div>
        <p className="page__sub">
          Actualizado el <strong>{updated}</strong>. Pulsa cualquier tarjeta para ver
          su vídeo aquí mismo.
        </p>
      </header>

      {voteMsg && <div className="vote-toast">{voteMsg}</div>}

      <div className="top20-layout">
        <div className="songgrid" style={{ "--grid-cols": cols }}>
          {songs.map((s) => (
            <SongCard
              key={s.id}
              song={s}
              onPick={() => setActive(s)}
              isPicked={active?.id === s.id}
              votes={votes}
              myVote={myVote}
              onVote={vote}
            />
          ))}
        </div>

        <aside className="legend legend--sticky">
          <h3>Leyenda</h3>
          <ul>
            <li><span className="trend trend-up">▲</span> Sube</li>
            <li><span className="trend trend-down">▼</span> Baja</li>
            <li><span className="trend trend-steady">●</span> Igual</li>
            <li><span className="trend trend-new">★</span> Nueva</li>
            <li><span className="trend trend-reen">↻</span> Reentrada</li>
          </ul>
        </aside>
      </div>

      {active && (
        <div className="video-modal" onClick={() => setActive(null)} role="dialog" aria-modal="true">
          <div className="video-modal__inner" onClick={(e) => e.stopPropagation()}>
            <button
              className="video-modal__close"
              onClick={() => setActive(null)}
              aria-label="Cerrar vídeo"
              title="Cerrar (Esc)"
            >
              ✕
            </button>
            <div className="video-modal__frame">
              <iframe
                key={active.id}
                src={youtubeEmbed(extractYouTubeId(active.url))}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="video-modal__meta">
              <span className="video-modal__rank">#{active.position}</span>
              <div>
                <div className="video-modal__title">{active.title}</div>
                <div className="video-modal__artist">{active.artist}</div>
                {active.badge && <div className="video-modal__badge">{active.badge}</div>}
                <div className="video-modal__extra">
                  <span className={"trend " + active.trend.className}>
                    {active.trend.symbol} {active.trend.label}
                  </span>
                  <span className="modal-weeks"> · {active.weeksLabel} en lista</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}