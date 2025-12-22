import express from "express";
import { resolveStore } from "../middleware/resolveTenant.js";
import * as cartService from "./cart.service.js";

const router = express.Router();

router.get("/:customerId", resolveStore, async (req, res) => {
  try {
    const cart = await cartService.getCartByCustomer(req.tenantPrisma, req.params.customerId);
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener carrito" });
  }
});

router.post("/:customerId/add", resolveStore, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const item = await cartService.addItemToCart(req.tenantPrisma, req.params.customerId, productId, quantity);
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al agregar item al carrito" });
  }
});

export default router;
