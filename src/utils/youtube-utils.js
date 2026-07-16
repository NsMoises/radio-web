// youtube-utils.js
// Extrae el ID de un vídeo de YouTube desde cualquier formato de URL.
// Soporta: watch?v=, youtu.be/, /embed/, /shorts/, /v/ y ID suelto.

export function extractYouTubeId(input) {
  if (!input) return null;
  const s = String(input).trim();

  // ID puro (11-12 caracteres alfanuméricos)
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

  // Patrones de URL
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,       // watch?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,  // youtu.be/ID
    /\/embed\/([a-zA-Z0-9_-]{11})/,    // /embed/ID
    /\/shorts\/([a-zA-Z0-9_-]{11})/,   // /shorts/ID
    /\/v\/([a-zA-Z0-9_-]{11})/         // /v/ID
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
}

// Devuelve la URL de la miniatura de YouTube.
// maxresdefault es HD pero no todos los vídeos la tienen;
// el componente hace fallback a hqdefault vía onError.
export function youtubeThumb(videoId, quality = "maxresdefault") {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

// URL del reproductor embebido.
export function youtubeEmbed(videoId, autoplay = true) {
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?${autoplay ? "autoplay=1&" : ""}rel=0`;
}

// Obtiene título y artista automáticamente desde oEmbed (sin API key).
// Retorna { title, artist } o null si falla.
export async function fetchYoutubeInfo(videoId) {
  if (!videoId) return null;

  // Primero intenta YouTube oEmbed, luego noembed (CORS-friendly fallback)
  const sources = [
    `https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}&format=json`,
    `https://noembed.com/embed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      const raw = json.title || "";
      if (!raw) continue;
      return parseYoutubeTitle(raw);
    } catch {
      continue;
    }
  }
  return null;
}

// Parsea "Artista - Canción (Official Video)" → { artist, title }
function parseYoutubeTitle(raw) {
  const clean = raw.trim();
  // Buscar separador: " - " o " — " (em dash)
  const sepIndex = clean.search(/\s[-—]\s/);
  if (sepIndex > 0) {
    let artist = clean.slice(0, sepIndex).trim();
    let title = clean.slice(sepIndex).replace(/^.\s*/, "").trim();
    title = cleanTitle(title);
    artist = artist.replace(/\s*-\s*Topic\s*$/i, "").trim();
    return { title, artist };
  }
  return { title: cleanTitle(clean), artist: "" };
}

// Quita sufijos comunes de YouTube del título (4K Remaster, Official Video, etc.)
function cleanTitle(t) {
  const remove = [
    /\(Official\s*(Music\s*)?Video\)/gi,
    /\[Official\s*(Music\s*)?Video\]/gi,
    /\(Official\s*(Lyric|Audio)\s*(Video)?\)/gi,
    /\(Lyric\s*Video\)/gi,
    /\(Video\s*Oficial\)/gi,
    /\(Audio\)/gi,
    /\(En\s*Vivo\)/gi,
    /\(Live\)/gi,
    /\(.*?\bRemaster\b.*?\)/gi,
    /\(4K\)/gi,
    /\(HD\)/gi,
    /\(Visualizer\)/gi,
    /\(Performance\s*Video\)/gi,
    /\(Radio\s*Edit\)/gi,
    /\[.*?\bRemaster\b.*?\]/gi,
  ];
  let cleaned = t;
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of remove) {
      const prev = cleaned;
      cleaned = cleaned.replace(re, "").trim();
      if (cleaned !== prev) { changed = true; break; }
    }
  }
  // Limpiar espacios dobles
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return cleaned;
}