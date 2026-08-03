import { Link } from "react-router-dom";
import { useRef, useState, useCallback, useEffect } from "react";
import { STATION } from "../config";
import { useStream } from "../context/StreamContext.jsx";

const SOCIALS = [
  { label: "Instagram", href: "#", icon: "IG" },
  { label: "Facebook",  href: "#", icon: "FB" },
  { label: "X",          href: "#", icon: "X"  },
  { label: "YouTube",    href: "#", icon: "YT" },
  { label: "Spotify",    href: "#", icon: "SP" }
];

const SECTIONS = [
  { to: "/top-20",       label: "Ranking Top 20" },
  { to: "/candidatos",   label: "Candidatos"      },
  { to: "/top-15",       label: "Top 15 Vídeos"   },
  { to: "/cine",         label: "Estrenos de cine"},
  { to: "/noticias",     label: "Noticias"        },
  { to: "/programacion", label: "Programación"    }
];

export default function Footer() {
  const year = new Date().getFullYear();
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const { playing, offline, loading } = useStream();

  const handleMouse = useCallback((e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("pointermove", handleMouse);
    return () => el.removeEventListener("pointermove", handleMouse);
  }, [handleMouse]);

  return (
    <footer className="footer" ref={ref}>
      <div
        className="footer__glow"
        style={{ background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, rgba(0,229,255,0.20), transparent 60%)` }}
      />

      <div className="footer__wave" aria-hidden="true">
        <span/><span/><span/><span/><span/>
      </div>

      <div className="footer__inner">
        <div className="footer__col footer__col--brand">
          <div className="footer__logo">
            <svg width="28" height="28" viewBox="0 0 64 64">
              <circle cx="32" cy="34" r="14" fill="none" stroke="currentColor" strokeWidth="3"/>
              <circle cx="32" cy="34" r="5" fill="currentColor"/>
              <path d="M14 22 L50 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="14" cy="22" r="3" fill="currentColor"/>
            </svg>
            <span>{STATION.name}</span>
          </div>
          <p className="footer__tagline">{STATION.tagline}</p>

          <form className="footer__news" onSubmit={(e) => e.preventDefault()}>
            <label className="footer__news-label" htmlFor="fc-email">
              Recibe el Top 20 cada semana en tu correo
            </label>
            <div className="footer__news-row">
              <input id="fc-email" type="email" placeholder="tu@correo.com" required />
              <button type="submit" className="footer__news-btn">Suscribirme</button>
            </div>
          </form>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Secciones</h4>
          <ul className="footer__links">
            {SECTIONS.map((s) => (
              <li key={s.to}><Link to={s.to}>{s.label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="footer__col">
          <h4 className="footer__heading">Contacto</h4>
          <ul className="footer__links">
            <li><a href="mailto:radperusol@solperuradio.es">radperusol@solperuradio.es</a></li>
            <li><span>Calle del Aire, 12 · Madrid</span></li>
            <li><span>Lun – Dom · 24 h en directo</span></li>
          </ul>
        </div>

        <div className="footer__col footer__col--social">
          <h4 className="footer__heading">Síguenos</h4>
          <div className="footer__socials">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} className="footer__social"
                 aria-label={s.label} title={s.label}>
                {s.icon}
              </a>
            ))}
          </div>
          <p className={"footer__onair" + (offline ? " footer__onair--off" : "")}>
            {loading ? (
              <span className="footer__onair-dot footer__onair-dot--loading" />
            ) : offline ? (
              <span className="footer__onair-dot footer__onair-dot--off" />
            ) : (
              <span className="footer__onair-dot" />
            )}
            {loading ? "CONECTANDO…" : offline ? "FUERA DEL AIRE" : "EN DIRECTO AHORA"}
          </p>
        </div>
      </div>

      <div className="footer__bottom">
        <span>© {year} {STATION.name}. Todos los derechos reservados.</span>
        <span className="footer__legal">
          <a href="#">Aviso legal</a> · <a href="#">Privacidad</a> · <a href="#">Cookies</a>
        </span>
      </div>
    </footer>
  );
}
