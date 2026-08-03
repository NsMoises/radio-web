import { useEffect, useState, useCallback } from "react";

const API = "/api/votar-candidato.php";
const LS_VOTE_KEY = "radio-web:vc-vote";
const LS_NAME_KEY = "radio-web:vc-nombre";

export function useVotoCandidato() {
  const [votes, setVotes] = useState({});
  const [myVote, setMyVote] = useState(null);
  const [voteMsg, setVoteMsg] = useState(null);
  const [nombre, setNombreState] = useState(() => {
    try { return localStorage.getItem(LS_NAME_KEY) || ""; } catch { return ""; }
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch(API, { method: "GET" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.ok) {
        setVotes(json.votes || {});
        setMyVote(json.myVote);
      }
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    const onVis = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  const setNombre = useCallback((n) => { setNombreState(n); try { localStorage.setItem(LS_NAME_KEY, n); } catch {} }, []);

  const vote = useCallback(async (candidatoId) => {
    if (myVote === candidatoId) {
      try {
        const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidatoId, action: "unvote" }) });
        const json = await res.json();
        if (json.ok) { setVotes(json.votes || {}); setMyVote(json.myVote); setVoteMsg("Voto retirado"); setTimeout(() => setVoteMsg(null), 3000); }
      } catch { setVoteMsg("Error de conexion"); setTimeout(() => setVoteMsg(null), 3000); }
      return;
    }

    if (myVote !== null && myVote !== candidatoId) {
      setVoteMsg("Ya votaste por otro candidato hoy"); setTimeout(() => setVoteMsg(null), 3000);
      return;
    }

    let voterName = nombre;
    if (!voterName.trim()) {
      voterName = prompt("¿Como te llamas? (para registrar tu voto)") || "";
      if (!voterName.trim()) return;
      voterName = voterName.trim().slice(0, 60);
      setNombre(voterName);
    }

    try {
      const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidatoId, nombre: voterName }) });
      const json = await res.json();
      if (json.ok) {
        setVotes(json.votes || {}); setMyVote(json.myVote); setVoteMsg("Voto registrado"); setTimeout(() => setVoteMsg(null), 3000);
      } else if (json.error) {
        setVoteMsg(json.error); setTimeout(() => setVoteMsg(null), 3000);
      }
    } catch {
      setVoteMsg("Error de conexion"); setTimeout(() => setVoteMsg(null), 3000);
    }
  }, [myVote, nombre, setNombre]);

  return { votes, myVote, vote, voteMsg, nombre, setNombre };
}
