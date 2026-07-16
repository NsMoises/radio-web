// ranking-utils.js
// Cálculo de tendencias (sube/baja/igual/nueva) y pico histórico.
// Todo automático a partir de position, lastWeekPosition y enteredAt.

import { weeksOnList, daysOnList } from "./date-utils";

export const TREND = {
  UP: "up",
  DOWN: "down",
  STEADY: "steady",
  NEW: "new",
  RE_ENTRY: "re-entry"
};

export function computeTrend(song, now = new Date()) {
  if (song.isNew || daysOnList(song.enteredAt, now) < 7) {
    return TREND.NEW;
  }
  if (song.lastWeekPosition == null || song.lastWeekPosition === 0) {
    return daysOnList(song.enteredAt, now) >= 7
      ? TREND.RE_ENTRY
      : TREND.NEW;
  }
  if (song.position < song.lastWeekPosition) return TREND.UP;
  if (song.position > song.lastWeekPosition) return TREND.DOWN;
  return TREND.STEADY;
}

export function computePeak(song) {
  const candidates = [song.position, song.peakPosition].filter(
    (n) => typeof n === "number" && !isNaN(n) && n > 0
  );
  if (candidates.length === 0) return song.position || 0;
  return Math.min(...candidates);
}

export function trendDisplay(song, now = new Date()) {
  const t = computeTrend(song, now);
  switch (t) {
    case TREND.UP:        return { symbol: "▲", label: "Sube",      className: "trend-up" };
    case TREND.DOWN:      return { symbol: "▼", label: "Baja",      className: "trend-down" };
    case TREND.STEADY:    return { symbol: "●", label: "Igual",     className: "trend-steady" };
    case TREND.NEW:       return { symbol: "★", label: "Nueva",     className: "trend-new" };
    case TREND.RE_ENTRY:  return { symbol: "↻", label: "Reentrada", className: "trend-reen" };
    default:              return { symbol: "·", label: "-",         className: "" };
  }
}

// Decora una canción con datos derivados listos para la UI.
export function decorateSong(song, now = new Date()) {
  const trend = trendDisplay(song, now);
  const peak = computePeak(song);
  const weeks = weeksOnList(song.enteredAt, now);
  return {
    ...song,
    trend,
    peak,
    weeksOnList: weeks,
    weeksLabel: `${weeks} ${weeks === 1 ? "semana" : "semanas"}`
  };
}

// Decora un listado completo (Top20).
export function decorateSongs(songs, now = new Date()) {
  return songs.map((s) => decorateSong(s, now));
}