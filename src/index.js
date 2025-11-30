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

dotenv.config();

const app = express();
app.use(cors());

// ⬇️ PRIMERO el parser de JSON
app.use(express.json());

// ⬇️ DESPUÉS cualquier middleware que use req.body
app.use((req, res, next) => {
  console.log("Middleware global BODY:", req.body);
  next();
});

// Rutas
app.use("/api", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/stores", storeRoutes);
app.get("/", (req, res) => res.send("tutiendavirtual backend OK"));
app.use("/api/ai", aiRoutes);
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
