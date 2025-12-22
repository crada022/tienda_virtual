import jwt from "jsonwebtoken";

export function requireCustomerAuth(req, res, next) {
  const authHeader = req.headers.authorization;
 console.log("🔐 AUTH HEADER:", req.headers.authorization);
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Customer token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Soporta tokens con customerId o sub
    const customerId = payload.customerId || payload.sub;

    if (!customerId) {
      return res.status(401).json({ message: "Customer token required" });
    }

    req.customer = {
      id: customerId,
      email: payload.email,
      storeId: payload.storeId
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid customer token" });
  }
}
