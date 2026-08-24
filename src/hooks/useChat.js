import { useState, useEffect, useCallback, useRef } from "react";

const API = "/api/chat.php";
const POLL_MS = 5000;

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [rateLimit, setRateLimit] = useState(0);
  const lastTsRef = useRef(0);

  // Polling (una sola vez, sin dependencias)
  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      try {
        const url = lastTsRef.current > 0 ? `${API}?since=${lastTsRef.current}` : API;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || !mounted) return;
        if (lastTsRef.current > 0) {
          if (data.length > 0) {
            setMessages((prev) => {
              const next = [...data.reverse(), ...prev].slice(-200);
              return next;
            });
            const max = Math.max(...data.map((m) => m.ts || 0));
            if (max > lastTsRef.current) lastTsRef.current = max;
          }
        } else {
          setMessages(data.reverse().slice(-200));
          if (data.length > 0) {
            lastTsRef.current = Math.max(...data.map((m) => m.ts || 0));
          }
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Rate limit countdown
  useEffect(() => {
    if (rateLimit <= 0) return;
    const t = setInterval(() => setRateLimit((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [rateLimit]);

  // Enviar mensaje
  const send = useCallback(async (name, text) => {
    if (sending || rateLimit > 0) return { ok: false, error: "Rate limit" };
    setSending(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text })
      });
      const json = await res.json();
      if (json.ok) {
        lastTsRef.current = json.ts || 0;
        return { ok: true };
      } else {
        if (json.retryAfter) setRateLimit(json.retryAfter);
        return { ok: false, error: json.error || "Error" };
      }
    } catch {
      return { ok: false, error: "Sin conexión" };
    } finally {
      setSending(false);
    }
  }, [sending, rateLimit]);

  return { messages, send, sending, rateLimit };
}
