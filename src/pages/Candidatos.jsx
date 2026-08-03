import { useState, useEffect } from "react";
import { useCandidatos } from "../hooks/useCandidatos.js";
import { useVotoCandidato } from "../hooks/useVotoCandidato.js";
import { youtubeEmbed } from "../utils/youtube-utils.js";
import CandidateCard from "../components/CandidateCard.jsx";

export default function Candidatos() {
  const { data, loading } = useCandidatos();
  const cv = useVotoCandidato();
  const [playCandidate, setPlayCandidate] = useState(null);

  const candidatos = data?.candidatos || [];
  const weekLabel = data?.weekLabel || "Candidatos de la semana";

  useEffect(() => {
    if (!playCandidate) return;
    const onKey = (e) => { if (e.key === "Escape") setPlayCandidate(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playCandidate]);

  useEffect(() => {
    document.body.style.overflow = playCandidate ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [playCandidate]);

  return (
    <div className="page">
      <header className="page__head page__head--center">
        <p className="page__kicker">CANDIDATOS DE LA SEMANA</p>
        <h1 className="page__title page__title--xl">Candidatos</h1>
        <div className="page__weeklabel">{weekLabel}</div>
        <p className="page__sub">
          Estos son los <strong>{candidatos.length} candidatos</strong> para la próxima semana.
          Vota por tu favorito y pulsa cualquier tarjeta para ver su vídeo.
        </p>
      </header>

      {cv.voteMsg && <div className="vote-toast">{cv.voteMsg}</div>}

      {loading && <p className="page__sub" style={{ color: "var(--text-dim)" }}>Cargando candidatos…</p>}

      <div className="candidatos-grid">
        {candidatos.map((c) => (
          <CandidateCard key={c.id} c={c} cv={cv} onPlay={() => setPlayCandidate(c)} />
        ))}
      </div>

      {playCandidate && (
        <div className="video-modal" onClick={() => setPlayCandidate(null)} role="dialog" aria-modal="true">
          <div className="video-modal__inner" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal__close" onClick={() => setPlayCandidate(null)} aria-label="Cerrar">✕</button>
            <div className="video-modal__frame">
              <iframe key={playCandidate.id} src={youtubeEmbed(playCandidate.videoId)} title={playCandidate.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
            <div className="video-modal__meta">
              <span className="video-modal__rank">#{playCandidate.position}</span>
              <div>
                <div className="video-modal__title">{playCandidate.title}</div>
                <div className="video-modal__artist">{playCandidate.artist}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
