import express from "express";
import { postRegister, postLogin, getMe } from "./tenantAuth.controller.js";

const router = express.Router({ mergeParams: true });

router.post("/register", postRegister);
router.post("/login", postLogin);
router.get("/me", getMe);

export default router;