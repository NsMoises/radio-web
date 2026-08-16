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

// Devuelve el rango de la semana Viernes→Jueves que contiene la fecha dada.
// Formato llamativo: "Semana 14 al 20 de Agosto"
export function weekRangeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // El día de la semana: 0=Dom ... 6=Sáb. Viernes=5. Retrocedemos hasta el viernes de la semana.
  const daysSinceFriday = (d.getDay() - 5 + 7) % 7;
  const friday = new Date(d);
  friday.setDate(d.getDate() - daysSinceFriday);
  const thursday = new Date(friday);
  thursday.setDate(friday.getDate() + 6);

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtDayMonth = (x) =>
    cap(x.toLocaleDateString("es-ES", { day: "numeric", month: "long" }));

  // Si caen en el mismo mes: "14 al 20 de Agosto"
  if (friday.getMonth() === thursday.getMonth()) {
    const month = cap(friday.toLocaleDateString("es-ES", { month: "long" }));
    return `Semana ${friday.getDate()} al ${thursday.getDate()} de ${month}`;
  }
  // Si cruzan meses: "31 de Julio al 6 de Agosto"
  return `Semana del ${fmtDayMonth(friday)} al ${fmtDayMonth(thursday)}`;
}