import { useEffect, useState, useCallback } from "react";
import { STREAM_URL } from "../config";

const API_URL = "/api/config.php";
const LS_KEY = "radio-web:config:backup";

const DEFAULTS = { streamUrl: STREAM_URL, ytChannelId: "" };

export function useConfig() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(API_URL + "?_=" + Date.now(), { method: "GET" });
      if (!res.ok) throw new Error("API " + res.status);
      const json = await res.json();
      if (!json || typeof json !== "object") throw new Error("Formato inválido");
      setData({ ...DEFAULTS, ...json });
      try { localStorage.setItem(LS_KEY, JSON.stringify(json)); } catch {}
      return json;
    } catch {
      try { const ls = localStorage.getItem(LS_KEY); if (ls) { const j = JSON.parse(ls); if (j && j.streamUrl) { setData({ ...DEFAULTS, ...j }); setError("offline"); return j; } } } catch {}
      setData(DEFAULTS); setError("offline"); return DEFAULTS;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (newData) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamUrl: newData.streamUrl || "",
          ytChannelId: newData.ytChannelId || ""
        })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error al guardar");
      await load();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e?.message || e) };
    }
  }, [load]);

  return { data, loading, error, reload: load, save };
}
