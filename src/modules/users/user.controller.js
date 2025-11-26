import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";

// =======================
//   REGISTRO
// =======================
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExist = await prisma.user.findUnique({ where: { email }});
    if (userExist) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    let finalRole = "USER";

    // Solo permitir crear ADMIN si el usuario actual es ADMIN
    if (role === "ADMIN") {
      if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Sólo un administrador puede crear otro administrador" });
      }
      finalRole = "ADMIN";
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: finalRole
      },
    });

    res.json(user);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



// =======================
//   LOGIN
// =======================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Contraseña incorrecta" });

    // incluir role en el token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      message: "Login correcto", 
      token,
      role: user.role 
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error en servidor" });
  }
};
export const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });
  res.json(user);
};

export const updateProfile = async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: req.body
  });

  res.json(user);
};
