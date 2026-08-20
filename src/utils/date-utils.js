// date-utils.js
// Cálculo automático de tiempo en lista. No volver a escribir a mano.

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_WEEK = MS_PER_DAY * 7;

// Devuelve número de semanas completas entre enteredAt y hoy (mínimo 1).
export function weeksOnList(enteredAt, now = new Date()) {
  if (!enteredAt) return 1;
  const start = new Date(enteredAt);
  if (isNaN(start.getTime())) return 1;
  const diffMs = Math.max(0, now.getTime() - start.getTime());
  return Math.max(1, Math.floor(diffMs / MS_PER_WEEK) + 1);
}

// Texto humano: "2 semanas", "1 semana".
export function weeksLabel(enteredAt, now = new Date()) {
  const w = weeksOnList(enteredAt, now);
  return `${w} ${w === 1 ? "semana" : "semanas"}`;
}

// Días desde enteredAt (útil para "NUEVA" si < 7 días).
export function daysOnList(enteredAt, now = new Date()) {
  if (!enteredAt) return 0;
  const start = new Date(enteredAt);
  if (isNaN(start.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY));
}

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit", month: "long", year: "numeric"
  });
}

// Devuelve el rango de la semana (empezando en startDay) que contiene la fecha dada.
// startDay: 1 = Lunes, 5 = Viernes. Por defecto Lunes→Domingo.
// Formato llamativo: "Semana 14 al 20 de Agosto"
export function weekRangeLabel(iso, startDay = 1) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // El día de la semana: 0=Dom ... 6=Sáb. Retrocedemos hasta startDay.
  const daysSinceStart = (d.getDay() - startDay + 7) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - daysSinceStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtDayMonth = (x) =>
    cap(x.toLocaleDateString("es-ES", { day: "numeric", month: "long" }));

  // Si caen en el mismo mes: "14 al 20 de Agosto"
  if (start.getMonth() === end.getMonth()) {
    const month = cap(start.toLocaleDateString("es-ES", { month: "long" }));
    return `Semana ${start.getDate()} al ${end.getDate()} de ${month}`;
  }
  // Si cruzan meses: "31 de Julio al 6 de Agosto"
  return `Semana del ${fmtDayMonth(start)} al ${fmtDayMonth(end)}`;
}

// Rango de la semana de estrenos: de viernes a viernes (viernes actual → próximo viernes).
// Ejemplo: "Del viernes 15 al viernes 22 de Agosto".
export function fridayToFridayLabel(date = new Date()) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  // Ancla al viernes más reciente (incluye hoy si es viernes).
  const daysSinceFriday = (d.getDay() - 5 + 7) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - daysSinceFriday);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmt = (x) =>
    cap(x.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }));

  return `Del ${fmt(start)} al ${fmt(end)}`;
}