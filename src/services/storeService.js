// 1️⃣ Validar dominio (único)
const existingDomain = await prisma.store.findUnique({
  where: { domain: cleanDomain }
});
if (existingDomain) {
  return res.status(409).json({ message: "Dominio ya en uso" });
}

// 2️⃣ Validar slug (único)
const existingSlug = await prisma.store.findUnique({
  where: { slug: storeSlug }
});
if (existingSlug) {
  return res.status(409).json({ message: "Slug ya en uso" });
}

// 3️⃣ (Opcional) advertir nombre repetido
const existingName = await prisma.store.findFirst({
  where: { name: storeName }
});
