import { Router } from "express";
import { resolveTenant } from "../middleware/resolveTenant.js";
import { tenantAuthMiddleware } from "../middleware/tenantAuth.middleware.js";



import {
  createOrderFromCart,
  createOrderFromItems,
  getOrdersByCustomer,
  getOrderById
} from "./order.service.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  tenantAuthMiddleware,
  resolveTenant,
  async (req, res) => {
    try {
      const order = await createOrderFromCart(req, req.customer.id);
      res.json(order);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.post(
  "/create-from-items",
  tenantAuthMiddleware,
  resolveTenant,
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
      res.json(order);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.get(
  "/",
  resolveTenant,
  tenantAuthMiddleware,
  async (req, res) => {
    const orders = await getOrdersByCustomer(req, req.customer.id);
    res.json(orders);
  }
);

router.get(
  "/:id",
  resolveTenant,
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
