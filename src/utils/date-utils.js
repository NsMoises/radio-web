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

// Devuelve el rango de la semana Lunes→Domingo que contiene la fecha dada.
// Formato llamativo: "Semana 13 al 19 de Julio"
export function weekRangeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // El día de la semana: 0=Dom ... 6=Sáb. Convertimos a Lunes=0.
  const dow = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtDayMonth = (x) =>
    cap(x.toLocaleDateString("es-ES", { day: "numeric", month: "long" }));

  // Si caen en el mismo mes: "13 al 19 de Julio"
  if (monday.getMonth() === sunday.getMonth()) {
    const month = cap(monday.toLocaleDateString("es-ES", { month: "long" }));
    return `Semana ${monday.getDate()} al ${sunday.getDate()} de ${month}`;
  }
  // Si cruzan meses: "27 de Junio al 3 de Julio"
  return `Semana del ${fmtDayMonth(monday)} al ${fmtDayMonth(sunday)}`;
}