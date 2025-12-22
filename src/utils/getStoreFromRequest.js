import { platformPrisma } from "../config/db.js";

export async function getStoreFromRequest(req) {
  if (!req.storeDomain) return null;

  return prisma.store.findUnique({
    where: { domain: req.storeDomain }
  });
}
