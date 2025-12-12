import express from "express";
import { getMe, updateMe, changePassword, register, login } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);           // <-- nueva ruta de login
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);
router.post("/change-password", requireAuth, changePassword);

export default router;