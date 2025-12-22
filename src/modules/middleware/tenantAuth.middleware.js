import jwt from "jsonwebtoken";
export const tenantAuthMiddleware = (req, res, next) => {
  
 console.log("🔥 TENANT AUTH MIDDLEWARE HIT");
  console.log("PATH:", req.originalUrl);
  console.log("AUTH HEADER:", req.headers.authorization);
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    console.log("❌ IF 1 EJECUTADO");
    return res.status(401).json({ message: "Customer token required" });
  }

  const token = auth.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    console.log("JWT PAYLOAD:", payload);

    if (payload.type !== "CUSTOMER") {
      console.log("❌ NO ES CUSTOMER");
      return res.status(401).json({ message: "Invalid customer token" });
    }

    if (!payload.storeId) {
      console.log("❌ SIN STORE ID");
      return res.status(401).json({ message: "Customer token missing storeId" });
    }

    req.customer = {
      id: payload.sub,
      email: payload.email,
      storeId: payload.storeId
    };

    next();
  } catch (err) {
    console.error("❌ JWT ERROR:", err.message);
    return res.status(401).json({ message: "Invalid customer token" });
  }
};
