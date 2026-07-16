import { useState, useEffect, useRef, useCallback } from "react";
import { useVideos } from "../hooks/useVideos.js";
import { Skeleton } from "../components/Skeleton.jsx";
import { youtubeThumb, youtubeEmbed } from "../utils/youtube-utils.js";
import { useVideoPlayer } from "../context/VideoPlayerContext.jsx";

const THUMB = (id) => youtubeThumb(id);
const EMBED = (id, autoplay = 1) =>
  `https://www.youtube.com/embed/${id}?${autoplay ? "autoplay=1&" : ""}rel=0&enablejsapi=1&modestbranding=1`;

export default function Top15Videos() {
  const { data: videosData, loading } = useVideos();
  const videos = videosData?.videos || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [mini, setMini] = useState(false);
  const [darkBg, setDarkBg] = useState(true);
  const timelineRef = useRef(null);
  const itemRefs = useRef([]);

  // Reproductor flotante global
  const vp = useVideoPlayer();
  const vpSetIdx = useRef(vp.setCurrentIdx);
  vpSetIdx.current = vp.setCurrentIdx;

  const current = videos[currentIdx] || videos[0];
  const next = videos[(currentIdx + 1) % (videos.length || 1)] || videos[0];
  const prevVideo = videos[(currentIdx - 1 + videos.length) % (videos.length || 1)] || videos[0];

  // Si el flotante global está activo, ocultamos el iframe local
  const floatingActive = vp.mini || mini;

  // auto-advance timer: se reinicia cada vez que cambia de vídeo (efecto de detección de fin)
  const [countdown, setCountdown] = useState(null);
  const cdRef = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); go(currentIdx + 1); }
      if (e.key === "ArrowUp") { e.preventDefault(); go(currentIdx - 1); }
      if (e.key === " ") { e.preventDefault(); toggleMini(); }
      if (e.key === "Escape") { if (vp.mini) vp.close(); setMini(false); }
      if (e.key === "a" || e.key === "A") { e.preventDefault(); setAutoAdvance((a) => !a); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const go = useCallback((idx) => {
    const wrapped = (idx + videos.length) % videos.length;
    setCurrentIdx(wrapped);
    setCountdown(null);
    clearTimeout(cdRef.current);
    itemRefs.current[wrapped]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    if (floatingActive) vpSetIdx.current(wrapped);
  }, [videos.length, floatingActive]);

  // Auto-advance: after ~3 min, show 15s countdown then next
  useEffect(() => {
    if (!autoAdvance || floatingActive) return;
    cdRef.current = setTimeout(() => {
      if (autoAdvance) {
        setCountdown(15);
      }
    }, 120000); // 2 min
    return () => clearTimeout(cdRef.current);
  }, [currentIdx, autoAdvance, floatingActive]);

  // Countdown tick
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      go(currentIdx + 1);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, go, currentIdx]);

  // extract dominant color from thumb for ambient glow
  const currentVideoId = current?.videoId;
  const [ambient, setAmbient] = useState("rgba(212,168,71,0.15)");
  const ambientTimeout = useRef(null);
  const updateAmbient = useCallback((imgSrc) => {
    clearTimeout(ambientTimeout.current);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      setAmbient(`rgba(${r},${g},${b},0.18)`);
    };
    img.onerror = () => setAmbient("rgba(212,168,71,0.15)");
  }, []);
  useEffect(() => { if (currentVideoId) updateAmbient(THUMB(currentVideoId)); }, [currentVideoId, updateAmbient]);

  // Mini player toggle → delega al reproductor flotante global
  const toggleMini = () => {
    if (!mini && videos.length > 0) {
      vp.play(videos, currentIdx);
      setMini(true);
    } else {
      setMini(false);
      vp.close();
    }
  };
  // floatingActive declarado arriba (antes del useEffect de teclado)

  const thumb = (id) => THUMB(id);

  if (loading) return (
    <div className="page">
      <header className="page__head page__head--center">
        <Skeleton width={200} height={12} />
        <div style={{ height: 8 }} />
        <Skeleton width={140} height={40} />
        <div style={{ height: 8 }} />
        <Skeleton width={360} height={16} radius={50} />
      </header>
      <div className="videoflow__layout" style={{ gridTemplateColumns: "1fr" }}>
        <Skeleton width="100%" height={360} />
      </div>
    </div>
  );

  return (
    <div className="videoflow">
      <header className="page__head">
        <p className="page__kicker">VIDEO FLOW · MTV ESTILO</p>
        <h1 className="page__title">Top 15 en Vídeo</h1>
        <p className="page__sub">
          Navega con ↑↓, pulsa <kbd>Space</kbd> para miniplayer, <kbd>A</kbd> activa/desactiva auto-advance.
        </p>
      </header>

      <div
        className={"videoflow__layout" + (floatingActive ? " videoflow__layout--mini" : "")}
        style={{ "--ambient": ambient }}
      >
        {/* === LADO IZQUIERDO: Player grande === */}
        <div className={"videoflow__player" + (floatingActive ? " videoflow__player--mini" : "")}>
          {/* El iframe principal solo en modo normal. En modo flotante, el App-level player toma el control */}
          {!floatingActive && (
          <>
          <div className="videoflow__frame">
            {darkBg && <div className="videoflow__ambient" />}
            <iframe
              key={current.videoId}
              src={EMBED(current.videoId)}
              title={current.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="videoflow__overlay">
              <span className="videoflow__rank-badge">#{current.rank}</span>
              <h2 className="videoflow__title">{current.title}</h2>
              <p className="videoflow__artist">{current.artist}</p>
            </div>
          </div>

          <div className="videoflow__controls">
            <div className="videoflow__nav">
              <button onClick={() => go(currentIdx - 1)} className="videoflow__ctrl" title="Anterior (↑)" aria-label="Anterior">⏮</button>
              <button onClick={toggleMini} className="videoflow__ctrl videoflow__ctrl--mini" title="Activar reproductor flotante (Space)" aria-label="Mini player">⏺</button>
              <button onClick={() => go(currentIdx + 1)} className="videoflow__ctrl" title="Siguiente (↓)" aria-label="Siguiente">⏭</button>
            </div>

            <div className="videoflow__settings">
              <label className="videoflow__toggle" title="Auto-advance (A)">
                <input type="checkbox" checked={autoAdvance} onChange={() => setAutoAdvance((a) => !a)} />
                <span>Auto</span>
              </label>

              {countdown !== null && countdown > 0 && (
                <div className="videoflow__nextup">
                  <span className="videoflow__nextup-text">Siguiente:</span>
                  <img src={thumb(next.videoId)} alt="" onError={(e) => { e.target.src = youtubeThumb(next.videoId, "hqdefault"); }} />
                  <span className="videoflow__nextup-title">{next.title}</span>
                  <span className="videoflow__nextup-count">{countdown}s</span>
                </div>
              )}
            </div>

            <div className="videoflow__track">
              <span className="videoflow__track-label">{currentIdx + 1} / {videos.length}</span>
              <div className="videoflow__track-bar" ref={timelineRef}>
                {videos.map((v, i) => (
                  <span
                    key={v.id}
                    className={"videoflow__dot" + (i === currentIdx ? " videoflow__dot--active" : "") + (i < currentIdx ? " videoflow__dot--done" : "")}
                    onClick={() => go(i)}
                    title={`#${v.rank} ${v.title}`}
                  />
                ))}
              </div>
            </div>
          </div>
          </>
          )}

          {/* Modo flotante: indicador en la página */}
          {floatingActive && (
            <div className="videoflow__frame" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-card)", border: "1px solid var(--accent)", borderRadius: "var(--radius)", padding: "24px", textAlign: "center", flexDirection: "column", gap: 12, minHeight: 200 }}>
              <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>Reproductor flotante activo</p>
              <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "0.9rem" }}>El video se está reproduciendo en el reproductor flotante. Podés navegar por otras secciones sin interrumpir la música.</p>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="btn btn--ghost" onClick={() => { vp.close(); setMini(false); }}>Volver al reproductor</button>
              </div>
            </div>
          )}
        </div>

        {/* === LADO DERECHO: Playlist === */}
        <div className="videoflow__playlist">
          <div className="videoflow__playlist-head">
            <h3>Playlist</h3>
            <span className="videoflow__playlist-count">{videos.length} vídeos</span>
          </div>
          <div className="videoflow__playlist-scroll">
            {videos.map((v, i) => (
              <button
                key={v.id}
                ref={(el) => (itemRefs.current[i] = el)}
                className={
                  "vf-item" +
                  (i === currentIdx ? " vf-item--active" : "") +
                  (i === (currentIdx + 1) % videos.length && autoAdvance ? " vf-item--next" : "")
                }
                onClick={() => go(i)}
              >
                <div className="vf-item__rank">#{v.rank}</div>
                <div className="vf-item__thumb">
                  <img src={thumb(v.videoId)} alt={v.title} loading="lazy" onError={(e) => { e.target.src = youtubeThumb(v.videoId, "hqdefault"); }} />
                  <span className="vf-item__play" aria-hidden="true" />
                  {i === currentIdx && <span className="vf-item__eq" aria-hidden="true">
                    <span/><span/><span/>
                  </span>}
                </div>
                <div className="vf-item__info">
                  <div className="vf-item__title">{v.title}</div>
                  <div className="vf-item__artist">{v.artist}</div>
                </div>
                {i === (currentIdx + 1) % videos.length && autoAdvance && (
                  <div className="vf-item__upnext">Up next</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Atajo de teclado al inicio de la página siguiente */}
      <div className="videoflow__hotkeys">
        <span>↑↓ Navegar</span> · <span>Space Miniplayer</span> · <span>A Auto-advance</span> · <span>Esc Cerrar mini</span>
      </div>
    </div>
  );
}