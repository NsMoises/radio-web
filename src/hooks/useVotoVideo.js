import { useState, useEffect, useCallback } from "react";

const API_URL = "/api/votar-video.php";
const LS_MY_VOTE = "radio-web:votos-video:myVote";
const LS_COUNTS = "radio-web:votos-video:counts";
const LS_NOMBRE = "radio-web:votos-video:nombre";

function getLocalMyVote() {
  try { return localStorage.getItem(LS_MY_VOTE) || null; } catch { return null; }
}
function setLocalMyVote(videoId) {
  try { if (videoId) localStorage.setItem(LS_MY_VOTE, String(videoId)); else localStorage.removeItem(LS_MY_VOTE); } catch {}
}
function getLocalCounts() {
  try { return JSON.parse(localStorage.getItem(LS_COUNTS)) || {}; } catch { return {}; }
}
function saveLocalCounts(counts) {
  try { localStorage.setItem(LS_COUNTS, JSON.stringify(counts)); } catch {}
}
function getLocalNombre() {
  try { return localStorage.getItem(LS_NOMBRE) || ""; } catch { return ""; }
}
function saveLocalNombre(nombre) {
  try { localStorage.setItem(LS_NOMBRE, nombre); } catch {}
}

export function useVotoVideo() {
  const [votes, setVotes] = useState(getLocalCounts);
  const [myVote, setMyVote] = useState(getLocalMyVote);
  const [nombre, setNombre] = useState(getLocalNombre);
  const [loading, setLoading] = useState(true);
  const [voteMsg, setVoteMsg] = useState(null);

  const loadFromApi = useCallback(() => {
    fetch(API_URL, { method: "GET" })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) return;
        if (j.votes) { setVotes(j.votes); saveLocalCounts(j.votes); }
        if (j.myVote !== undefined) { setMyVote(j.myVote); setLocalMyVote(j.myVote); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  const vote = useCallback(async (videoId) => {
    if (myVote === videoId) {
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, action: "unvote" })
        });
        const j = await res.json();
        if (j?.votes) { setVotes(j.votes); saveLocalCounts(j.votes); }
        if (j?.myVote !== undefined) { setMyVote(j.myVote); setLocalMyVote(j.myVote); }
        return true;
      } catch {
        setMyVote(null); setLocalMyVote(null);
        const c = getLocalCounts();
        c[videoId] = Math.max(0, (c[videoId] || 1) - 1);
        if (c[videoId] === 0) delete c[videoId];
        setVotes({ ...c }); saveLocalCounts(c);
        return true;
      }
    }

    if (myVote !== null && myVote !== videoId) {
      setVoteMsg("Ya votaste por otro video hoy. Retíralo primero.");
      setTimeout(() => setVoteMsg(null), 3000);
      return false;
    }

    let voterName = nombre;
    if (!voterName.trim()) {
      voterName = prompt("¿Cómo te llamas? (para registrar tu voto)") || "";
      if (!voterName.trim()) return false;
      voterName = voterName.trim().slice(0, 60);
      setNombre(voterName);
      saveLocalNombre(voterName);
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, nombre: voterName })
      });
      const j = await res.json();
      if (j?.votes) { setVotes(j.votes); saveLocalCounts(j.votes); }
      if (j?.myVote !== undefined) { setMyVote(j.myVote); setLocalMyVote(j.myVote); }
      if (j?.ok) { setVoteMsg("¡Voto registrado!"); setTimeout(() => setVoteMsg(null), 2000); }
      else if (j?.error) { setVoteMsg(j.error); setTimeout(() => setVoteMsg(null), 3000); }
      return j?.ok;
    } catch {
      setMyVote(videoId); setLocalMyVote(videoId);
      const c = getLocalCounts();
      c[videoId] = (c[videoId] || 0) + 1;
      setVotes({ ...c }); saveLocalCounts(c);
      setVoteMsg("¡Voto registrado!"); setTimeout(() => setVoteMsg(null), 2000);
      return true;
    }
  }, [myVote, nombre]);

  return { votes, myVote, vote, voteMsg, loading };
}
