import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore
} from "./store.controller.js";

const router = Router();

router.post("/", requireAuth, createStore);
router.get("/", requireAuth, getStores);
router.get("/:id", requireAuth, getStoreById);
router.put("/:id", requireAuth, updateStore);
router.delete("/:id", requireAuth, deleteStore);

export default router;
