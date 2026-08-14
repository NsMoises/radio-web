import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { extractYouTubeId, youtubeThumb, fetchYoutubeInfo } from "../utils/youtube-utils.js";
import { useRanking } from "../hooks/useRanking.js";
import { useVideos } from "../hooks/useVideos.js";
import { useNews } from "../hooks/useNews.js";
import { usePremieres } from "../hooks/usePremieres.js";
import { useSpecials } from "../hooks/useSpecials.js";
import { useBanner } from "../hooks/useBanner.js";
import { useDjs } from "../hooks/useDjs.js";
import { useCandidatos } from "../hooks/useCandidatos.js";
import { useConfig } from "../hooks/useConfig.js";
import { downloadJson, uploadImage } from "../utils/panel-utils.js";
import ImgPreview from "../components/ImgPreview.jsx";

function UploadBtn({ onUpload, label = "Subir imagen" }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file);
      if (res.ok && res.url) {
        onUpload(res.url);
      } else {
        alert("Error al subir: " + (res.error || "desconocido"));
      }
    } catch (err) {
      alert("Error de conexión al subir la imagen");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <input type="file" accept="image/*" ref={inputRef} onChange={handleFile} style={{ display: "none" }} />
      <button type="button" className="btn btn--ghost btn--small" onClick={() => inputRef.current?.click()} disabled={uploading} style={{ fontSize: "0.72rem", padding: "3px 10px" }}>
        {uploading ? "Subiendo…" : label}
      </button>
    </span>
  );
}

const today = new Date().toISOString().slice(0, 10);

const currentWeekLabel = () =>
  "Semana del " + new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

function EditorTop20() {
  const { data, loading, error, save } = useRanking();
  const [rows, setRows] = useState([]);
  const [header, setHeader] = useState({ lastUpdatedAt: today, weekLabel: "" });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const fetchedRef = useRef(new Set());

  useEffect(() => {
    if (!data) return;
    setRows(data.songs.map((s, i) => ({ ...s, id: extractYouTubeId(s.url) || s.videoId || s.id || i + 1, videoId: extractYouTubeId(s.url) || s.videoId || "" })));
    setHeader({ lastUpdatedAt: data.lastUpdatedAt || today, weekLabel: data.weekLabel || "" });
  }, [data]);

  const defaultWeek = useMemo(() => {
    const d = new Date();
    return "Semana del " + d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  }, []);

  // Auto-fetch YouTube info for songs with videoId but empty title/artist
  useEffect(() => {
    const toFetch = [];
    for (const r of rows) {
      if (!r.videoId || r.videoId.length < 11) continue;
      if (fetchedRef.current.has(r.videoId)) continue;
      toFetch.push(r);
    }
    if (toFetch.length === 0) return;
    toFetch.forEach((r) => {
      fetchedRef.current.add(r.videoId);
      setFetchingIds((prev) => new Set([...prev, r.id]));
      fetchYoutubeInfo(r.videoId).then((info) => {
        setFetchingIds((prev) => { const next = new Set(prev); next.delete(r.id); return next; });
        if (!info) return;
        setRows((rs) => rs.map((row) => {
          if (row.id !== r.id) return row;
          return {
            ...row,
            title: info.title ? info.title.toUpperCase() : row.title || "",
            artist: info.artist ? info.artist.toUpperCase() : row.artist || ""
          };
        }));
      });
    });
  }, [rows]);

  const fetchNow = async (r) => {
    const vid = extractYouTubeId(r.url) || r.videoId;
    if (!vid || vid.length < 11) return;
    setFetchingIds((prev) => new Set([...prev, r.id]));
    const info = await fetchYoutubeInfo(vid);
    setFetchingIds((prev) => { const next = new Set(prev); next.delete(r.id); return next; });
    if (!info) { alert("No se pudo obtener info del video. Abrí F12 > Console para ver detalles."); return; }
    setRows((rs) => rs.map((row) => {
      if (row.id !== r.id) return row;
      return {
        ...row,
        title: info.title ? info.title.toUpperCase() : row.title,
        artist: info.artist ? info.artist.toUpperCase() : row.artist,
        videoId: vid
      };
    }));
  };

  const update = (id, field, value) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const move = (index, dir) => setRows((rs) => {
    const next = [...rs];
    const j = index + dir;
    if (j < 0 || j >= next.length) return rs;
    [next[index], next[j]] = [next[j], next[index]];
    next.forEach((r, i) => { r.position = i + 1; });
    return next;
  });

  const rotateWeek = () => {
    if (!confirm("¿Marcar nueva semana? Las posiciones actuales se guardarán como \"semana anterior\" y la fecha/etiqueta se actualizarán a la semana actual. Debes pulsar Guardar para que se publique.")) return;
    setRows((rs) => rs.map((r) => ({ ...r, lastWeekPosition: r.position, isNew: false })));
    setHeader({ lastUpdatedAt: new Date().toISOString().slice(0, 10), weekLabel: currentWeekLabel() });
    setStatus({ ok: false, msg: "Rotado. Recuerda pulsar Guardar cambios para publicar." });
  };

  const guardar = async () => {
    if (saving) return;
    setSaving(true);
    const payload = {
      lastUpdatedAt: header.lastUpdatedAt || today,
      weekLabel: header.weekLabel || defaultWeek,
      songs: rows.map((r, i) => ({ ...r, position: i + 1, lastWeekPosition: parseInt(r.lastWeekPosition, 10) || 0, peakPosition: parseInt(r.peakPosition, 10) || i + 1 }))
    };
    const res = await save(payload);
    setSaving(false);
    if (res.ok) setStatus({ ok: true, msg: "✓ Guardado. El ranking público está actualizado." });
    else if (res.offline) setStatus({ ok: false, msg: "⚠ Sin backend PHP: guardado solo en este navegador." });
    else setStatus({ ok: false, msg: "✕ Error: " + (res.error || "no se pudo guardar") });
  };

  const exportBackup = () => downloadJson({ lastUpdatedAt: header.lastUpdatedAt, weekLabel: header.weekLabel, songs: rows }, "ranking-backup.json");

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando ranking…</p>;

  return (
    <>
      <header className="panel__head">
        <div>
          <h1>Top 20 — Ranking semanal</h1>
          <p>Editando <strong>{header.weekLabel || defaultWeek}</strong> · {rows.length} canciones</p>
          {error === "offline" && <p className="panel__offline">⚠ Sin backend: cambios solo locales</p>}
        </div>
        <div className="panel__actions">
          <button className="btn btn--ghost btn--small" onClick={rotateWeek} title="Marcar nueva semana">↻ Nueva semana</button>
          <button className="btn btn--ghost btn--small" onClick={exportBackup} title="Descargar backup">⬇ Backup</button>
          <button className="btn btn--primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        </div>
      </header>
      <div className="panel__hint"><strong>Cómo usar:</strong> pega cualquier link de YouTube — título, artista y miniatura se rellenan solos. Usa ▲▼ para reordenar.</div>
      {status && <div className={"panel__status" + (status.ok ? " panel__status--ok" : " panel__status--warn")}>{status.msg}</div>}
      <div className="panel__list">
        {rows.map((r, i) => {
          const vid = extractYouTubeId(r.url);
          const thumb = vid ? youtubeThumb(vid, "hqdefault") : null;
          return (
            <div className="panel-row" key={r.id || i}>
              <div className="panel-row__pos">
                <span className="panel-row__num">#{i + 1}</span>
                <div className="panel-row__arrows">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Subir">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="Bajar">▼</button>
                </div>
              </div>
              <div className="panel-row__thumb">
                {thumb ? <img src={thumb} alt="" onError={(e) => { e.target.style.display = "none"; }} /> : <span className="panel-row__nothumb">sin miniatura</span>}
              </div>
              <div className="panel-row__fields">
                <input type="text" value={r.title || ""} onChange={(e) => update(r.id, "title", e.target.value)} placeholder="Título" />
                <input type="text" value={r.artist || ""} onChange={(e) => update(r.id, "artist", e.target.value)} placeholder="Artista" />
                <div className="panel-row__row panel-row__row--wide">
                  <input type="text" value={r.url || ""} onChange={(e) => { const raw = e.target.value; const extracted = extractYouTubeId(raw); update(r.id, "url", raw); if (extracted) { update(r.id, "videoId", extracted); update(r.id, "id", extracted); } }} placeholder="Pega el enlace de YouTube" className="panel-row__input--mono" />
                  {fetchingIds.has(r.id) ? <span className="panel__fetch-spinner" title="Obteniendo título y artista…">⏳</span> : <button type="button" className="btn btn--ghost btn--small" onClick={() => fetchNow(r)} title="Obtener título y artista desde YouTube" style={{ fontSize: "0.9rem", padding: "2px 8px" }}>🔄</button>}
                </div>
                <div className="panel-row__row">
                  <label>Entró: <input type="date" value={(r.enteredAt || today).slice(0, 10)} onChange={(e) => update(r.id, "enteredAt", e.target.value)} /></label>
                  <label>Sem. ant.: <input type="number" min="0" max="20" value={r.lastWeekPosition ?? 0} onChange={(e) => update(r.id, "lastWeekPosition", e.target.value)} /></label>
                  <label>Pico: <input type="number" min="1" max="20" value={r.peakPosition ?? (i + 1)} onChange={(e) => update(r.id, "peakPosition", e.target.value)} /></label>
                  <label className="panel-row__check"><input type="checkbox" checked={!!r.isNew} onChange={(e) => { update(r.id, "isNew", e.target.checked); if (e.target.checked) { update(r.id, "lastWeekPosition", 0); update(r.id, "peakPosition", 0); } }} /> Nueva</label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <footer className="panel__foot">
        <button className="btn btn--primary btn--big" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        <button className="btn btn--ghost btn--big" onClick={exportBackup}>⬇ Descargar backup</button>
      </footer>
    </>
  );
}

function EditorTop15() {
  const { data, loading, error, save } = useVideos();
  const [videos, setVideos] = useState([]);
  const [header, setHeader] = useState({ lastUpdatedAt: today, weekLabel: "" });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const fetchedRef = useRef(new Set());

  useEffect(() => {
    if (!data) return;
    setVideos(data.videos.map((v, i) => ({ ...v, id: extractYouTubeId(v.url) || v.videoId || v.id || i + 1, videoId: extractYouTubeId(v.url) || v.videoId || "" })));
    setHeader({ lastUpdatedAt: data.lastUpdatedAt || today, weekLabel: data.weekLabel || "" });
  }, [data]);

  const defaultWeek = useMemo(() => {
    const d = new Date();
    return "Semana del " + d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  }, []);

  useEffect(() => {
    const toFetch = [];
    for (const r of videos) {
      if (!r.videoId || r.videoId.length < 11) continue;
      if (fetchedRef.current.has(r.videoId)) continue;
      toFetch.push(r);
    }
    if (toFetch.length === 0) return;
    toFetch.forEach((r) => {
      fetchedRef.current.add(r.videoId);
      setFetchingIds((prev) => new Set([...prev, r.id]));
      fetchYoutubeInfo(r.videoId).then((info) => {
        setFetchingIds((prev) => { const next = new Set(prev); next.delete(r.id); return next; });
        if (!info) return;
        setVideos((rs) => rs.map((row) => {
          if (row.id !== r.id) return row;
          return {
            ...row,
            title: info.title ? info.title.toUpperCase() : row.title || "",
            artist: info.artist ? info.artist.toUpperCase() : row.artist || ""
          };
        }));
      });
    });
  }, [videos]);

  const fetchNow = async (r) => {
    const vid = extractYouTubeId(r.url) || r.videoId;
    if (!vid || vid.length < 11) return;
    setFetchingIds((prev) => new Set([...prev, r.id]));
    const info = await fetchYoutubeInfo(vid);
    setFetchingIds((prev) => { const next = new Set(prev); next.delete(r.id); return next; });
    if (!info) { alert("No se pudo obtener info del video. Abrí F12 > Console para ver detalles."); return; }
    setVideos((rs) => rs.map((row) => {
      if (row.id !== r.id) return row;
      return {
        ...row,
        title: info.title ? info.title.toUpperCase() : row.title,
        artist: info.artist ? info.artist.toUpperCase() : row.artist,
        videoId: vid
      };
    }));
  };

  const update = (id, field, value) => setVideos((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const move = (index, dir) => setVideos((rs) => {
    const next = [...rs];
    const j = index + dir;
    if (j < 0 || j >= next.length) return rs;
    [next[index], next[j]] = [next[j], next[index]];
    next.forEach((r, i) => { r.rank = i + 1; });
    return next;
  });

  const rotateWeek = () => {
    if (!confirm("¿Marcar nueva semana? Las posiciones actuales se guardarán como \"semana anterior\" y la fecha/etiqueta se actualizarán a la semana actual. Debes pulsar Guardar para que se publique.")) return;
    setVideos((rs) => rs.map((r) => ({ ...r, lastWeekPosition: r.rank, isNew: false })));
    setHeader({ lastUpdatedAt: new Date().toISOString().slice(0, 10), weekLabel: currentWeekLabel() });
    setStatus({ ok: false, msg: "Rotado. Recuerda pulsar Guardar cambios para publicar." });
  };

  const addEmpty = () => {
    setVideos((rs) => {
      const maxId = rs.reduce((m, v) => Math.max(m, v.id || 0), 0);
      return [...rs, { id: maxId + 1, rank: rs.length + 1, title: "", artist: "", url: "", videoId: "", enteredAt: today, lastWeekPosition: 0, peakPosition: 0, isNew: false }];
    });
  };

  const removeVideo = (id) => {
    if (!confirm("¿Eliminar este vídeo?")) return;
    setVideos((rs) => rs.filter((r) => r.id !== id).map((r, i) => ({ ...r, rank: i + 1 })));
  };

  const guardar = async () => {
    if (saving) return;
    setSaving(true);
    const payload = {
      lastUpdatedAt: header.lastUpdatedAt || today,
      weekLabel: header.weekLabel || defaultWeek,
      videos: videos.map((v, i) => ({ ...v, rank: i + 1, lastWeekPosition: parseInt(v.lastWeekPosition, 10) || 0, peakPosition: parseInt(v.peakPosition, 10) || i + 1 }))
    };
    const res = await save(payload);
    setSaving(false);
    if (res.ok) setStatus({ ok: true, msg: "✓ Guardado. El Top 15 público está actualizado." });
    else if (res.offline) setStatus({ ok: false, msg: "⚠ Sin backend PHP: guardado solo en este navegador." });
    else setStatus({ ok: false, msg: "✕ Error: " + (res.error || "no se pudo guardar") });
  };

  const exportBackup = () => downloadJson({ lastUpdatedAt: header.lastUpdatedAt, weekLabel: header.weekLabel, videos }, "top15videos-backup.json");

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando vídeos…</p>;

  return (
    <>
      <header className="panel__head">
        <div>
          <h1>Top 15 — Videos musicales</h1>
          <p>{videos.length} vídeos · {header.weekLabel || defaultWeek}</p>
          {error === "offline" && <p className="panel__offline">⚠ Sin backend: cambios solo locales</p>}
        </div>
        <div className="panel__actions">
          <button className="btn btn--ghost btn--small" onClick={rotateWeek} title="Marcar nueva semana">↻ Nueva semana</button>
          <button className="btn btn--ghost btn--small" onClick={addEmpty} title="Añadir vídeo">➕ Añadir</button>
          <button className="btn btn--ghost btn--small" onClick={exportBackup} title="Descargar backup">⬇ Backup</button>
          <button className="btn btn--primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        </div>
      </header>
      <div className="panel__hint"><strong>Cómo usar:</strong> pega cualquier link de YouTube — título, artista y miniatura se rellenan solos. Usa ▲▼ para reordenar.</div>
      {status && <div className={"panel__status" + (status.ok ? " panel__status--ok" : " panel__status--warn")}>{status.msg}</div>}
      <div className="panel__list">
        {videos.map((v, i) => {
          const vid = extractYouTubeId(v.url);
          const thumb = vid ? youtubeThumb(vid, "hqdefault") : null;
          return (
            <div className="panel-row" key={v.id || i}>
              <div className="panel-row__pos">
                <span className="panel-row__num">#{v.rank || i + 1}</span>
                <div className="panel-row__arrows">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Subir">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === videos.length - 1} title="Bajar">▼</button>
                  <button className="panel-row__remove" onClick={() => removeVideo(v.id)} title="Eliminar">✕</button>
                </div>
              </div>
              <div className="panel-row__thumb">
                {thumb ? <img src={thumb} alt="" onError={(e) => { e.target.style.display = "none"; }} /> : <span className="panel-row__nothumb">sin miniatura</span>}
              </div>
              <div className="panel-row__fields">
                <input type="text" value={v.title || ""} onChange={(e) => update(v.id, "title", e.target.value)} placeholder="Título" />
                <input type="text" value={v.artist || ""} onChange={(e) => update(v.id, "artist", e.target.value)} placeholder="Artista" />
                <div className="panel-row__row panel-row__row--wide">
                  <input type="text" value={v.url || ""} onChange={(e) => { const raw = e.target.value; const extracted = extractYouTubeId(raw); update(v.id, "url", raw); if (extracted) { update(v.id, "videoId", extracted); update(v.id, "id", extracted); } }} placeholder="Pega el enlace de YouTube" className="panel-row__input--mono" />
                  {fetchingIds.has(v.id) ? <span className="panel__fetch-spinner" title="Obteniendo título y artista…">⏳</span> : <button type="button" className="btn btn--ghost btn--small" onClick={() => fetchNow(v)} title="Obtener título y artista desde YouTube" style={{ fontSize: "0.9rem", padding: "2px 8px" }}>🔄</button>}
                </div>
                <div className="panel-row__row">
                  <label>Entró: <input type="date" value={(v.enteredAt || today).slice(0, 10)} onChange={(e) => update(v.id, "enteredAt", e.target.value)} /></label>
                  <label>Sem. ant.: <input type="number" min="0" max="15" value={v.lastWeekPosition ?? 0} onChange={(e) => update(v.id, "lastWeekPosition", e.target.value)} /></label>
                  <label>Pico: <input type="number" min="1" max="15" value={v.peakPosition ?? (i + 1)} onChange={(e) => update(v.id, "peakPosition", e.target.value)} /></label>
                  <label className="panel-row__check"><input type="checkbox" checked={!!v.isNew} onChange={(e) => { update(v.id, "isNew", e.target.checked); if (e.target.checked) { update(v.id, "lastWeekPosition", 0); update(v.id, "peakPosition", 0); } }} /> Nueva</label>
                </div>
              </div>
            </div>
          );
        })}
        {videos.length === 0 && <p style={{ color: "var(--text-mute)", padding: 16 }}>No hay vídeos. Pulsa "➕ Añadir" para agregar el primero.</p>}
      </div>
      <footer className="panel__foot">
        <button className="btn btn--ghost btn--small" onClick={addEmpty} title="Añadir vídeo">➕ Añadir vídeo</button>
        <button className="btn btn--primary btn--big" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        <button className="btn btn--ghost btn--big" onClick={exportBackup}>⬇ Descargar backup</button>
      </footer>
    </>
  );
}

function EditorNoticias() {
  const { data, loading, error, save } = useNews();
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setArticles(data.articles.map((a, i) => ({ ...a, id: i + 1 }))); }, [data]);

  const update = (id, field, value) => setArticles((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const addEmpty = () => {
    setArticles((rs) => {
      const maxId = rs.reduce((m, v) => Math.max(m, v.id || 0), 0);
      return [...rs, { id: maxId + 1, title: "", date: new Date().toISOString().slice(0, 10), category: "General", excerpt: "", body: "", cover: "" }];
    });
  };

  const removeArticle = (id) => { if (!confirm("¿Eliminar esta noticia?")) return; setArticles((rs) => rs.filter((r) => r.id !== id)); };

  const guardar = async () => {
    if (saving) return; setSaving(true);
    const res = await save({ articles });
    setSaving(false);
    if (res.ok) setStatus({ ok: true, msg: "✓ Noticias guardadas." });
    else if (res.offline) setStatus({ ok: false, msg: "⚠ Sin backend: guardado solo local." });
    else setStatus({ ok: false, msg: "✕ Error: " + (res.error || "") });
  };
  const exportBackup = () => downloadJson({ articles }, "news-backup.json");

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando noticias…</p>;

  return (
    <>
      <header className="panel__head">
        <div><h1>Noticias</h1><p>{articles.length} artículos</p>{error === "offline" && <p className="panel__offline">⚠ Sin backend</p>}</div>
        <div className="panel__actions">
          <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir</button>
          <button className="btn btn--ghost btn--small" onClick={exportBackup}>⬇ Backup</button>
          <button className="btn btn--primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        </div>
      </header>
      {status && <div className={"panel__status" + (status.ok ? " panel__status--ok" : " panel__status--warn")}>{status.msg}</div>}
      <div className="panel__list">
        {articles.map((a, i) => (
          <div className="panel-row" key={a.id || i}>
            <div className="panel-row__order">#{i + 1}</div>
            <ImgPreview src={a.cover} width={80} height={54} />
            <div className="panel-row__fields">
              <div className="panel-row__row panel-row__row--top">
                <input type="text" value={a.title || ""} onChange={(e) => update(a.id, "title", e.target.value)} placeholder="Título de la noticia" className="panel-input--lg" />
                <button className="panel-row__remove" onClick={() => removeArticle(a.id)} title="Eliminar noticia">✕</button>
              </div>
              <div className="panel-row__row panel-row__row--tags">
                <span className="panel-field-label">Fecha</span>
                <input type="date" value={(a.date || "").slice(0, 10)} onChange={(e) => update(a.id, "date", e.target.value)} />
                <span className="panel-field-label">Categoría</span>
                <input type="text" value={a.category || ""} onChange={(e) => update(a.id, "category", e.target.value)} placeholder="Ej: Música, Entrevista..." />
                <span className="panel-field-label">Portada URL</span>
                <input type="url" value={a.cover || ""} onChange={(e) => update(a.id, "cover", e.target.value)} placeholder="https://..." />
                <UploadBtn onUpload={(url) => update(a.id, "cover", url)} label="Subir foto" />
              </div>
              <textarea rows={2} value={a.excerpt || ""} onChange={(e) => update(a.id, "excerpt", e.target.value)} placeholder="Extracto breve — se muestra en la tarjeta de inicio" />
              <textarea rows={4} value={a.body || ""} onChange={(e) => update(a.id, "body", e.target.value)} placeholder="Cuerpo completo de la noticia — se despliega al hacer clic en 'Leer más'" className="panel-textarea--body" />
            </div>
          </div>
        ))}
        {articles.length === 0 && <p className="panel__empty">No hay noticias. Pulsa "➕ Añadir" para crear la primera.</p>}
      </div>
      <footer className="panel__foot">
        <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir noticia</button>
        <button className="btn btn--primary btn--big" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        <button className="btn btn--ghost btn--big" onClick={exportBackup}>⬇ Backup</button>
      </footer>
    </>
  );
}

function EditorEstrenos() {
  const { data, loading, error, save } = usePremieres();
  const [premieres, setPremieres] = useState([]);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const fetchedRef = useRef(new Set());

  useEffect(() => { if (data) setPremieres(data.premieres.map((p, i) => ({ ...p, id: i + 1 }))); }, [data]);

  const update = (id, field, value) => setPremieres((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  // Auto-fetch del título desde YouTube cuando se pega un tráiler
  useEffect(() => {
    const toFetch = [];
    for (const p of premieres) {
      const vid = extractYouTubeId(p.url);
      if (!vid || vid.length < 11) continue;
      if (fetchedRef.current.has(vid)) continue;
      if (p.title && p.title.trim()) continue;
      toFetch.push({ id: p.id, vid });
    }
    if (toFetch.length === 0) return;
    toFetch.forEach(({ id, vid }) => {
      fetchedRef.current.add(vid);
      setFetchingIds((prev) => new Set([...prev, id]));
      fetchYoutubeInfo(vid).then((info) => {
        setFetchingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        if (!info) { fetchedRef.current.delete(vid); return; }
        const movieTitle = (info.artist || info.title || "").toUpperCase();
        if (!movieTitle) { fetchedRef.current.delete(vid); return; }
        setPremieres((rs) => rs.map((row) => (row.id === id && !row.title ? { ...row, title: movieTitle } : row)));
      });
    });
  }, [premieres]);

  const fetchNow = async (p) => {
    const vid = extractYouTubeId(p.url);
    if (!vid || vid.length < 11) return;
    setFetchingIds((prev) => new Set([...prev, p.id]));
    const info = await fetchYoutubeInfo(vid);
    setFetchingIds((prev) => { const next = new Set(prev); next.delete(p.id); return next; });
    if (!info) { alert("No se pudo obtener el título desde YouTube."); return; }
    const movieTitle = (info.artist || info.title || "").toUpperCase();
    setPremieres((rs) => rs.map((row) => (row.id === p.id ? { ...row, title: movieTitle || row.title } : row)));
  };

  const addEmpty = () => {
    setPremieres((rs) => {
      const maxId = rs.reduce((m, v) => Math.max(m, v.id || 0), 0);
      return [...rs, { id: maxId + 1, title: "", url: "", poster: "", date: new Date().toISOString().slice(0, 10), genre: "", description: "" }];
    });
  };

  const remove = (id) => { if (!confirm("¿Eliminar este estreno?")) return; setPremieres((rs) => rs.filter((r) => r.id !== id)); };

  const guardar = async () => {
    if (saving) return; setSaving(true);
    const res = await save({ premieres });
    setSaving(false);
    if (res.ok) setStatus({ ok: true, msg: "✓ Estrenos guardados." });
    else if (res.offline) setStatus({ ok: false, msg: "⚠ Sin backend: guardado solo local." });
    else setStatus({ ok: false, msg: "✕ Error: " + (res.error || "") });
  };
  const exportBackup = () => downloadJson({ premieres }, "premieres-backup.json");

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando estrenos…</p>;

  return (
    <>
      <header className="panel__head">
        <div><h1>Estrenos de cine</h1><p>{premieres.length} películas</p>{error === "offline" && <p className="panel__offline">⚠ Sin backend</p>}</div>
        <div className="panel__actions">
          <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir</button>
          <button className="btn btn--ghost btn--small" onClick={exportBackup}>⬇ Backup</button>
          <button className="btn btn--primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        </div>
      </header>
      {status && <div className={"panel__status" + (status.ok ? " panel__status--ok" : " panel__status--warn")}>{status.msg}</div>}
      <div className="panel__list">
        {premieres.map((p, i) => {
          const ytId = extractYouTubeId(p.url);
          const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
          return (
          <div className="panel-row" key={p.id || i}>
            <div className="panel-row__order">#{i + 1}</div>
            <ImgPreview src={ytThumb || p.poster} width={90} height={52} style={{ borderRadius: 6 }} />
            <div className="panel-row__fields">
              <div className="panel-row__row panel-row__row--top">
                <input type="text" value={p.title || ""} onChange={(e) => update(p.id, "title", e.target.value)} placeholder="Título de la película" className="panel-input--lg" />
                <button className="panel-row__remove" onClick={() => remove(p.id)} title="Eliminar estreno">✕</button>
              </div>
              <div className="panel-row__row panel-row__row--tags">
                <span className="panel-field-label">Estreno</span>
                <input type="date" value={(p.date || "").slice(0, 10)} onChange={(e) => update(p.id, "date", e.target.value)} />
                <span className="panel-field-label">Género</span>
                <input type="text" value={p.genre || ""} onChange={(e) => update(p.id, "genre", e.target.value)} placeholder="Ej: Acción, Drama..." />
              </div>
              <div className="panel-row__row panel-row__row--tags">
                <span className="panel-field-label">Tráiler YouTube</span>
                <input type="url" value={p.url || ""} onChange={(e) => update(p.id, "url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                {fetchingIds.has(p.id) ? <span className="panel__fetch-spinner" title="Obteniendo título…">⏳</span> : <button type="button" className="btn btn--ghost btn--small" onClick={() => fetchNow(p)} title="Obtener título desde YouTube">🔄</button>}
              </div>
              <details className="panel-collapse">
                <summary className="panel-collapse__sum">Póster personalizado (opcional)</summary>
                <div className="panel-row__row panel-row__row--tags" style={{ marginTop: 6 }}>
                  <input type="url" value={p.poster || ""} onChange={(e) => update(p.id, "poster", e.target.value)} placeholder="https://..." />
                  <UploadBtn onUpload={(url) => update(p.id, "poster", url)} label="Subir póster" />
                </div>
              </details>
              <textarea rows={2} value={p.description || ""} onChange={(e) => update(p.id, "description", e.target.value)} placeholder="Sinopsis — descripción breve de la película" />
            </div>
          </div>
          );
        })}
        {premieres.length === 0 && <p className="panel__empty">No hay estrenos. Pulsa "➕ Añadir" para agregar el primero.</p>}
      </div>
      <footer className="panel__foot">
        <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir estreno</button>
        <button className="btn btn--primary btn--big" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        <button className="btn btn--ghost btn--big" onClick={exportBackup}>⬇ Backup</button>
      </footer>
    </>
  );
}

function EditorEspeciales() {
  const { data, loading, error, save } = useSpecials();
  const [specials, setSpecials] = useState([]);
  const [monthLabel, setMonthLabel] = useState("Especiales de este mes");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSpecials(data.specials.map((s, i) => ({ ...s, id: i + 1 })));
    setMonthLabel(data.monthLabel || "Especiales de este mes");
  }, [data]);

  const update = (id, field, value) => setSpecials((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const addEmpty = () => {
    setSpecials((rs) => {
      const maxId = rs.reduce((m, v) => Math.max(m, v.id || 0), 0);
      return [...rs, { id: maxId + 1, day: rs.length + 1, artist: "", image: "", bio: "" }];
    });
  };

  const remove = (id) => { if (!confirm("¿Eliminar este especial?")) return; setSpecials((rs) => rs.filter((r) => r.id !== id)); };

  const guardar = async () => {
    if (saving) return; setSaving(true);
    const res = await save({ monthLabel, specials });
    setSaving(false);
    if (res.ok) setStatus({ ok: true, msg: "✓ Especiales guardados." });
    else if (res.offline) setStatus({ ok: false, msg: "⚠ Sin backend: guardado solo local." });
    else setStatus({ ok: false, msg: "✕ Error: " + (res.error || "") });
  };
  const exportBackup = () => downloadJson({ monthLabel, specials }, "specials-backup.json");

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando especiales…</p>;

  return (
    <>
      <header className="panel__head">
        <div><h1>Especiales del mes</h1><p>{specials.length} invitados</p>{error === "offline" && <p className="panel__offline">⚠ Sin backend</p>}</div>
        <div className="panel__actions">
          <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir</button>
          <button className="btn btn--ghost btn--small" onClick={exportBackup}>⬇ Backup</button>
          <button className="btn btn--primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        </div>
      </header>
      {status && <div className={"panel__status" + (status.ok ? " panel__status--ok" : " panel__status--warn")}>{status.msg}</div>}
      <div className="panel__hint" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <strong>Etiqueta del mes:</strong>
        <input type="text" value={monthLabel} onChange={(e) => setMonthLabel(e.target.value)} style={{ flex: "0 0 280px" }} placeholder="Ej: Especiales de Julio" />
      </div>
      <div className="panel__list">
        {specials.map((s, i) => (
          <div className="panel-row" key={s.id || i}>
            <div className="panel-row__order">#{i + 1}</div>
            <ImgPreview src={s.image} width={54} height={54} style={{ borderRadius: "50%" }} />
            <div className="panel-row__fields">
              <div className="panel-row__row panel-row__row--top">
                <input type="text" value={s.artist || ""} onChange={(e) => update(s.id, "artist", e.target.value)} placeholder="Nombre del artista / invitado" className="panel-input--lg" />
                <div className="panel-row__row" style={{ gap: 6, flexShrink: 0 }}>
                  <span className="panel-field-label">Día</span>
                  <input type="number" min="1" max="31" value={s.day} onChange={(e) => update(s.id, "day", parseInt(e.target.value) || 1)} style={{ width: 60 }} />
                  <button className="panel-row__remove" onClick={() => remove(s.id)} title="Eliminar especial">✕</button>
                </div>
              </div>
              <div className="panel-row__row panel-row__row--tags">
                <span className="panel-field-label">Foto URL</span>
                <input type="url" value={s.image || ""} onChange={(e) => update(s.id, "image", e.target.value)} placeholder="https://..." />
                <UploadBtn onUpload={(url) => update(s.id, "image", url)} label="Subir foto" />
              </div>
              <textarea rows={2} value={s.bio || ""} onChange={(e) => update(s.id, "bio", e.target.value)} placeholder="Biografía — descripción del artista y qué presentará" />
            </div>
          </div>
        ))}
        {specials.length === 0 && <p className="panel__empty">No hay especiales. Pulsa "➕ Añadir" para agregar el primero.</p>}
      </div>
      <footer className="panel__foot">
        <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir especial</button>
        <button className="btn btn--primary btn--big" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        <button className="btn btn--ghost btn--big" onClick={exportBackup}>⬇ Backup</button>
      </footer>
    </>
  );
}

function EditorBanner() {
  const { data, loading, error, save, clearCache } = useBanner();
  const [slides, setSlides] = useState([]);
  const [seasonLabel, setSeasonLabel] = useState("");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSlides(data.slides.map((s, i) => ({ ...s, id: i + 1 })));
    setSeasonLabel(data.seasonLabel || "");
  }, [data]);

  const update = (id, field, value) => setSlides((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const addEmpty = () => {
    setSlides((rs) => {
      const maxId = rs.reduce((m, v) => Math.max(m, v.id || 0), 0);
      return [...rs, { id: maxId + 1, image: "", title: "", subtitle: "", season: "" }];
    });
  };

  const remove = (id) => { if (!confirm("¿Eliminar esta diapositiva?")) return; setSlides((rs) => rs.filter((r) => r.id !== id)); };

  const guardar = async () => {
    if (saving) return; setSaving(true);
    const res = await save({ seasonLabel, slides });
    setSaving(false);
    if (res.ok) setStatus({ ok: true, msg: "✓ Banner guardado." });
    else if (res.offline) setStatus({ ok: false, msg: "⚠ Sin backend: guardado solo local." });
    else setStatus({ ok: false, msg: "✕ Error: " + (res.error || "") });
  };
  const exportBackup = () => downloadJson({ seasonLabel, slides }, "banner-backup.json");

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando banner…</p>;

  return (
    <>
      <header className="panel__head">
        <div><h1>Banner principal</h1><p>{slides.length} diapositivas</p>{error === "offline" && <p className="panel__offline">⚠ Sin backend</p>}</div>
        <div className="panel__actions">
          <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir</button>
          <button className="btn btn--ghost btn--small" onClick={exportBackup}>⬇ Backup</button>
          <button className="btn btn--danger btn--small" onClick={clearCache}>🗑 Restablecer</button>
          <button className="btn btn--primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        </div>
      </header>
      {status && <div className={"panel__status" + (status.ok ? " panel__status--ok" : " panel__status--warn")}>{status.msg}</div>}
      <div className="panel__hint" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <strong>Etiqueta de temporada:</strong>
        <input type="text" value={seasonLabel} onChange={(e) => setSeasonLabel(e.target.value)} style={{ flex: "0 0 280px" }} placeholder="Ej: Verano 2026" />
      </div>
      <div className="panel__list">
        {slides.map((s, i) => (
          <div className="panel-row" key={s.id || i}>
            <div className="panel-row__order">#{i + 1}</div>
            <ImgPreview src={s.image} width={120} height={50} style={{ borderRadius: 6 }} />
            <div className="panel-row__fields">
              <div className="panel-row__row panel-row__row--top">
                <input type="text" value={s.title || ""} onChange={(e) => update(s.id, "title", e.target.value)} placeholder="Título de la diapositiva" className="panel-input--lg" />
                <button className="panel-row__remove" onClick={() => remove(s.id)} title="Eliminar">✕</button>
              </div>
              <div className="panel-row__row panel-row__row--tags">
                <span className="panel-field-label">Subtítulo</span>
                <input type="text" value={s.subtitle || ""} onChange={(e) => update(s.id, "subtitle", e.target.value)} placeholder="Texto secundario" style={{ flex: 1 }} />
                <span className="panel-field-label">Imagen URL</span>
                <input type="url" value={s.image || ""} onChange={(e) => update(s.id, "image", e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
                <UploadBtn onUpload={(url) => update(s.id, "image", url)} label="Subir imagen" />
              </div>
            </div>
          </div>
        ))}
        {slides.length === 0 && <p className="panel__empty">No hay diapositivas. Pulsa "➕ Añadir" para crear la primera.</p>}
      </div>
      <footer className="panel__foot">
        <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir diapositiva</button>
        <button className="btn btn--danger btn--big" onClick={clearCache}>🗑 Restablecer</button>
        <button className="btn btn--primary btn--big" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        <button className="btn btn--ghost btn--big" onClick={exportBackup}>⬇ Backup</button>
      </footer>
    </>
  );
}

function EditorDjs() {
  const { data, loading, error, save } = useDjs();
  const [djs, setDjs] = useState([]);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setDjs(data.djs.map((d, i) => ({ ...d, id: i + 1 }))); }, [data]);

  const update = (id, field, value) => setDjs((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const addEmpty = () => {
    setDjs((rs) => {
      const maxId = rs.reduce((m, v) => Math.max(m, v.id || 0), 0);
      return [...rs, { id: maxId + 1, name: "", role: "", program: "", image: "", bio: "" }];
    });
  };

  const remove = (id) => { if (!confirm("¿Eliminar este locutor?")) return; setDjs((rs) => rs.filter((r) => r.id !== id)); };

  const guardar = async () => {
    if (saving) return; setSaving(true);
    const res = await save({ djs });
    setSaving(false);
    if (res.ok) setStatus({ ok: true, msg: "✓ Locutores guardados." });
    else if (res.offline) setStatus({ ok: false, msg: "⚠ Sin backend: guardado solo local." });
    else setStatus({ ok: false, msg: "✕ Error: " + (res.error || "") });
  };
  const exportBackup = () => downloadJson({ djs }, "djs-backup.json");

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando locutores…</p>;

  return (
    <>
      <header className="panel__head">
        <div><h1>Locutores</h1><p>{djs.length} personas</p>{error === "offline" && <p className="panel__offline">⚠ Sin backend</p>}</div>
        <div className="panel__actions">
          <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir</button>
          <button className="btn btn--ghost btn--small" onClick={exportBackup}>⬇ Backup</button>
          <button className="btn btn--primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        </div>
      </header>
      {status && <div className={"panel__status" + (status.ok ? " panel__status--ok" : " panel__status--warn")}>{status.msg}</div>}
      <div className="panel__list">
        {djs.map((d, i) => (
          <div className="panel-row" key={d.id || i}>
            <div className="panel-row__order">#{i + 1}</div>
            <ImgPreview src={d.image} width={54} height={54} style={{ borderRadius: "50%" }} />
            <div className="panel-row__fields">
              <div className="panel-row__row panel-row__row--top">
                <input type="text" value={d.name || ""} onChange={(e) => update(d.id, "name", e.target.value)} placeholder="Nombre del locutor" className="panel-input--lg" />
                <button className="panel-row__remove" onClick={() => remove(d.id)} title="Eliminar">✕</button>
              </div>
              <div className="panel-row__row panel-row__row--tags">
                <span className="panel-field-label">Rol</span>
                <input type="text" value={d.role || ""} onChange={(e) => update(d.id, "role", e.target.value)} placeholder="Ej: Locutor, DJ..." />
                <span className="panel-field-label">Programa</span>
                <input type="text" value={d.program || ""} onChange={(e) => update(d.id, "program", e.target.value)} placeholder="Nombre del programa" style={{ flex: 1 }} />
              </div>
              <div className="panel-row__row panel-row__row--tags">
                <span className="panel-field-label">Foto URL</span>
                <input type="url" value={d.image || ""} onChange={(e) => update(d.id, "image", e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
                <UploadBtn onUpload={(url) => update(d.id, "image", url)} label="Subir foto" />
              </div>
              <textarea rows={2} value={d.bio || ""} onChange={(e) => update(d.id, "bio", e.target.value)} placeholder="Biografía breve del locutor" />
            </div>
          </div>
        ))}
        {djs.length === 0 && <p className="panel__empty">No hay locutores. Pulsa "➕ Añadir" para agregar el primero.</p>}
      </div>
      <footer className="panel__foot">
        <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir locutor</button>
        <button className="btn btn--primary btn--big" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        <button className="btn btn--ghost btn--big" onClick={exportBackup}>⬇ Backup</button>
      </footer>
    </>
  );
}

const CAT_ICONS = { top20: "🎵", top15: "🎬", candidatos: "⭐" };

function VotacionCategory({ icon, label, results, expanded, onToggle, onDelete }) {
  if (results.length === 0) return null;
  const maxVotes = results[0].total;
  return (
    <div className="votaciones-category">
      <h2 className="votaciones-category__title">{icon} {label}</h2>
      <div className="votaciones">
        {results.map((item, idx) => {
          const pct = Math.round((item.total / maxVotes) * 100);
          const isOpen = expanded[item.id];
          return (
            <div className={"votacion-card" + (isOpen ? " votacion-card--open" : "") + (item.inList === false ? " votacion-card--orphan" : "")} key={item.id}>
              <div className="votacion-card__head" onClick={() => onToggle(item.id)}>
                <span className="votacion-card__rank">#{idx + 1}</span>
                <div className="votacion-card__info">
                  <div className="votacion-card__title">{item.title}{item.inList === false && <span className="votacion-card__orphan-tag">fuera de lista</span>}</div>
                  <div className="votacion-card__artist">{item.artist}</div>
                </div>
                <div className="votacion-card__bar-wrap">
                  <div className="votacion-card__bar" style={{ width: pct + "%" }} />
                </div>
                <span className="votacion-card__count">{item.total}</span>
                <button
                  className="votacion-card__delete"
                  title="Eliminar todos los votos de este elemento"
                  onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(item.id); }}
                >🗑</button>
                <span className="votacion-card__arrow">{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && (
                <div className="votacion-card__voters">
                  <div className="votacion-card__voters-title">Votantes ({item.voters.length})</div>
                  {item.voters.map((v, i) => (
                    <div className="votacion-voter" key={i}>
                      <span className="votacion-voter__icon">❤</span>
                      <span className="votacion-voter__name">{v.nombre}</span>
                      <span className="votacion-voter__date">{v.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditorVotaciones() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [activeCat, setActiveCat] = useState("top20");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/votaciones.php", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const removeVotes = useCallback(async (catKey, id) => {
    if (!window.confirm("¿Eliminar todos los votos de este elemento? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch("/api/votaciones.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: catKey, id })
      });
      const j = await res.json();
      if (j && j.ok) { load(); }
      else { window.alert("No se pudo eliminar: " + ((j && j.error) || "error desconocido")); }
    } catch {
      window.alert("Error de red al eliminar los votos.");
    }
  }, [load]);

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando votaciones…</p>;
  if (!data || !data.ok) return <p style={{ color: "var(--text-dim)" }}>No hay votaciones o no se pudieron cargar.</p>;

  const cats = data.categories || {};
  const catKeys = ["top20", "top15", "candidatos"].filter((k) => cats[k] && cats[k].totalVotes > 0);
  if (catKeys.length === 0) {
    return (
      <>
        <header className="panel__head">
          <div>
            <h1>Votaciones del público</h1>
            <p>{data.totalVotes || 0} votos totales</p>
          </div>
          <div className="panel__actions">
            <button className="btn btn--ghost btn--small" onClick={load} title="Actualizar">🔄 Actualizar</button>
          </div>
        </header>
        <p className="panel__empty">Aún no hay votos. Cuando los oyentes voten, aparecerán aquí.</p>
      </>
    );
  }
  if (!catKeys.includes(activeCat)) setActiveCat(catKeys[0]);
  const cat = cats[activeCat];

  return (
    <>
      <header className="panel__head">
        <div>
          <h1>Votaciones del público</h1>
          <p>{data.totalVotes || 0} votos totales</p>
        </div>
        <div className="panel__actions">
          <button className="btn btn--ghost btn--small" onClick={load} title="Actualizar">🔄 Actualizar</button>
        </div>
      </header>

      <div className="panel__tabs panel__tabs--sub">
        {catKeys.map((key) => (
          <button
            key={key}
            className={"panel__tab" + (activeCat === key ? " panel__tab--active" : "")}
            onClick={() => setActiveCat(key)}
          >
            {CAT_ICONS[key]} {cats[key].label} <span className="panel__tab-count">{cats[key].totalVotes}</span>
          </button>
        ))}
      </div>

      <VotacionCategory
        icon={CAT_ICONS[activeCat]}
        label={cat.label}
        results={cat.results}
        expanded={expanded}
        onToggle={toggle}
        onDelete={(id) => removeVotes(activeCat, id)}
      />
    </>
  );
}

function EditorCandidatos() {
  const { data, loading, error, save } = useCandidatos();
  const [rows, setRows] = useState([]);
  const [weekLabel, setWeekLabel] = useState("");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fetchingIds, setFetchingIds] = useState(new Set());
  const fetchedRef = useRef(new Set());

  useEffect(() => {
    if (!data) return;
    setRows(data.candidatos.map((c, i) => ({ ...c, id: c.videoId || extractYouTubeId(c.url) || c.id || i + 1, videoId: c.videoId || extractYouTubeId(c.url) || "" })));
    setWeekLabel(data.weekLabel || "");
  }, [data]);

  useEffect(() => {
    const toFetch = [];
    for (const r of rows) {
      if (!r.videoId || r.videoId.length < 11) continue;
      if (fetchedRef.current.has(r.videoId)) continue;
      toFetch.push(r);
    }
    if (toFetch.length === 0) return;
    toFetch.forEach((r) => {
      fetchedRef.current.add(r.videoId);
      setFetchingIds((prev) => new Set([...prev, r.id]));
      fetchYoutubeInfo(r.videoId).then((info) => {
        setFetchingIds((prev) => { const next = new Set(prev); next.delete(r.id); return next; });
        if (!info) return;
        setRows((rs) => rs.map((row) => {
          if (row.id !== r.id) return row;
          return { ...row, title: info.title || row.title || "", artist: info.artist || row.artist || "" };
        }));
      });
    });
  }, [rows]);

  const update = (id, field, value) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const fetchNow = async (r) => {
    if (!r.videoId || r.videoId.length < 11) return;
    setFetchingIds((prev) => new Set([...prev, r.id]));
    const info = await fetchYoutubeInfo(r.videoId);
    setFetchingIds((prev) => { const next = new Set(prev); next.delete(r.id); return next; });
    if (!info) { alert("No se pudo obtener info del video."); return; }
    setRows((rs) => rs.map((row) => {
      if (row.id !== r.id) return row;
      return { ...row, title: info.title || row.title, artist: info.artist || row.artist };
    }));
  };

  const move = (index, dir) => setRows((rs) => {
    const next = [...rs];
    const j = index + dir;
    if (j < 0 || j >= next.length) return rs;
    [next[index], next[j]] = [next[j], next[index]];
    next.forEach((r, i) => { r.position = i + 1; });
    return next;
  });

  const addEmpty = () => {
    setRows((rs) => {
      const maxId = rs.reduce((m, r) => Math.max(m, r.id || 0), 0);
      return [...rs, { id: maxId + 1, position: rs.length + 1, title: "", artist: "", videoId: "", cover: "" }];
    });
  };

  const removeRow = (id) => {
    if (!confirm("¿Eliminar este candidato?")) return;
    setRows((rs) => rs.filter((r) => r.id !== id).map((r, i) => ({ ...r, position: i + 1 })));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true); setStatus(null);
    const payload = { weekLabel, candidatos: rows.map((r, i) => ({ ...r, position: i + 1 })) };
    const res = await save(payload);
    setSaving(false);
    if (res.ok) setStatus({ ok: true, msg: "✓ Guardado. Los candidatos están actualizados." });
    else if (res.offline) setStatus({ ok: false, msg: "⚠ Sin backend PHP: guardado solo en este navegador." });
    else setStatus({ ok: false, msg: "✕ Error: " + (res.error || "no se pudo guardar") });
  };

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando candidatos…</p>;

  return (
    <>
      <header className="panel__head">
        <div>
          <h1>Candidatos — Próxima semana</h1>
          <p>{rows.length} candidatos</p>
          {error === "offline" && <p className="panel__offline">⚠ Sin backend: cambios solo locales</p>}
        </div>
        <div className="panel__actions">
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
            <label>Etiqueta: <input type="text" value={weekLabel} onChange={(e) => setWeekLabel(e.target.value)} style={{ width: 200, padding: "4px 8px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text)" }} placeholder="Ej: Candidatos de la semana" /></label>
          </span>
          <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir</button>
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        </div>
      </header>
      <div className="panel__hint"><strong>Cómo usar:</strong> pega el link de YouTube — título, artista y miniatura se rellenan solos. Usa ▲▼ para reordenar.</div>
      {status && <div className={"panel__status" + (status.ok ? " panel__status--ok" : " panel__status--warn")}>{status.msg}</div>}
      <div className="panel__list">
        {rows.map((r, i) => {
          const thumb = youtubeThumb(r.videoId);
          return (
            <div className="panel-row" key={r.id || i}>
              <div className="panel-row__pos">
                <span className="panel-row__num">#{i + 1}</span>
                <div className="panel-row__arrows">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="Subir">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="Bajar">▼</button>
                  <button className="panel-row__remove" onClick={() => removeRow(r.id)} title="Eliminar">✕</button>
                </div>
              </div>
              <div className="panel-row__thumb">
                {thumb ? <><img src={thumb} alt="" onError={(e) => { e.target.style.display = "none"; }} /><span className="panel-row__play" aria-hidden="true" /></> : <span className="panel-row__nothumb">sin thumbnail</span>}
              </div>
              <div className="panel-row__fields panel-row__fields--compact">
                <div className="panel-row__row">
                  <input type="text" value={r.title || ""} onChange={(e) => update(r.id, "title", e.target.value)} placeholder="Título" />
                  <input type="text" value={r.artist || ""} onChange={(e) => update(r.id, "artist", e.target.value)} placeholder="Artista" />
                </div>
                <div className="panel-row__row">
                  <input type="text" value={r.videoId || ""} onChange={(e) => { const raw = e.target.value; const extracted = extractYouTubeId(raw) || raw; update(r.id, "videoId", extracted); if (extracted) update(r.id, "id", extracted); }} placeholder="Link o ID de YouTube" style={{ flex: 1 }} />
                  {fetchingIds.has(r.id) ? <span title="Obteniendo título y artista…">⏳</span> : <button type="button" className="btn btn--ghost btn--small" onClick={() => fetchNow(r)} title="Obtener título y artista desde YouTube">🔄</button>}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p style={{ color: "var(--text-mute)", padding: 16 }}>No hay candidatos. Pulsa "➕ Añadir" para agregar el primero.</p>}
      </div>
      <footer className="panel__foot">
        <button className="btn btn--ghost btn--small" onClick={addEmpty}>➕ Añadir candidato</button>
        <button className="btn btn--primary btn--big" onClick={handleSave} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
      </footer>
    </>
  );
}

function EditorStreaming() {
  const { data, loading, error, save } = useConfig();
  const [streamUrl, setStreamUrl] = useState("");
  const [ytChannelId, setYtChannelId] = useState("");
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setStreamUrl(data.streamUrl || "");
    setYtChannelId(data.ytChannelId || "");
  }, [data]);

  const guardar = async () => {
    if (saving) return;
    setSaving(true); setStatus(null);
    const res = await save({ streamUrl, ytChannelId });
    setSaving(false);
    if (res.ok) setStatus({ ok: true, msg: "✓ Configuración guardada. El reproductor y la cámara usan el nuevo enlace." });
    else setStatus({ ok: false, msg: "✕ Error: " + (res.error || "no se pudo guardar") });
  };

  if (loading) return <p style={{ color: "var(--text-dim)" }}>Cargando configuración…</p>;

  return (
    <>
      <header className="panel__head">
        <div>
          <h1>📡 Emisión en vivo</h1>
          <p>Link de streaming y canal de YouTube para la cámara</p>
          {error === "offline" && <p className="panel__offline">⚠ Sin backend: guardado solo en este navegador.</p>}
        </div>
        <div className="panel__actions">
          <button className="btn btn--primary" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
        </div>
      </header>
      {status && <div className={"panel__status" + (status.ok ? " panel__status--ok" : " panel__status--warn")}>{status.msg}</div>}
      <div className="panel__list">
        <div
          style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "18px 20px",
            display: "flex", flexDirection: "column", gap: "10px",
          }}
        >
          <div className="panel-row__row panel-row__row--tags">
            <span className="panel-field-label">Link de streaming (audio)</span>
            <input
              type="url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://tu-servidor:puerto/stream"
              style={{ flex: 1, minWidth: "220px", padding: "8px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: "0.9rem" }}
              className="panel-row__input--mono"
            />
          </div>
          <p className="panel__hint" style={{ marginTop: 0 }}>
            Es el enlace que usa el reproductor inferior (el botón ▶ EN DIRECTO). Ej: <code>https://streaming12.elitecomunicacion.es:8208/stream?type=.mp3</code>
          </p>
          <div className="panel-row__row panel-row__row--tags">
            <span className="panel-field-label">Canal YouTube (cámara en vivo)</span>
            <input
              type="text"
              value={ytChannelId}
              onChange={(e) => setYtChannelId(e.target.value)}
              placeholder="UC_xxxxxxxxxxxxxxxxxxxxxx (Channel ID)"
              style={{ flex: 1, minWidth: "320px", padding: "8px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: "0.9rem" }}
              className="panel-row__input--mono"
            />
          </div>
          <p className="panel__hint" style={{ marginTop: 0 }}>
            Es el Channel ID (empieza por <code>UC</code>) de tu canal de YouTube para el bloque "📷 Cámara en vivo". Déjalo vacío si no usas cámara.
          </p>
          {streamUrl && (
            <div className="panel__hint" style={{ marginTop: 4 }}>
              <strong>Vista previa:</strong> el reproductor usará <code>{streamUrl}</code>
            </div>
          )}
        </div>
      </div>
      <footer className="panel__foot">
        <button className="btn btn--primary btn--big" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "💾 Guardar cambios"}</button>
      </footer>
    </>
  );
}

export default function Panel() {
  const [authed, setAuthed] = useState(null);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState("top20");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("/api/login.php", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => setAuthed(j?.authed === true))
      .catch(() => setAuthed(false));
  }, []);

  const logout = async () => {
    try { await fetch("/api/login.php", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); } catch {}
    setAuthed(false);
    setPwd("");
    setStatus(null);
  };

  const login = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setPwdError(false);
    try {
      const res = await fetch("/api/login.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd })
      });
      const j = await res.json();
      if (j?.ok) { setAuthed(true); }
      else { setPwdError(true); }
    } catch {
      setPwdError(true);
    }
    setLoggingIn(false);
  };

  if (authed === null) return null;

  if (!authed) {
    return (
      <div className="panel-login">
        <form className="panel-login__card" onSubmit={login}>
          <h1>Panel de edición</h1>
          <p className="panel-login__sub">Introduce la contraseña para editar el ranking y los vídeos.</p>
          <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Contraseña" autoFocus disabled={loggingIn} />
          {pwdError && <p className="panel-login__err">Contraseña incorrecta.</p>}
          <button type="submit" className="btn btn--primary" disabled={loggingIn}>{loggingIn ? "Entrando…" : "Entrar"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel__tabs" role="tablist">
        <button className={"panel__tab" + (tab === "top20" ? " panel__tab--active" : "")} onClick={() => setTab("top20")} role="tab" aria-selected={tab === "top20"}>Top 20</button>
        <button className={"panel__tab" + (tab === "top15" ? " panel__tab--active" : "")} onClick={() => setTab("top15")} role="tab" aria-selected={tab === "top15"}>Top 15 Vídeos</button>
        <button className={"panel__tab" + (tab === "news" ? " panel__tab--active" : "")} onClick={() => setTab("news")} role="tab" aria-selected={tab === "news"}>Noticias</button>
        <button className={"panel__tab" + (tab === "premieres" ? " panel__tab--active" : "")} onClick={() => setTab("premieres")} role="tab" aria-selected={tab === "premieres"}>Estrenos</button>
        <button className={"panel__tab" + (tab === "specials" ? " panel__tab--active" : "")} onClick={() => setTab("specials")} role="tab" aria-selected={tab === "specials"}>Especiales</button>
        <button className={"panel__tab" + (tab === "banner" ? " panel__tab--active" : "")} onClick={() => setTab("banner")} role="tab" aria-selected={tab === "banner"}>Banner</button>
        <button className={"panel__tab" + (tab === "djs" ? " panel__tab--active" : "")} onClick={() => setTab("djs")} role="tab" aria-selected={tab === "djs"}>Locutores</button>
        <button className={"panel__tab" + (tab === "candidatos" ? " panel__tab--active" : "")} onClick={() => setTab("candidatos")} role="tab" aria-selected={tab === "candidatos"}>🎯 Candidatos</button>
        <button className={"panel__tab" + (tab === "votos" ? " panel__tab--active" : "")} onClick={() => setTab("votos")} role="tab" aria-selected={tab === "votos"}>🗳️ Votaciones</button>
        <button className={"panel__tab" + (tab === "stream" ? " panel__tab--active" : "")} onClick={() => setTab("stream")} role="tab" aria-selected={tab === "stream"}>📡 En vivo</button>
        <div className="panel__tab-logout">
          <button className="btn btn--ghost btn--small panel__logout" onClick={logout} title="Cerrar sesión">⏻ Salir</button>
        </div>
      </div>
      {tab === "top20" && <EditorTop20 />}
      {tab === "top15" && <EditorTop15 />}
      {tab === "news" && <EditorNoticias />}
      {tab === "premieres" && <EditorEstrenos />}
      {tab === "specials" && <EditorEspeciales />}
      {tab === "banner" && <EditorBanner />}
      {tab === "djs" && <EditorDjs />}
      {tab === "candidatos" && <EditorCandidatos />}
      {tab === "votos" && <EditorVotaciones />}
      {tab === "stream" && <EditorStreaming />}

      <section className="panel__docs">
        <details>
          <summary>¿Cómo preparar el panel en cPanel? (desplegar)</summary>
          <ol>
            <li>Sube toda la carpeta <code>dist</code> a <code>public_html</code> vía FTP o el Gestor de archivos.</li>
            <li>Verifica que existan <code>public_html/api/ranking.php</code>, <code>public_html/api/videos.php</code> y sus respectivos <code>data/</code>.</li>
            <li>Dar permisos de escritura: <code>chmod 775 public_html/api/data</code> (y <code>chmod 664 *.json</code>).</li>
            <li>Cambia <code>PANEL_PASSWORD</code> dentro de <code>api/auth.php</code> para mayor seguridad.</li>
            <li>Abre <code>https://tudominio.es/panel</code>, escribe la contraseña y edita.</li>
          </ol>
        </details>
      </section>
    </div>
  );
}