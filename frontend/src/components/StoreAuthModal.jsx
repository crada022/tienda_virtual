import { useEffect, useState } from "react";
import { StoreLogin, StoreRegister } from "../pages/StoreAuth";
import styles from "../styles/storeAuthModal.module.css";

export default function StoreAuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("login"); // login | register
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    function handler(e) {
      setSlug(e.detail.slug);
      setMode(e.detail.mode || "login");
      setOpen(true);
    }

    window.addEventListener("open-store-auth", handler);
    return () => window.removeEventListener("open-store-auth", handler);
  }, []);

  function close() {
    setOpen(false);
  }

  if (!open || !slug) return null;

  return (
    <div className={styles.backdrop} onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={close}>
          ✕
        </button>

        {mode === "login" ? (
          <StoreLogin
            slug={slug}
            onAuth={close}
          />
        ) : (
          <StoreRegister
            slug={slug}
            onAuth={close}
          />
        )}

        <div style={{ textAlign: "center", marginTop: 12 }}>
          {mode === "login" ? (
            <button
              className="btn-link"
              onClick={() => setMode("register")}
            >
              ¿No tienes cuenta? Regístrate
            </button>
          ) : (
            <button
              className="btn-link"
              onClick={() => setMode("login")}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
