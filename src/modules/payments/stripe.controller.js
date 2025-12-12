import Stripe from "stripe";
import prisma from "../../config/db.js";

const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2022-11-15" }) : null;

export async function createCheckoutSession(req, res) {
  try {
    if (!stripe) return res.status(500).json({ error: "Stripe no configurado" });

    const { orderId, successUrl, cancelUrl } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId es requerido" });

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: true }
    });
    if (!order) return res.status(404).json({ error: "Order no encontrada" });

    const line_items = (order.items || []).map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.product?.name || `Item ${item.id}` },
        unit_amount: Math.round((item.price || 0) * 100)
      },
      quantity: item.quantity || 1
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: successUrl || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/checkout/success` : "https://example.com/success"),
      cancel_url: cancelUrl || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/checkout/cancel` : "https://example.com/cancel"),
      metadata: { orderId: String(order.id) }
    });

    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("[stripe.createCheckoutSession]", err);
    return res.status(500).json({ error: "Error creando sesión Stripe", detail: err.message });
  }
}

export async function webhook(req, res) {
  try {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    // if webhook secret configured, verify signature using raw body
    if (webhookSecret && sig && stripe) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (e) {
        console.error("[stripe.webhook] signature verification failed", e.message);
        return res.status(400).send(`Webhook Error: ${e.message}`);
      }
    } else {
      // fallback: parse JSON body (when express.json applied)
      try {
        event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      } catch (e) {
        console.error("[stripe.webhook] invalid body", e.message);
        return res.status(400).send("Invalid payload");
      }
    }

    const type = event.type || event.eventType || event.type;
    console.debug("[stripe.webhook] event type:", type);

    if (type === "checkout.session.completed" || type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        try {
          await prisma.order.update({ where: { id: Number(orderId) }, data: { status: "PAID" } });
          console.debug("[stripe.webhook] Order marked as PAID", orderId);
        } catch (e) {
          console.error("[stripe.webhook] failed to update order", e.message);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[stripe.webhook] error", err);
    res.status(500).send("Internal error");
  }
}

export default { createCheckoutSession, webhook };
