import express from "express";
import { createCheckoutSession, webhook } from "./stripe.controller.js";
import { resolveTenant } from "../middleware/resolveTenant.js";
import { tenantAuthMiddleware } from "../middleware/tenantAuth.middleware.js";

const router = express.Router();

/**
 * Crear sesión de pago Stripe (CUSTOMER)
 */
router.post(
  "/stripe/create-session",
  resolveTenant,
  tenantAuthMiddleware,
  createCheckoutSession
);

/**
 * Webhook Stripe (SIN auth)
 */
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  webhook
);

export default router;
