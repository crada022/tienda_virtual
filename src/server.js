import express from "express";
import path from "path";
import authRoutes from "./modules/auth/auth.routes.js";
import paymentsRoutes from "./modules/payments/stripe.routes.js";
import * as stripeController from "./modules/payments/stripe.controller.js";

const app = express();

// Parse JSON body by default
app.use(express.json());

// Stripe webhook must receive raw body for signature verification on its route
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeController.webhook);

// servir static, etc.
// ...existing code...

// montar rutas API
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentsRoutes);

// ...existing code...
export default app;
// ...existing code...