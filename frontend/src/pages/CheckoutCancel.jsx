import { useParams, useNavigate } from "react-router-dom";

export default function CheckoutCancel() {
  const { slug } = useParams();   // ✅ AQUÍ ESTABA EL PROBLEMA
  const navigate = useNavigate();

  if (!slug) {
    // fallback por seguridad
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <h2>Pago cancelado</h2>
        <button onClick={() => navigate("/")}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>❌ Pago cancelado</h1>
      <p>No se realizó ningún cobro.</p>

      <button
        style={styles.button}
        onClick={() => navigate(`/store/${slug}/checkout`)}
      >
        Intentar de nuevo
      </button>

      <button
        style={{ ...styles.button, background: "#444" }}
        onClick={() => navigate(`/store/${slug}`)}
      >
        Volver a la tienda
      </button>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 500,
    margin: "80px auto",
    padding: 24,
    textAlign: "center"
  },
  title: {
    color: "#e74c3c"
  },
  button: {
    padding: "12px 18px",
    margin: "10px",
    background: "#000",
    color: "#fff",
    border: "none",
    cursor: "pointer"
  }
};
