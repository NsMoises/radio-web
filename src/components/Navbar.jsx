import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/",            label: "Inicio"       },
  { to: "/top-20",      label: "Top 20"       },
  { to: "/top-15",      label: "Top 15 Videos" },
  { to: "/noticias",    label: "Noticias"     },
  { to: "/programacion",label: "Programación" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <span className="navbar__logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 64 64">
              <circle cx="32" cy="34" r="14" fill="none" stroke="currentColor" strokeWidth="3"/>
              <circle cx="32" cy="34" r="5" fill="currentColor"/>
              <path d="M14 22 L50 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="14" cy="22" r="3" fill="currentColor"/>
            </svg>
          </span>
          <span className="navbar__title">Radio Online</span>
        </NavLink>

        <button
          className={"navbar__toggle" + (open ? " navbar__toggle--open" : "")}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>

        <nav className={"navbar__nav" + (open ? " navbar__nav--open" : "")}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                "navbar__link" + (isActive ? " navbar__link--active" : "")
              }
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
      {open && <div className="navbar__backdrop" onClick={() => setOpen(false)} />}
    </header>
  );
}