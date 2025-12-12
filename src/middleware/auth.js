import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ error: "Token missing" });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // ← el usuario queda aquí

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
  
};
