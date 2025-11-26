export const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Autenticación requerida" });
  if (req.user.role !== "ADMIN") return res.status(403).json({ message: "Requiere rol admin" });
  next();
};
