import Stripe from "stripe";
import { platformPrisma, createTenantPrisma } from "../../config/db.js";

const stripeSecret =
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY;

if (!stripeSecret) {
  console.warn("[stripe] Stripe secret key not configured");
}

const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2022-11-15" })
  : null;

/**
 * =========================
 * CREAR SESIÓN DE CHECKOUT
 * =========================
 * - NO usa req.tenantPrisma
 * - NO busca Order en PLATFORM
 * - Usa storeId desde el token (tenantAuthMiddleware)
 */
export async function createCheckoutSession(req, res) {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe no configurado" });
    }

    const { orderId, successUrl, cancelUrl } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId es requerido" });
    }

    // 🔑 STORE DESDE EL TOKEN (CUSTOMER)
    const storeId = req.customer?.storeId;
    if (!storeId) {
      return res.status(401).json({ error: "storeId no encontrado en token" });
    }

    // 1️⃣ Obtener store desde PLATFORM
    const store = await platformPrisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      return res.status(404).json({ error: "Store no encontrado" });
    }

    // 2️⃣ Crear Prisma del TENANT
    const tenantPrisma = createTenantPrisma(store.dbName);

    // 3️⃣ Obtener orden REAL del tenant
    const order = await tenantPrisma.order.findUnique({
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

    // 4️⃣ Construir line_items (precio SOLO backend)
    const line_items = order.items.map(item => ({
      price_data: {
        currency: "cop",
        product_data: {
          name: item.product?.name || `Producto ${item.productId}`
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    // 5️⃣ Crear sesión Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url:
        successUrl ||
         `${process.env.FRONTEND_URL}/store/${store.slug}/checkout/success`,
      cancel_url:
        cancelUrl ||
        `${process.env.FRONTEND_URL}/store/${store.slug}/checkout/cancel`,
      metadata: {
        orderId: String(order.id),
        storeId
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
 * - Marca la orden como PAID
 * - Usa metadata (orderId + storeId)
 */
export async function webhook(req, res) {
  try {
    if (!stripe) {
      return res.json({ received: true });
    }

    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } else {
      event =
        typeof req.body === "string"
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

      // 1️⃣ Obtener store desde PLATFORM
      const store = await platformPrisma.store.findUnique({
        where: { id: storeId }
      });

      if (!store) {
        console.error("[stripe.webhook] Store no encontrado");
        return res.json({ received: true });
      }

      // 2️⃣ Crear Prisma del TENANT
      const tenantPrisma = createTenantPrisma(store.dbName);

      // 3️⃣ Marcar orden como PAGADA
      await tenantPrisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" }
      });

      console.log(
        "[stripe.webhook] Orden marcada como PAID:",
        orderId
      );
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("[stripe.webhook]", err);
    return res.status(500).send("Webhook error");
  }
}
