import jwt from "jsonwebtoken";

export const tenantAuthMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Customer token required" });
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 🔴 VALIDACIÓN CLAVE
    if (payload.type !== "CUSTOMER") {
      return res.status(401).json({ message: "Invalid customer token" });
    }

    if (!payload.storeId) {
      return res.status(401).json({ message: "Customer token missing storeId" });
    }

    // guardar customer
    req.customer = {
      id: payload.sub,
      email: payload.email,
      storeId: payload.storeId
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid customer token" });
  }
};
