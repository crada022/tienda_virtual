// src/routes/admin.routes.js
import express from "express";
import { platformPrisma } from "../prisma/platform.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// 1️⃣ Crear usuario ADMIN
router.post("/create", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y password son requeridos" });
    }

    // Hash de password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await platformPrisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "ADMIN", // <-- nuevo usuario siempre admin
      },
    });

    res.status(201).json({ message: "Usuario creado como ADMIN", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando usuario" });
  }
});

// 2️⃣ Convertir usuarios existentes a ADMIN
router.post("/upgrade-all", async (req, res) => {
  try {
    const updated = await platformPrisma.user.updateMany({
      data: { role: "ADMIN" },
    });

    res.status(200).json({ message: `Usuarios actualizados: ${updated.count}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando usuarios" });
  }
});

export default router;
