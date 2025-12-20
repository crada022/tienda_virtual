import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./modules/users/user.routes.js";
import prisma from "./config/db.js";
import productRoutes from "./modules/product/product.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import storeRoutes from "./modules/store/store.routes.js"; 
import reviewRoutes from "./modules/review/review.routes.js";
import aiRoutes from "./modules/ai/ai.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import tenantAuthRoutes from "./modules/tenantAuth/tenantAuth.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import paymentsRoutes from "./modules/payments/stripe.routes.js";
import * as stripeController from "./modules/payments/stripe.controller.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import { resolveTenant } from './modules/middleware/resolveTenant.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-store-id", "x-store-domain"],
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
}));


const masked = process.env.JWT_SECRET ? `${process.env.JWT_SECRET.slice(0,4)}...${process.env.JWT_SECRET.slice(-4)}` : "<no-secret>";
app.use("/api/dashboard", dashboardRoutes);

// ⬇️ PRIMERO el parser de JSON
app.use(express.json());
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeController.webhook);

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/stores/:storeId/categories", categoriesRoutes);
app.use("/api", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stores/:storeId/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/stores", storeRoutes);
app.get("/", (req, res) => res.send("tutiendavirtual backend OK"));
app.use("/api/ai", aiRoutes);
app.use("/api/stores/:storeId/chat", (req, res, next) => {
  // permitir que chat.routes reciba req.params.storeId (mergeParams ya habilitado)
  next();
});
// monta la ruta (asegúrate de hacerlo antes/ después según tu orden de middlewares)
app.use("/api/stores/:storeId/chat", chatRoutes);
app.use("/api/stores/:storeId/auth", tenantAuthRoutes);
// Healthcheck
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
