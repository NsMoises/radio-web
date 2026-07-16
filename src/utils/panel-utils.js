// panel-utils.js
// Genera el objeto ranking.json listo para descargar, renumerando posiciones
// automáticamente a partir del orden actual de las filas del editor.

export function buildRankingJson(rows, lastUpdatedAt, weekLabel) {
  const songs = rows.map((r, i) => {
    const position = i + 1;
    const last = parseInt(r.lastWeekPosition, 10);
    const peak = parseInt(r.peakPosition, 10) || position;
    return {
      id: r.id || position,
      position,
      lastWeekPosition: isNaN(last) ? 0 : last,
      peakPosition: isNaN(peak) ? position : Math.min(peak, position),
      title: (r.title || "").trim() || "(sin título)",
      artist: (r.artist || "").trim() || "(sin artista)",
      url: (r.url || "").trim(),
      enteredAt: (r.enteredAt || new Date().toISOString().slice(0, 10)).trim(),
      isNew: !!r.isNew
    };
  });
  return {
    lastUpdatedAt: lastUpdatedAt || new Date().toISOString().slice(0, 10),
    weekLabel: weekLabel || "",
    songs
  };
}

// Dispara la descarga de un archivo JSON en el navegador.
export function downloadJson(obj, filename = "ranking.json") {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copia al portapapeles (con fallback).
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Sube una imagen al servidor via api/upload.php
export async function uploadImage(file, password) {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("/api/upload.php", {
      method: "POST",
      headers: { "X-Panel-Password": password },
      body: formData
    });
    return await res.json();
  } catch {
    // Fallback dev: comprime y genera data URL para previsualización
    const dataUrl = await compressImage(file, 1200, 0.6);
    return { ok: true, url: dataUrl, dev: true };
  }
}

function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = h * maxWidth / w; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, "image/jpeg", quality);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}