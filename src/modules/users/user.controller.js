import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";

const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT_ROUNDS || "10");
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// =======================
//   REGISTRO
// =======================
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email y password son requeridos" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const userExist = await prisma.user.findUnique({ where: { email: normalizedEmail }});
    if (userExist) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    let finalRole = "USER";

    // Solo un ADMIN puede crear otro ADMIN
    if (role === "ADMIN") {
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Sólo un administrador puede crear otro administrador" });
      }
      finalRole = "ADMIN";
    }

    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, password: hashed, role: finalRole }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error("[register] error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =======================
//   LOGIN
// =======================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Email y password son requeridos" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail }});
    if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({ 
      message: "Login correcto",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error("[login] error:", error);
    res.status(500).json({ message: "Error en servidor" });
  }
};

// =======================
//   PERFIL
// =======================
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    res.json(user);
  } catch (error) {
    console.error("[getProfile] error:", error);
    res.status(500).json({ message: "Error obteniendo perfil" });
  }
};

// =======================
//   ACTUALIZAR PERFIL
// =======================
export const updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const data = {};

    if (name) data.name = name.trim();
    if (email) data.email = email.toLowerCase().trim();
    if (password) data.password = await bcrypt.hash(password, SALT_ROUNDS);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error("[updateProfile] error:", error);
    res.status(500).json({ message: "Error actualizando perfil" });
  }
};
