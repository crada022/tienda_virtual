import { Router } from "express";
import { tenantAuthMiddleware } from "../middleware/tenantAuth.middleware.js";
import {
  createOrderFromItems,
  getOrdersByCustomer,
  getOrderById
} from "../orders/order.service.js";

const router = Router({ mergeParams: true });

/* =========================
   PUBLIC STORE INFO
========================= */
router.get("/", async (req, res) => {
  const store = req.store;

  res.json({
    id: store.id,
    name: store.name,
    description: store.description,
    bannerUrl: store.bannerUrl,
    colorTheme: store.colorTheme,
    layoutType: store.layoutType,
    style: store.style,
    slug: store.slug,
    domain: store.domain
  });
});

/* =========================
   CREATE ORDER (CUSTOMER)
========================= */
router.post(
  "/orders/create-from-items",
  tenantAuthMiddleware,
  async (req, res) => {
    try {
      const { items, billing } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }

      const order = await createOrderFromItems(
        req,
        req.customer.id,
        items,
        billing
      );

      res.status(201).json(order);
    } catch (err) {
      console.error("[public.createOrder]", err);
      res.status(400).json({ message: err.message });
    }
  }
);

/* =========================
   LIST MY ORDERS
========================= */
router.get(
  "/orders",
  tenantAuthMiddleware,
  async (req, res) => {
    const orders = await getOrdersByCustomer(
      req,
      req.customer.id
    );
    res.json(orders);
  }
);

/* =========================
   GET ORDER BY ID
========================= */
router.get(
  "/orders/:id",
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
