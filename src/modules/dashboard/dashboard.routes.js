import { Router } from "express";
import { getDashboardStats } from "./dashboard.controller.js";
import { requireAuth } from "../../middleware/auth.js"; 

const router = Router();

router.get("/stats", requireAuth, getDashboardStats);

export default router;
