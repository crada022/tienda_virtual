import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import styles from "../styles/accountOrders.module.css";

export default function StoreProfile() {
  const { storeId } = useParams();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem(`store:${storeId}:token`);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!token) return setLoading(false);
    async function load() {
      try {
        const res = await fetch(`${API}/api/stores/${storeId}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const json = await res.json();
          setCustomer(json.customer);
          setName(json.customer?.name || "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [storeId, token]);

  async function handleSave(e) {
    e.preventDefault();
    setMessage(null);
    // No existe endpoint para actualizar tenant customer en backend actual; intentar llamar a /api/stores/:storeId/auth/update si lo implementas.
    try {
      // Intentar un patch directo al tenant via endpoint de tenant si existe
      const res = await fetch(`${API}/api/stores/${storeId}/auth/me`, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      if (!res.ok) throw new Error("No se puede actualizar en este momento");
      // Si backend soporta actualización, enviar payload. Aquí solo mostramos mensaje.
      setMessage("Perfil actualizado (simulado). Implementa endpoint tenant para cambios reales.");
    } catch (err) {
      setMessage(err.message || "Error guardando");
    }
  }

  if (!token) return <div style={{ padding: 20 }}>Inicia sesión para editar tu perfil.</div>;
  if (loading) return <div style={{ padding: 20 }}>Cargando perfil...</div>;

  return (
    <>
      <PublicNavBar storeId={storeId} />
      <div style={{ maxWidth: 720, margin: "18px auto", padding: "0 18px" }}>
        <h2>Mi perfil</h2>
        <div className={styles.orderCard} style={{ padding: 18 }}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 12 }}>
            <label>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Nueva contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Dejar en blanco para mantener la contraseña actual.</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className={styles.continueBtn} type="submit">Guardar</button>
          </div>
          {message && <div style={{ marginTop: 12 }}>{message}</div>}
        </form>
      </div>
    </div>
    </>
  );
}
