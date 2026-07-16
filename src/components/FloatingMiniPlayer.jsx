import { useEffect, useRef, useState, useCallback } from "react";
import { useVideoPlayer } from "../context/VideoPlayerContext.jsx";
import { youtubeThumb } from "../utils/youtube-utils.js";
import { Link } from "react-router-dom";

export default function FloatingMiniPlayer() {
  const { mini, current, embedUrl, next, prev, close, videos, currentIdx, iframeRef } = useVideoPlayer();
  const lastCurrentRef = useRef(null);
  const [paused, setPaused] = useState(false);

  const togglePause = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    if (paused) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
    } else {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', "*");
    }
    setPaused((p) => !p);
  }, [paused, iframeRef]);

  // Reset paused state when video changes
  useEffect(() => {
    if (!current?.videoId) return;
    if (lastCurrentRef.current === current.videoId) return;
    lastCurrentRef.current = current.videoId;
    iframeRef.current.src = embedUrl;
    setPaused(false);
  }, [current?.videoId, embedUrl, iframeRef]);

  if (!mini || !current) return null;

  const thumb = youtubeThumb(current.videoId, "hqdefault");

  return (
    <div className="floating-player">
      <iframe
        ref={iframeRef}
        className="floating-player__iframe"
        title={current.title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      <div className="floating-player__bar">
        <Link to="/top-15" className="floating-player__thumb">
          {thumb && <img src={thumb} alt={current.title} onError={(e) => { e.target.src = youtubeThumb(current.videoId, "hqdefault"); }} />}
        </Link>

        <div className="floating-player__info">
          <div className="floating-player__title">{current.title}</div>
          <div className="floating-player__artist">{current.artist}</div>
        </div>

        <div className="floating-player__controls">
          <button onClick={prev} title="Anterior" aria-label="Anterior">⏮</button>
          <button onClick={togglePause} title={paused ? "Reanudar" : "Pausar"} aria-label={paused ? "Reanudar" : "Pausar"}>{paused ? "▶" : "⏸"}</button>
          <button onClick={next} title="Siguiente" aria-label="Siguiente">⏭</button>
          <button onClick={close} title="Cerrar" aria-label="Cerrar" className="floating-player__close">✕</button>
        </div>

        <span className="floating-player__badge">{currentIdx + 1}/{videos.length}</span>

        <span className="floating-player__eq" aria-hidden="true">
          <span/><span/><span/><span/>
        </span>
      </div>
    </div>
  );
}
