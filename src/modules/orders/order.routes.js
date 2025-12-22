import { Router } from "express";
import { resolveTenantPrisma } from "../middleware/resolveTenantPrisma.js";
import { tenantAuthMiddleware } from "../middleware/tenantAuth.middleware.js";

import {
  createOrderFromItems,
  getOrdersByCustomer,
  getOrderById
} from "./order.service.js";

const router = Router();

/**
 * POST /api/public/:slug/orders/create-from-items
 */
router.post(
  "/orders/create-from-items",
  resolveTenantPrisma,
  tenantAuthMiddleware,
  async (req, res) => {
    try {
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }

      const order = await createOrderFromItems(
        req,
        req.customer.id,
        items
      );

      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

/**
 * GET /api/public/:slug/orders
 */
router.get(
  "/orders",
  resolveTenantPrisma,
  tenantAuthMiddleware,
  async (req, res) => {
    const orders = await getOrdersByCustomer(req, req.customer.id);
    res.json(orders);
  }
);

/**
 * GET /api/public/:slug/orders/:id
 */
router.get(
  "/orders/:id",
  resolveTenantPrisma,
  tenantAuthMiddleware,
  async (req, res) => {
    const order = await getOrderById(
      req,
      Number(req.params.id),
      req.customer.id
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  }
);

export default router;
