import React, { useState } from "react";
import api from "../api/axios";

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      // 1) Crear orden desde el carrito en el backend
      const orderRes = await api.post("/orders");
      const order = orderRes.data;

      // 2) Crear sesión de Stripe
      const body = { orderId: order.id };
      const sessionRes = await api.post("/payments/stripe/create-session", body);
      const { url } = sessionRes.data;
      if (url) {
        window.location.href = url; // redirigir al Checkout de Stripe
      } else {
        setError("No se pudo crear la sesión de pago");
      }
    } catch (err) {
      console.error("Checkout error", err?.response || err);
      setError(err?.response?.data?.message || err?.response?.data?.error || err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="checkout-page">
      <h1>Checkout</h1>
      <p>Resumen del pedido. Haz clic en el botón para pagar con tarjeta.</p>
      {error && <div className="error">{error}</div>}
      <button onClick={handlePay} disabled={loading} className="btn-add">
        {loading ? "Redirigiendo al pago..." : "Pagar con tarjeta"}
      </button>
    </section>
  );
}