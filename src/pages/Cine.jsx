import { usePremieres } from "../hooks/usePremieres.js";
import MovieCard from "../components/MovieCard.jsx";
import { fridayToFridayLabel } from "../utils/date-utils.js";

export default function Cine() {
  const { data, loading } = usePremieres();

  const premieres = data?.premieres || [];
  const weekPeriod = fridayToFridayLabel();
  const seasonLabel = data?.seasonLabel || "";
  const updated = data?.lastUpdatedAt
    ? new Date(data.lastUpdatedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  return (
    <div className="page">
      <header className="page__head page__head--center">
        <p className="page__kicker">CINE</p>
        <h1 className="page__title page__title--xl">Estrenos de cine</h1>
        <div className="page__weeklabel">{weekPeriod}{seasonLabel && <> · {seasonLabel}</>}</div>
        <p className="page__sub">
          Pulsa una tarjeta para ver el tráiler.
          {updated && <> · Actualizado {updated}</>}
        </p>
      </header>

      {loading && <p className="page__sub" style={{ color: "var(--text-dim)" }}>Cargando estrenos…</p>}

      {premieres.length > 0 ? (
        <div className="movies-grid">
          {premieres.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      ) : (
        !loading && <p className="page__sub" style={{ color: "var(--text-dim)" }}>No hay estrenos publicados todavía.</p>
      )}
    </div>
  );
}
