import { createContext, useContext, useState, useCallback, useRef, useMemo } from "react";

const VideoPlayerContext = createContext(null);

export function VideoPlayerProvider({ children }) {
  const [videos, setVideos] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [mini, setMini] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const iframeRef = useRef(null);

  const current = videos[currentIdx] || videos[0];

  const next = useCallback(() => {
    setCurrentIdx((i) => (i + 1) % (videos.length || 1));
  }, [videos.length]);

  const prev = useCallback(() => {
    setCurrentIdx((i) => (i - 1 + videos.length) % (videos.length || 1));
  }, [videos.length]);

  // Activa el reproductor flotante con una playlist
  const play = useCallback((list, startIdx = 0) => {
    setVideos(list.map((v, i) => ({ ...v, id: v.id || i + 1 })));
    setCurrentIdx(startIdx);
    setMini(true);
  }, []);

  const close = useCallback(() => {
    setMini(false);
  }, []);

  const toggleMini = useCallback(() => {
    setMini((m) => !m);
  }, []);

  // URL del iframe para el vídeo actual
  const embedUrl = current?.videoId
    ? `https://www.youtube.com/embed/${current.videoId}?autoplay=1&rel=0&enablejsapi=1&modestbranding=1`
    : null;

  const value = useMemo(() => ({
    videos,
    currentIdx,
    current,
    mini,
    autoAdvance,
    embedUrl,
    iframeRef,
    play,
    next,
    prev,
    close,
    toggleMini,
    setAutoAdvance,
    setCurrentIdx,
  }), [videos, currentIdx, current, mini, autoAdvance, embedUrl, play, next, prev, close, toggleMini, setAutoAdvance, setCurrentIdx]);

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) throw new Error("useVideoPlayer debe usarse dentro de VideoPlayerProvider");
  return ctx;
}
