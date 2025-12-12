import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Account.css";
import { me, updateMe, changePassword } from "../api/services/authService.js";

export default function Account() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "", email: "", role: "usuario" });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    async function loadProfile() {
      setLoading(true);
      setErr(null);
      try {
        const data = await me();
        setProfile({
          name: data.name || data.fullName || data.username || "",
          email: data.email || "",
          role: data.role || data.roles?.[0] || "usuario"
        });
      } catch (e) {
        console.debug("[Account] me error", e);
        // fallback: intentar decodificar token si existe
        try {
          const parts = token.split(".");
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
            setProfile({
              name: payload.name || payload.fullName || payload.username || "",
              email: payload.email || "",
              role: payload.role || payload.roles?.[0] || "usuario"
            });
            setErr("Perfil cargado desde token (sincroniza para confirmar).");
            setLoading(false);
            return;
          }
        } catch (_) {}
        setErr("No se pudo cargar perfil desde el servidor.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token, navigate]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (!profile?.name || !profile?.email) {
      setErr("Nombre y email son obligatorios.");
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateMe({ name: profile.name, email: profile.email });
      setProfile(prev => ({ ...prev, ...(updated || {}) }));
      setMsg("Perfil actualizado correctamente.");
    } catch (errResp) {
      let text = "Error actualizando perfil.";
      try {
        const body = await errResp.json();
        text = body.message || text;
      } catch (_) {}
      setErr(text);
    } finally {
      setSavingProfile(false);
      setTimeout(() => { setMsg(null); setErr(null); }, 4000);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    const current = e.target.currentPassword.value.trim();
    const next = e.target.newPassword.value.trim();
    const confirm = e.target.confirmPassword.value.trim();

    if (!current || !next || !confirm) {
      setErr("Todos los campos de contraseña son obligatorios.");
      return;
    }
    if (next.length < 6) {
      setErr("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (next !== confirm) {
      setErr("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    setChangingPw(true);
    try {
      await changePassword(current, next);
      setMsg("Contraseña cambiada correctamente.");
      e.target.reset();
    } catch (errResp) {
      let text = "Error cambiando contraseña.";
      try {
        const body = await errResp.json();
        text = body.message || text;
      } catch (_) {}
      setErr(text);
    } finally {
      setChangingPw(false);
      setTimeout(() => { setMsg(null); setErr(null); }, 4000);
    }
  }

  return (
    <div className="account-page">
      <div className="account-card">
        <header className="account-header">
          <h1>Mi cuenta (Admin)</h1>
          <div>
            <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </header>

        {loading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <>
            {msg && <p className="success">{msg}</p>}
            {err && <p className="error" role="alert">{err}</p>}

            <section className="profile-section">
              <h2>Editar perfil</h2>
              <form onSubmit={handleProfileSave} className="profile-form">
                <div className="form-row">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={profile?.name || ""}
                    onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile?.email || ""}
                    onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Rol</label>
                  <input type="text" value={profile?.role || ""} disabled />
                </div>
                <div className="form-actions">
                  <button className="btn-primary" type="submit" disabled={savingProfile}>
                    {savingProfile ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </section>

            <section className="settings-section">
              <h2>Cambiar contraseña</h2>
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-row">
                  <label>Contraseña actual</label>
                  <input name="currentPassword" type="password" autoComplete="current-password" />
                </div>
                <div className="form-row">
                  <label>Nueva contraseña</label>
                  <input name="newPassword" type="password" autoComplete="new-password" />
                </div>
                <div className="form-row">
                  <label>Confirmar nueva contraseña</label>
                  <input name="confirmPassword" type="password" autoComplete="new-password" />
                </div>
                <div className="form-actions">
                  <button className="btn-primary" type="submit" disabled={changingPw}>
                    {changingPw ? "Cambiando..." : "Cambiar contraseña"}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  );
}