import { useMemo, useState, useEffect } from "react";
import { useRanking } from "../hooks/useRanking.js";
import { useVotos } from "../hooks/useVotos.js";
import { decorateSongs } from "../utils/ranking-utils";
import { extractYouTubeId, youtubeEmbed } from "../utils/youtube-utils.js";
import { weekRangeLabel } from "../utils/date-utils.js";
import SongCard from "../components/SongCard.jsx";
import { RankingHeaderSkeleton, RankingGridSkeleton } from "../components/Skeleton.jsx";

const COLS = 3;

export default function RankingTop20() {
  const { data, loading, error } = useRanking();
  const { votes, myVote, vote, voteMsg } = useVotos();
  const songs = useMemo(() => decorateSongs(data?.songs || []), [data]);
  const [active, setActive] = useState(null);   // null => modal cerrado
  const cols = COLS;

  const updated = data?.lastUpdatedAt
    ? new Date(data.lastUpdatedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : "—";
  const weekTitle = data?.lastUpdatedAt ? weekRangeLabel(data.lastUpdatedAt) : "Semana actual";

  // Cierra el modal con tecla Escape
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Bloquea scroll de fondo mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  if (loading) {
    return (
      <div className="page">
        <RankingHeaderSkeleton />
        <RankingGridSkeleton count={20} cols={COLS} />
      </div>
    );
  }
  if (error === "offline" && songs.length === 0) {
    return <div className="page"><p style={{ color: "var(--text-dim)" }}>No hay ranking disponible.</p></div>;
  }

  return (
    <div className="page">
      <header className="page__head page__head--center">
        <p className="page__kicker">RANKING SEMANAL · TIPO BILLBOARD</p>
        <h1 className="page__title page__title--xl">Top 20</h1>
        <div className="page__weeklabel">{weekTitle}</div>
        <p className="page__sub">
          Actualizado el <strong>{updated}</strong>. Pulsa cualquier tarjeta para ver
          su vídeo aquí mismo. El tiempo en lista se calcula automáticamente según la
          fecha de entrada de cada canción.
        </p>
      </header>

      {voteMsg && <div className="vote-toast">{voteMsg}</div>}

      {/* Layout: cuadrícula izq + leyenda fija derecha */}
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

      {/* Modal centrado — solo cuando hay canción activa */}
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
                <div className="video-modal__extra">
                  <span className={"trend " + active.trend.className}>
                    {active.trend.symbol} {active.trend.label}
                  </span>
                  <span> · Pico #{active.peak}</span>
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