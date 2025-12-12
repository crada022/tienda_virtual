import { useState } from "react";
import styles from "../styles/chatWidget.module.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ChatWidget({ storeId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const user = { role: "user", content: input };
    setMessages((m) => [...m, user]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/stores/${storeId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [user] })
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "Lo siento, hubo un error. Intenta más tarde." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`${styles.chatWidget} ${open ? styles.open : ''}`}>
      <button className={styles.chatToggle} onClick={() => setOpen(!open)}>{open ? "Cerrar" : "Chat"}</button>

      {open && (
        <div className={styles.chatWindow}>
          <div className={styles.chatLog}>
            {messages.map((m, i) => (
              <div key={i} className={`${m.role === 'user' ? styles.msgUser : styles.msgAssistant}`}>
                <div className={styles.bubble}>{m.content}</div>
              </div>
            ))}
            {loading && <div className={styles.msgAssistant}><div className={styles.bubble}>Escribiendo...</div></div>}
          </div>

          <div className={styles.chatInput}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Pregunta sobre la tienda o sus productos..." />
            <button onClick={send}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}