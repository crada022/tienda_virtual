import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import prisma from "./config/db.js";

// Middlewares
import { resolveStore } from "./modules/middleware/resolveTenant.js";
import { storeContext } from "./middleware/storeContext.js";

// Rutas
import authRoutes from "./modules/auth/auth.routes.js";
import tenantAuthRoutes from "./modules/tenantAuth/tenantAuth.routes.js";
import publicStoreRoutes from "./modules/store/store.public.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import paymentsRoutes from "./modules/payments/stripe.routes.js";
import * as stripeController from "./modules/payments/stripe.controller.js";

// Admin / platform
import userRoutes from "./modules/users/user.routes.js";
import storeRoutes from "./modules/store/store.routes.js";
import productRoutes from "./modules/product/product.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";

dotenv.config();

const app = express();

/* =========================
   CORS
========================= */
app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-store-id",
      "x-store-domain"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
);

/* =========================
   WEBHOOK STRIPE (RAW)
========================= */
app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeController.webhook
);

/* =========================
   PARSERS
========================= */
app.use(express.json());
app.use(storeContext);

/* =========================
   DASHBOARD (ADMIN)
========================= */
app.use("/api/dashboard", dashboardRoutes);

/* =========================
   🌍 RUTAS PÚBLICAS DE TIENDA (CON SLUG)
========================= */

// Auth del customer (login / me)
app.use(
  "/api/public/:slug/auth",
  resolveStore,
  tenantAuthRoutes
);

// Info pública de la tienda
app.use(
  "/api/public/:slug",
  resolveStore,
  publicStoreRoutes
);

// 🔥 ÓRDENES (AQUÍ ESTABA EL ERROR ANTES)
app.use(
  "/api/public/:slug",
  resolveStore,
  orderRoutes
);

/* =========================
   💳 PAGOS (SIN resolveStore)
========================= */
app.use("/api/payments", paymentsRoutes);

/* =========================
   🔐 AUTH GLOBAL
========================= */
app.use("/api/auth", authRoutes);

/* =========================
   🧠 PLATFORM / ADMIN
========================= */
app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/stores/:storeId/categories", categoriesRoutes);
app.use("/api", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/ai", aiRoutes);

// Chat por tienda (admin)
app.use("/api/stores/:storeId/chat", chatRoutes);
app.use("/api/stores/:storeId/auth", tenantAuthRoutes);

/* =========================
   HEALTHCHECK
========================= */
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.send("tutiendavirtual backend OK");
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
