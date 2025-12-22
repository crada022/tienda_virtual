export function storeContext(req, res, next) {
  const host = req.headers.host;

  if (!host) {
    return res.status(400).json({ error: "Host no encontrado" });
  }

  // Quita puerto
  const domain = host.split(":")[0].toLowerCase();

  req.storeDomain = domain;
  next();
}
