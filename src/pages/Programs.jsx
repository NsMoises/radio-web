import { useState } from "react";
import programs from "../data/programs.json";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function Programs() {
  const [day, setDay] = useState("Lunes");
  const shows = programs.programs
    .filter((p) => p.day === day)
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="page">
      <header className="page__head">
        <h1 className="page__title">Programación</h1>
        <p className="page__sub">Selecciona un día para ver los programas y horarios.</p>
      </header>

      <div className="schedule-tabs" role="tablist">
        {DAYS.map((d) => (
          <button
            key={d}
            role="tab"
            aria-selected={day === d}
            className={"schedule-tab" + (day === d ? " schedule-tab--active" : "")}
            onClick={() => setDay(d)}
          >
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="schedule__day">
        <h2 className="schedule__day-title">{day}</h2>
        {shows.length === 0 ? (
          <p className="schedule__empty">Sin programación este día.</p>
        ) : shows.length === 1 && !shows[0].start ? (
          <p className="schedule__empty">DESCANSO</p>
        ) : (
          <ul className="schedule__list">
            {shows.map((p) => (
              <li key={p.id} className="schedule__item">
                <div className="schedule__time">{p.start} – {p.end}</div>
                <div className="schedule__info">
                  <div className="schedule__title">{p.title}</div>
                  <div className="schedule__host">Con {p.host}</div>
                  <div className="schedule__desc">{p.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}