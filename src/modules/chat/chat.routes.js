import express from "express";
import { postChat } from "./chat.controller.js";

const router = express.Router({ mergeParams: true });

router.post("/", postChat);

export default router;