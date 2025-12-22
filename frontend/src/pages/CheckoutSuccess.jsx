import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CheckoutSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // opcional: limpiar carrito global
    localStorage.removeItem("cart");
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>✅ ¡Pago realizado con éxito!</h1>

      <p style={styles.text}>
        Gracias por tu compra. Hemos recibido tu pago correctamente.
      </p>

      <button
        style={styles.button}
        onClick={() => navigate("/")}
      >
        Volver a la tienda
      </button>

      <button
        style={{ ...styles.button, background: "#444" }}
        onClick={() => navigate("/orders")}
      >
        Ver mis pedidos
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
    color: "#2ecc71"
  },
  text: {
    margin: "20px 0"
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
