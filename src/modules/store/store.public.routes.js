import { Router } from "express";

const router = Router();

// 🔥 store YA viene en req.store gracias a resolveStore
router.get("/", async (req, res) => {
  const store = req.store;

  res.json({
    id: store.id,
    name: store.name,
    description: store.description,
    bannerUrl: store.bannerUrl,
    colorTheme: store.colorTheme,
    layoutType: store.layoutType,
    style: store.style,
    slug: store.slug,
    domain: store.domain
  });
});

export default router;
