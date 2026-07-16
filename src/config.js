export const STREAM_URL = "https://streaming12.elitecomunicacion.es:8208/stream?type=.mp3";

// Contraseña del panel de edición (/panel).
// DEBE coincidir con la del archivo api/ranking.php (const PANEL_PASSWORD).
export const PANEL_PASSWORD = "radio2026";

// URL de la API en el servidor (cPanel). En desarrollo (Vite) se mantiene
// la ruta relativa: el hook useRanking hace fallback al JSON empaquetado si
// la API no responde (p. ej. al abrir la web sin backend PHP).
export const RANKING_API_URL = "/api/ranking.php";

export const STATION = {
  name: "Radio Online",
  tagline: "Tu emisora, en directo 24 horas",
  description: "La mejor música, el ranking más actualizado y la programación que te acompaña toda la semana.",
  foundedYear: 2024
};