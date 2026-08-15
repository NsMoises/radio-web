import { Link } from "react-router-dom";
import { useState, useMemo, useRef, useCallback } from "react";
import { useNews } from "../hooks/useNews.js";
import { usePremieres } from "../hooks/usePremieres.js";
import { useSpecials } from "../hooks/useSpecials.js";
import { useBanner } from "../hooks/useBanner.js";
import { useDjs } from "../hooks/useDjs.js";
import { useRanking } from "../hooks/useRanking.js";
import { useCandidatos } from "../hooks/useCandidatos.js";
import { useVideos } from "../hooks/useVideos.js";
import { useVotoCandidato } from "../hooks/useVotoCandidato.js";
import { useVotoVideo } from "../hooks/useVotoVideo.js";
import { extractYouTubeId, youtubeEmbed } from "../utils/youtube-utils.js";
import Banner from "../components/Banner.jsx";
import LiveCam from "../components/LiveCam.jsx";
import MovieCard from "../components/MovieCard.jsx";
import TopPreviewCard from "../components/TopPreviewCard.jsx";
import SongCard from "../components/SongCard.jsx";
import CandidateCard from "../components/CandidateCard.jsx";
import Reveal from "../components/Reveal.jsx";
import PedidoMusical from "../components/PedidoMusical.jsx";
import { decorateSongs } from "../utils/ranking-utils.js";

export default function Home() {
  const { data: bannerData } = useBanner();
  const { data: newsData } = useNews();
  const { data: premieresData } = usePremieres();
  const { data: specialsData } = useSpecials();
  const { data: djsData } = useDjs();
  const { data } = useRanking();
  const { data: candidatosData } = useCandidatos();
  const { data: videosData } = useVideos();
  const cv = useVotoCandidato();
  const vv = useVotoVideo();

  const latestNews = newsData?.articles?.slice(0, 3) || [];
  const premieres = premieresData?.premieres || [];
  const specials = specialsData?.specials || [];
  const monthLabel = specialsData?.monthLabel || "Especiales de este mes";
  const slides = bannerData?.slides || [];
  const seasonLabel = bannerData?.seasonLabel || "";
  const djs = djsData?.djs || [];

  const top20 = useMemo(() => decorateSongs(data?.songs || []), [data]);
  const top4 = top20.slice(0, 4);
  const videos = videosData?.videos || [];
  const top15Preview = useMemo(() => {
    const fallbackDate = videosData?.lastUpdatedAt || new Date().toISOString().slice(0, 10);
    return decorateSongs(videos.map((v) => videoToSong(v, fallbackDate))).slice(0, 3);
  }, [videos, videosData]);
  const [showPedido, setShowPedido] = useState(false);
  const [playCandidate, setPlayCandidate] = useState(null);
  const [playVideo, setPlayVideo] = useState(null);

  return (
    <div className="home">
      <Banner slides={slides} seasonLabel={seasonLabel} />

      {/* LOS 20 TEMAZOS — solo 4 tarjetas */}
      <Reveal>
      <section className="block">
        <div className="block__head">
          <h2 className="block__title"><span className="block__icon">🔥</span> La Lista de las 20</h2>
          <Link to="/top-20" className="block__link">Ver ranking completo →</Link>
        </div>
        <div className="topp20-mini-grid">
          {top4.map((s) => (
            <Link to="/top-20" key={s.id} className="topp20-mini-link">
              <TopPreviewCard song={s} />
            </Link>
          ))}
        </div>
      </section>
      </Reveal>

      {/* CANDIDATOS PROXIMA SEMANA */}
      <Reveal>
      <section className="block">
        <div className="block__head">
          <h2 className="block__title"><span className="block__icon">⭐</span> Candidatos para la próxima semana</h2>
          <Link to="/candidatos" className="block__link">Ver todos →</Link>
        </div>
        {cv.voteMsg && <div className="vote-toast">{cv.voteMsg}</div>}
        <div className="candidatos-grid">
          {(candidatosData?.candidatos || []).map((c) => (
            <CandidateCard key={c.id} c={c} cv={cv} onPlay={() => setPlayCandidate(c)} />
          ))}
        </div>
      </section>
      </Reveal>

      {/* LOS 15 VIDEOS — vista previa */}
      <Reveal>
      <section className="block">
        <div className="block__head">
          <h2 className="block__title"><span className="block__icon">🎬</span> Los 15 temazos en español</h2>
          <Link to="/top-15" className="block__link">Ver ranking completo →</Link>
        </div>
        {vv.voteMsg && <div className="vote-toast">{vv.voteMsg}</div>}
        <div className="songgrid" style={{ "--grid-cols": 3 }}>
          {top15Preview.map((s) => (
            <SongCard
              key={s.id}
              song={s}
              onPick={() => setPlayVideo(s)}
              votes={vv.votes}
              myVote={vv.myVote}
              onVote={vv.vote}
            />
          ))}
        </div>
      </section>
      </Reveal>

      {/* ESTRENOS DE CINE */}
      <Reveal>
      <section className="block">
        <div className="block__head">
          <h2 className="block__title"><span className="block__icon">🍿</span> Estrenos de cine</h2>
          <Link to="/cine" className="block__link">Ver todos →</Link>
        </div>
        <div className="movies-grid movies-grid--home">
          {premieres.slice(0, 4).map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      </section>
      </Reveal>

      {/* NOTICIAS */}
      <Reveal>
      <section className="block">
        <div className="block__head">
          <h2 className="block__title"><span className="block__icon">📰</span> Noticias del momento</h2>
          <Link to="/noticias" className="block__link">Ver todas →</Link>
        </div>
        <div className="news-grid">
          {latestNews.map((n) => (
            <article className="news-card" key={n.id}>
              <img src={n.cover} alt={n.title} loading="lazy" />
              <div className="news-card__body">
                <div className="news-card__tags">
                  <time className="news-card__date">
                    {new Date(n.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </time>
                  {n.category && (
                    <span className={"news-badge news-badge--" + n.category.toLowerCase()}>{n.category}</span>
                  )}
                </div>
                <h3 className="news-card__title"><Link to="/noticias">{n.title}</Link></h3>
                <p className="news-card__excerpt">{n.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      </Reveal>

      {/* ESPECIALES DEL MES */}
      <Reveal>
      <section className="block">
        <div className="block__head">
          <h2 className="block__title"><span className="block__icon">🌟</span> {monthLabel}</h2>
          <span className="block__link block__link--muted">Cada semana un invitado</span>
        </div>
        <div className="specials-grid">
          {specials.map((s) => (
            <div className="special-card" key={s.id}>
              <div className="special-card__day">{s.day}</div>
              <img src={s.image} alt={s.artist} loading="lazy" />
              <div className="special-card__body">
                <h3 className="special-card__name">{s.artist}</h3>
                <p className="special-card__bio">{s.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      {/* CÁMARA EN VIVO */}
      <LiveCam />

      {/* DJS / LOCUTORES */}
      <Reveal>
      <section className="block">
        <div className="block__head">
          <h2 className="block__title"><span className="block__icon">🎙️</span> Nuestros locutores</h2>
          <span className="block__link block__link--muted">El equipo que suena</span>
        </div>
        <div className="dj-3d-wrap">
          {djs.length > 0 && <DjCard3D dj={djs[0]} />}
        </div>
      </section>
      </Reveal>

      {/* PEDIDO MUSICAL — CTA grande */}
      <Reveal>
      <section className="pedido-cta" onClick={() => setShowPedido(true)}>
        <div className="pedido-cta__icon">🎵</div>
        <div className="pedido-cta__text">
          <h2>Realiza tu pedido musical</h2>
          <p>¿Quieres pedirnos una canción, mandar un saludo o felicitación?</p>
        </div>
        <div className="pedido-cta__btn">📞 Contáctanos 🎙️</div>
      </section>
      </Reveal>

      {/* CTA TOP 20 destacado */}
      <Reveal>
      <section className="cta-top20">
        <h2>¿Quieres saber cuáles son las mejores 20 canciones de la semana?</h2>
        <Link to="/top-20" className="btn btn--primary btn--big">IR AL TOP 20 DE BILLBOARD →</Link>
      </section>
      </Reveal>

      {/* Modal de video de candidato */}
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

      {/* Modal de video del Top 15 */}
      {playVideo && (
        <div className="video-modal" onClick={() => setPlayVideo(null)} role="dialog" aria-modal="true">
          <div className="video-modal__inner" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal__close" onClick={() => setPlayVideo(null)} aria-label="Cerrar">✕</button>
            <div className="video-modal__frame">
              <iframe key={playVideo.id} src={youtubeEmbed(extractYouTubeId(playVideo.url))} title={playVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
            <div className="video-modal__meta">
              <span className="video-modal__rank">#{playVideo.position}</span>
              <div>
                <div className="video-modal__title">{playVideo.title}</div>
                <div className="video-modal__artist">{playVideo.artist}</div>
                <div className="video-modal__extra">
                  <span className={"trend " + playVideo.trend.className}>
                    {playVideo.trend.symbol} {playVideo.trend.label}
                  </span>
                  <span> · Pico #{playVideo.peak}</span>
                  <span className="modal-weeks"> · {playVideo.weeksLabel} en lista</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pedido musical */}
      <PedidoMusical open={showPedido} onClose={() => setShowPedido(false)} />
    </div>
  );
}

const THUMB_QUALITIES = ["maxresdefault", "hqdefault", "mqdefault", "default"];

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
    isNew: !!v.isNew
  };
}

function DjCard3D({ dj }) {
  const ref = useRef(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const move = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / r.width, dy = (e.clientY - cy) / r.height;
    setRot({ x: -dy * 18, y: dx * 18 });
    setGlow({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }, []);

  const leave = useCallback(() => {
    setRot({ x: 0, y: 0 });
    setGlow({ x: 50, y: 50 });
  }, []);

  return (
    <div className="dj-card-3d" ref={ref} onMouseMove={move} onMouseLeave={leave}>
      <div className="dj-card-3d__inner" style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}>
        <div className="dj-card-3d__glow" style={{ background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(91,141,239,0.2) 0%, transparent 70%)` }} />
        <img src={dj.image} alt={dj.name} loading="lazy" />
        <div className="dj-card-3d__body">
          <h3 className="dj-card-3d__name">{dj.name}</h3>
          <div className="dj-card-3d__role">{dj.role}</div>
          <div className="dj-card-3d__program">{dj.program}</div>
          <p className="dj-card-3d__bio">{dj.bio}</p>
        </div>
      </div>
    </div>
  );
}