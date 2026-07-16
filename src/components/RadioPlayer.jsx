import { useEffect, useRef, useState } from "react";
import { STREAM_URL, STATION } from "../config";

const OFFLINE_MSG = "📡 No estamos al aire — vuelve más tarde";

export default function RadioPlayer() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [connectAttempts, setConnectAttempts] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlaying = () => { setPlaying(true); setLoading(false); setOffline(false); setConnectAttempts(0); };
    const onPause   = () => { setPlaying(false); setLoading(false); };
    const onWaiting = () => { setLoading(true); };
    const onError   = () => {
      setPlaying(false);
      setLoading(false);
      setOffline(true);
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause",   onPause);
    audio.addEventListener("waiting",  onWaiting);
    audio.addEventListener("error",   onError);
    audio.addEventListener("stalled", onWaiting);

    return () => {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause",   onPause);
      audio.removeEventListener("waiting",  onWaiting);
      audio.removeEventListener("error",   onError);
      audio.removeEventListener("stalled", onWaiting);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setOffline(false);
    if (playing) {
      audio.pause();
      audio.src = "";
      setPlaying(false);
    } else {
      setConnectAttempts((n) => n + 1);
      audio.src = STREAM_URL;
      audio.load();
      setLoading(true);
      audio.play().catch(() => {
        setOffline(true);
        setLoading(false);
      });
    }
  };

  const onVol = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (v > 0 && muted) setMuted(false);
  };

  return (
    <>
      <audio ref={audioRef} preload="none" />
      <div className={"player" + (offline ? " player--offline" : "")} role="region" aria-label="Reproductor en directo">
        <div className="player__left">
          <button
            className={"player__btn" + (playing ? " player__btn--playing" : "")}
            onClick={togglePlay}
            aria-label={playing ? "Pausar directo" : "Reproducir directo"}
            title={playing ? "Pausar directo" : "Reproducir directo"}
          >
            {loading ? (
              <span className="player__spinner" aria-hidden="true" />
            ) : playing ? (
              <span className="player__bars" aria-hidden="true">
                <span/><span/><span/><span/>
              </span>
            ) : offline ? (
              <span className="player__offline-icon" aria-hidden="true">⛔</span>
            ) : (
              <span className="player__play" aria-hidden="true">▶</span>
            )}
          </button>
          <div className="player__meta">
            <span className={"player__live" + (offline ? " player__live--offline" : "")}>
              {offline ? (
                <><span className="player__dot player__dot--off" /> FUERA DEL AIRE</>
              ) : (
                <><span className="player__dot" /> EN DIRECTO</>
              )}
            </span>
            <div className="player__station">{STATION.name}</div>
            <div className="player__tagline">
              {loading ? "Conectando…" :
               playing ? "Reproduciendo en directo" :
               offline ? OFFLINE_MSG :
               "Pulsa play para escuchar"}
            </div>
            {offline && (
              <div className="player__retry">
                <button className="player__retry-btn" onClick={togglePlay}>
                  Reintentar ({connectAttempts})
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="player__right">
          <button
            className="player__mute"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Activar sonido" : "Silenciar"}
            title={muted ? "Activar sonido" : "Silenciar"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <input
            type="range"
            min="0" max="1" step="0.01"
            value={muted ? 0 : volume}
            onChange={onVol}
            aria-label="Volumen"
            className="player__volume"
          />
        </div>
      </div>
    </>
  );
}