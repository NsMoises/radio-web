import { useState, useEffect, useCallback } from "react";

const API_URL = "/api/votar.php";
const LS_MY_VOTE = "radio-web:votos:myVote";
const LS_COUNTS = "radio-web:votos:counts";

function getLocalMyVote() {
  try { return parseInt(localStorage.getItem(LS_MY_VOTE), 10) || null; } catch { return null; }
}
function setLocalMyVote(songId) {
  try { if (songId) localStorage.setItem(LS_MY_VOTE, String(songId)); else localStorage.removeItem(LS_MY_VOTE); } catch {}
}
function getLocalCounts() {
  try { return JSON.parse(localStorage.getItem(LS_COUNTS)) || {}; } catch { return {}; }
}
function saveLocalCounts(counts) {
  try { localStorage.setItem(LS_COUNTS, JSON.stringify(counts)); } catch {}
}

export function useVotos() {
  const [votes, setVotes] = useState(getLocalCounts);
  const [myVote, setMyVote] = useState(getLocalMyVote);
  const [loading, setLoading] = useState(true);

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

  const vote = useCallback(async (songId) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId })
      });
      const j = await res.json();
      if (j?.votes) { setVotes(j.votes); saveLocalCounts(j.votes); }
      if (j?.myVote !== undefined) { setMyVote(j.myVote); setLocalMyVote(j.myVote); }
      return j?.ok;
    } catch {
      // Fallback offline: simula toggle
      const current = getLocalMyVote();
      const newMyVote = current === songId ? null : songId;
      setMyVote(newMyVote);
      setLocalMyVote(newMyVote);
      const oldCounts = getLocalCounts();
      if (current === songId) {
        oldCounts[songId] = Math.max(0, (oldCounts[songId] || 1) - 1);
        if (oldCounts[songId] === 0) delete oldCounts[songId];
      } else {
        if (current !== null && oldCounts[current]) oldCounts[current] = Math.max(0, (oldCounts[current] || 1) - 1);
        oldCounts[songId] = (oldCounts[songId] || 0) + 1;
      }
      setVotes({ ...oldCounts });
      saveLocalCounts(oldCounts);
      return true;
    }
  }, []);

  return { votes, myVote, vote, loading };
}
