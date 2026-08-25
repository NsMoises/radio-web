import { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat.js";

const LS_NAME = "radio-web:chat-name";

function formatTime(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBox() {
  const { messages, send, sending, rateLimit } = useChat();
  const [name, setName] = useState(() => {
    try { return localStorage.getItem(LS_NAME) || ""; } catch { return ""; }
  });
  const [draftName, setDraftName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const confirmName = () => {
    const n = draftName.trim();
    if (!n) return;
    setName(n);
    try { localStorage.setItem(LS_NAME, n); } catch {}
  };

  // Auto-scroll arriba (mensajes más nuevos arriba)
  const scrollToTop = () => {
    const el = listRef.current;
    if (el) el.scrollTop = 0;
  };

  useEffect(() => { scrollToTop(); }, [messages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = name.trim();
    const t = text.trim();
    if (!n || !t) { setError("Escribe tu nombre y un mensaje."); return; }
    try { localStorage.setItem(LS_NAME, n); } catch {}
    setError("");
    const res = await send(n, t);
    if (res.ok) {
      setText("");
      inputRef.current?.focus();
    } else if (res.error === "Rate limit") {
      setError("Espera antes de enviar otro mensaje.");
    } else {
      setError(res.error || "Error al enviar");
    }
  };

  return (
    <div className="chatbox">
      <div className="chatbox__head">
        <span className="chatbox__icon">💬</span>
        <span className="chatbox__title">Chat en vivo</span>
      </div>

      <div className="chatbox__list" ref={listRef}>
        {messages.length === 0 && (
          <p className="chatbox__empty">Aún no hay mensajes. ¡Sé el primero!</p>
        )}
        {[...messages].reverse().map((m) => (
          <div className="chatbox__msg" key={m.id}>
            <span className="chatbox__msg-name">{m.name}</span>
            <span className="chatbox__msg-text">{m.text}</span>
            <span className="chatbox__msg-time">{formatTime(m.ts)}</span>
          </div>
        ))}
      </div>

      <form className="chatbox__form" onSubmit={handleSubmit}>
        {!name && (
          <div className="chatbox__name-row">
            <input
              type="text"
              className="chatbox__name"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Tu nombre completo"
              maxLength={30}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmName(); } }}
            />
            <button
              type="button"
              className="chatbox__name-btn"
              onClick={confirmName}
              disabled={!draftName.trim()}
            >
              Usar
            </button>
          </div>
        )}
        {name && (
          <div className="chatbox__greeting">
            <span className="chatbox__greeting-name">{name}</span>
            <button type="button" className="chatbox__greeting-edit" onClick={() => { setName(""); setDraftName(""); }} title="Cambiar nombre">✕</button>
          </div>
        )}
        <div className="chatbox__input-row">
          <input
            type="text"
            ref={inputRef}
            className="chatbox__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={rateLimit > 0 ? `Espera ${rateLimit}s…` : "Escribe un mensaje…"}
            maxLength={300}
            disabled={sending || rateLimit > 0}
          />
          <button
            type="submit"
            className="chatbox__send"
            disabled={sending || rateLimit > 0 || !text.trim()}
          >
            {sending ? "…" : "→"}
          </button>
        </div>
        {error && <p className="chatbox__error">{error}</p>}
      </form>
    </div>
  );
}
