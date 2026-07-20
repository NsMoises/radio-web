import { useEffect, useState, useCallback } from "react";

const API = "/api/candidatos.php";
const LS_KEY = "radio-web:candidatos:backup";
const EV_KEY = "candidatos-saved";

export function useCandidatos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API, { method: "GET" });
      if (!res.ok) throw new Error("API " + res.status);
      const json = await res.json();
      if (!json || !Array.isArray(json.candidatos)) throw new Error("Formato invalido");
      setData(json);
      try { localStorage.setItem(LS_KEY, JSON.stringify(json)); } catch {}
      return json;
    } catch {
      try {
        const ls = localStorage.getItem(LS_KEY);
        if (ls) { const j = JSON.parse(ls); if (j && Array.isArray(j.candidatos) && j.candidatos.length > 0) { setData(j); setError("offline"); return j; } }
      } catch {}
      setData(null);
      setError("offline");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const handler = () => load();
    window.addEventListener(EV_KEY, handler);
    return () => window.removeEventListener(EV_KEY, handler);
  }, [load]);

  const save = useCallback(async (newData) => {
    const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newData) });
    const json = await res.json();
    if (json.ok) { window.dispatchEvent(new CustomEvent(EV_KEY)); }
    return json;
  }, []);

  return { data, loading, error, save };
}
