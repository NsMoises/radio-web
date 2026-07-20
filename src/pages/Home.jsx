import { Link } from "react-router-dom";
import { useState, useMemo, useRef, useCallback } from "react";
import { useNews } from "../hooks/useNews.js";
import { usePremieres } from "../hooks/usePremieres.js";
import { useSpecials } from "../hooks/useSpecials.js";
import { useBanner } from "../hooks/useBanner.js";
import { useDjs } from "../hooks/useDjs.js";
import { useRanking } from "../hooks/useRanking.js";
import { useCandidatos } from "../hooks/useCandidatos.js";
import { useVotoCandidato } from "../hooks/useVotoCandidato.js";
import { youtubeThumb, extractYouTubeId } from "../utils/youtube-utils.js";
import Banner from "../components/Banner.jsx";
import MovieCard from "../components/MovieCard.jsx";
import TopPreviewCard from "../components/TopPreviewCard.jsx";
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
  const cv = useVotoCandidato();

  const latestNews = newsData?.articles?.slice(0, 3) || [];
  const premieres = premieresData?.premieres || [];
  const specials = specialsData?.specials || [];
  const monthLabel = specialsData?.monthLabel || "Especiales de este mes";
  const slides = bannerData?.slides || [];
  const seasonLabel = bannerData?.seasonLabel || "";
  const djs = djsData?.djs || [];

  const top20 = useMemo(() => decorateSongs(data?.songs || []), [data]);
  const top4 = top20.slice(0, 4);
  const [showPedido, setShowPedido] = useState(false);

  return (
    <div className="home">
      <Banner slides={slides} seasonLabel={seasonLabel} />

      {/* NOTICIAS */}
      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Noticias del momento</h2>
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

      {/* ESTRENOS DE CINE */}
      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Estrenos de cine</h2>
          <span className="block__link block__link--muted">{premieres.length} títulos · {seasonLabel}</span>
        </div>
        <div className="movies-grid">
          {premieres.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      </section>

      {/* RESUMEN TOP 20 — solo 4 tarjetas */}
      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Los 20 temazos</h2>
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

      {/* CANDIDATOS PROXIMA SEMANA */}
      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Candidatos para la próxima semana</h2>
          <span className="block__link block__link--muted">{candidatosData?.candidatos?.length || 0} candidatos</span>
        </div>
        {cv.voteMsg && <div className="vote-toast">{cv.voteMsg}</div>}
        <div className="candidatos-grid">
          {(candidatosData?.candidatos || []).map((c) => (
            <CandidateCard key={c.id} c={c} cv={cv} />
          ))}
        </div>
      </section>

      {/* ESPECIALES DEL MES */}
      <section className="block">
        <div className="block__head">
          <h2 className="block__title">{monthLabel}</h2>
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

      {/* DJS / LOCUTORES */}
      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Nuestros locutores</h2>
          <span className="block__link block__link--muted">El equipo que suena</span>
        </div>
        <div className="dj-3d-wrap">
          {djs.length > 0 && <DjCard3D dj={djs[0]} />}
        </div>
      </section>

      {/* PEDIDO MUSICAL — CTA grande */}
      <section className="pedido-cta" onClick={() => setShowPedido(true)}>
        <div className="pedido-cta__icon">🎵</div>
        <div className="pedido-cta__text">
          <h2>Realiza tu pedido musical</h2>
          <p>¿Quieres pedirnos una canción, mandar un saludo o felicitación?</p>
        </div>
        <div className="pedido-cta__btn">📞 Contáctanos 🎙️</div>
      </section>

      {/* CTA TOP 20 destacado */}
      <section className="cta-top20">
        <h2>¿Quieres saber cuáles son las mejores 20 canciones de la semana?</h2>
        <Link to="/top-20" className="btn btn--primary btn--big">IR AL TOP 20 DE BILLBOARD →</Link>
      </section>

      {/* Modal de pedido musical */}
      <PedidoMusical open={showPedido} onClose={() => setShowPedido(false)} />
    </div>
  );
}

const THUMB_QUALITIES = ["maxresdefault", "hqdefault", "mqdefault", "default"];

function CandidateCard({ c, cv }) {
  const [qi, setQi] = useState(0);
  const count = cv.votes?.[c.id] ?? 0;
  const isMy = cv.myVote === c.id;
  const thumbSrc = c.cover || youtubeThumb(c.videoId, THUMB_QUALITIES[qi]);
  return (
    <div className="candidato-card">
      <div className="candidato-card__thumb">
        <img src={thumbSrc} alt={c.title} loading="lazy" onError={() => setQi((i) => Math.min(i + 1, THUMB_QUALITIES.length - 1))} />
        <span className="candidato-card__pos">#{c.position}</span>
        <button
          className={"candidato-card__vote" + (isMy ? " candidato-card__vote--done" : "")}
          onClick={() => cv.vote(c.id)}
          title={isMy ? "Retirar voto" : "Votar"}
          aria-label="Votar"
        >
          {isMy ? "❤" : "♡"}
          {count > 0 && <span className="candidato-card__vote-count">{count}</span>}
        </button>
      </div>
      <div className="candidato-card__body">
        <div className="candidato-card__title">{c.title}</div>
        <div className="candidato-card__artist">{c.artist}</div>
      </div>
    </div>
  );
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