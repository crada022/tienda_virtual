import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import styles from "../styles/accountOrders.module.css";

export default function StoreProfile() {
  const { slug } = useParams(); // ✅ slug
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const token = localStorage.getItem(`store:${slug}:token`); // ✅ token correcto

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        // 👤 customer actual
        const res = await fetch(
          `${API}/api/public/${slug}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (res.status === 401) {
          localStorage.removeItem(`store:${slug}:token`);
          navigate(`/store/${slug}`);
          return;
        }

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
  }, [slug, token, navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch(
        `${API}/api/public/${slug}/auth/me`,
        {
          method: "PATCH", // ⚠️ solo si luego lo implementas
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            password: password || undefined
          })
        }
      );

      if (!res.ok) {
        throw new Error("No se pudo actualizar el perfil");
      }

      setMessage("Perfil actualizado correctamente");
    } catch (err) {
      setMessage(err.message || "Error guardando cambios");
    }
  }

  if (!token) {
    return <div style={{ padding: 20 }}>Inicia sesión para editar tu perfil.</div>;
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando perfil...</div>;
  }

  return (
    <>
      <PublicNavBar slug={slug} />

      <div style={{ maxWidth: 720, margin: "18px auto", padding: "0 18px" }}>
        <h2>Mi perfil</h2>

        <div className={styles.orderCard} style={{ padding: 18 }}>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 12 }}>
              <label>Nombre</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                Dejar en blanco para mantener la contraseña actual.
              </div>
            </div>

            <button className={styles.continueBtn} type="submit">
              Guardar
            </button>

            {message && <div style={{ marginTop: 12 }}>{message}</div>}
          </form>
        </div>
      </div>
    </>
  );
}
