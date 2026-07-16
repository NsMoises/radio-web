import { useEffect, useState, useCallback } from "react";
import specialsFallback from "../data/specials.json";

const API_URL = "/api/specials.php";
const LS_KEY = "radio-web:specials:backup";
const EV_KEY = "specials-saved";

export function useSpecials() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(API_URL, { method: "GET" });
      if (!res.ok) throw new Error("API " + res.status);
      const json = await res.json();
      if (!json || !Array.isArray(json.specials)) throw new Error("Formato invÃ¡lido");
      setData(json);
      try { localStorage.setItem(LS_KEY, JSON.stringify(json)); } catch {}
      return json;
    } catch {
      try { const ls = localStorage.getItem(LS_KEY); if (ls) { const j = JSON.parse(ls); if (j && Array.isArray(j.specials) && j.specials.length > 0) { setData(j); setError("offline"); return j; } } } catch {}
      setData(specialsFallback); setError("offline"); return specialsFallback;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener(EV_KEY, handler);
    return () => window.removeEventListener(EV_KEY, handler);
  }, [load]);

  const clearCache = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch {}
    load();
  }, [load]);

  const save = useCallback(async (newData) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData)
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al guardar");
      await load();
      window.dispatchEvent(new CustomEvent(EV_KEY));
      return { ok: true };
    } catch (e) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(newData)); } catch {}
      setData(newData);
      return { ok: false, offline: true, error: String(e?.message || e) };
    }
  }, [load]);

  return { data, loading, error, reload: load, save, clearCache };
}
