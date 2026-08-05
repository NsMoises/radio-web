import { useState } from "react";
import { useConfig } from "../hooks/useConfig.js";

export default function LiveCam() {
  const [loaded, setLoaded] = useState(false);
  const { data: cfg } = useConfig();
  const channelId = (cfg && cfg.ytChannelId) || import.meta.env.VITE_YT_CHANNEL_ID || "UCodNIEoHHM_H66nlQi2qHPw";

  const embedUrl = `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=1&rel=0&modestbranding=1`;

  return (
    <section className="livecam">
      <div className="block__head">
        <h2 className="block__title">📷 Cámara en vivo</h2>
        <span className="block__link block__link--muted">
          {loaded ? "Transmisión en directo" : "Cargando…"}
        </span>
      </div>
      <div className="livecam__container">
        <div className="livecam__wrapper">
          <iframe
            src={embedUrl}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title="Cámara en vivo"
            onLoad={() => setLoaded(true)}
          />
        </div>
        {!loaded && (
          <div className="livecam__overlay">
            <div className="livecam__overlay-body">
              <span className="livecam__spinner" />
              <p>Conectando con la transmisión…</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
