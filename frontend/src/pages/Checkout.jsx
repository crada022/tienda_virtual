import { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import PublicNavBar from "../components/PublicNavBar";

export default function Checkout() {
  const { slug } = useParams(); // ✅ SLUG
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cartKey = `store:${slug}:cart`;
  const tokenKey = `store:${slug}:token`;

  async function handlePay() {
    setLoading(true);
    setError(null);

    try {
      const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const token = localStorage.getItem(tokenKey);

      if (!token) {
        throw new Error("Debes iniciar sesión para continuar");
      }

      if (!cart.length) {
        throw new Error("El carrito está vacío");
      }

      /* =========================
         1️⃣ CREAR ORDEN (TENANT)
      ========================= */
      const orderRes = await api.post(
        "/orders",
        {
          slug,
          items: cart
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const order = orderRes.data;

      /* =========================
         2️⃣ STRIPE SESSION
      ========================= */
      const sessionRes = await api.post(
        "/payments/stripe/create-session",
        { orderId: order.id },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const { url } = sessionRes.data;

      if (!url) {
        throw new Error("No se pudo crear la sesión de pago");
      }

      // 🔁 REDIRIGE A STRIPE
      window.location.href = url;

    } catch (err) {
      console.error("Checkout error", err);
      setError(
        err?.response?.data?.error ||
        err.message ||
        "Error en el proceso de pago"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* NAVBAR */}
      <PublicNavBar slug={slug} storeName="Checkout" />

      <section className="checkout-page">
        <h1>Checkout</h1>
        <p>Confirma tu pedido y paga de forma segura.</p>

        {error && <div className="error">{error}</div>}

        <button
          onClick={handlePay}
          disabled={loading}
          className="btn-add"
        >
          {loading ? "Redirigiendo a Stripe..." : "Pagar con tarjeta"}
        </button>
      </section>
    </>
  );
}
