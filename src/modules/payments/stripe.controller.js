import Stripe from "stripe";
import platformPrisma from "../../config/db.js";
import { getTenantPrisma } from "../../prisma/tenant.js";

const stripeSecret =
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;

const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2022-11-15" })
  : null;

/**
 * =========================
 * CREAR SESIÓN DE CHECKOUT
 * =========================
 * Requiere:
 * - resolveTenant
 * - tenantAuthMiddleware
 */
export async function createCheckoutSession(req, res) {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe no configurado" });
    }

    const prisma = req.tenantPrisma;
    if (!prisma) {
      return res.status(500).json({ error: "Tenant prisma not resolved" });
    }

    const { orderId, successUrl, cancelUrl } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "orderId es requerido" });
    }

    // 🔹 ORDEN DESDE LA BD DEL TENANT
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const line_items = order.items.map(item => ({
      price_data: {
        currency: "cop",
        product_data: {
          name: item.product?.name || `Producto ${item.productId}`
        },
        unit_amount: Math.round((item.price || 0) * 100)
      },
      quantity: item.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url:
        successUrl ||
        `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url:
        cancelUrl ||
        `${process.env.FRONTEND_URL}/checkout/cancel`,
      metadata: {
        orderId: String(order.id),
        storeId: req.store.id // 🔴 CLAVE PARA EL WEBHOOK
      }
    });

    return res.json({
      url: session.url,
      id: session.id
    });
  } catch (err) {
    console.error("[stripe.createCheckoutSession]", err);
    return res.status(500).json({
      error: "Error creando sesión Stripe",
      detail: err.message
    });
  }
}

/**
 * =========================
 * WEBHOOK STRIPE
 * =========================
 */
export async function webhook(req, res) {
  try {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    if (webhookSecret && sig && stripe) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } else {
      event = typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const orderId = Number(session.metadata?.orderId);
      const storeId = session.metadata?.storeId;

      if (!orderId || !storeId) {
        console.warn("[stripe.webhook] metadata incompleta");
        return res.json({ received: true });
      }

      // 🔹 BUSCAR STORE EN PLATFORM
      const store = await platformPrisma.store.findUnique({
        where: { id: storeId }
      });

      if (!store) {
        console.error("[stripe.webhook] store no encontrado");
        return res.json({ received: true });
      }

      // 🔹 CONECTAR AL TENANT
      const tenantDbUrl =
        process.env.TENANT_DB_PREFIX.endsWith("/")
          ? process.env.TENANT_DB_PREFIX + store.dbName
          : `${process.env.TENANT_DB_PREFIX}/${store.dbName}`;

      const tenantPrisma = getTenantPrisma(tenantDbUrl);

      // 🔹 MARCAR ORDEN COMO PAGADA
      await tenantPrisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" }
      });

      console.log("[stripe.webhook] Orden pagada:", orderId);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("[stripe.webhook]", err);
    res.status(500).send("Webhook error");
  }
}

export default {
  createCheckoutSession,
  webhook
};
