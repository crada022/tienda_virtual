import express from "express";
import { createCheckoutSession } from "./stripe.controller.js";

const router = express.Router();

// POST /api/payments/stripe/create-session
router.post("/stripe/create-session", createCheckoutSession);

export default router;
