import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import "../styles/publicStore.css";
import { getProductsPublic, getStorePublic } from "../api/storesApi";

export default function StoreProducts() {
  const { slug } = useParams(); // ✅ SLUG, no storeId

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    q: "",
    category: "",
    priceMin: "",
    priceMax: "",
    sort: ""
  });

  const [categories, setCategories] = useState([]);

  const getCategoryName = (p) =>
    p?.category?.name || p?.categoryName || "";

  /* =========================
     LOAD STORE + PRODUCTS
  ========================= */
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1️⃣ slug → tienda
        const storeData = await getStorePublic(slug);
        if (!storeData) throw new Error("Tienda no encontrada");

        // 2️⃣ tienda.id → productos
        const productsData = await getProductsPublic(storeData.id);

        if (!mounted) return;

        setStore(storeData);
        setAllProducts(productsData);
        setProducts(productsData);

        const cats = Array.from(
          new Set(
            productsData
              .map(p => getCategoryName(p).trim())
              .filter(Boolean)
          )
        );

        setCategories(cats);
      } catch (err) {
        console.error("Error cargando productos:", err);
        if (mounted) setError("No se pudieron cargar los productos");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [slug]);

  /* =========================
     FILTERS (CLIENT SIDE)
  ========================= */
  useEffect(() => {
    let source = allProducts;

    const filtered = source.filter((p) => {
      const q = filters.q.toLowerCase();
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.description?.toLowerCase().includes(q)
      ) return false;

      if (filters.category && getCategoryName(p) !== filters.category)
        return false;

      if (filters.priceMin && p.price < Number(filters.priceMin))
        return false;

      if (filters.priceMax && p.price > Number(filters.priceMax))
        return false;

      return true;
    });

    if (filters.sort === "price_asc")
      filtered.sort((a, b) => a.price - b.price);
    if (filters.sort === "price_desc")
      filtered.sort((a, b) => b.price - a.price);

    setProducts(filtered);
  }, [filters, allProducts]);

  /* =========================
     CART
  ========================= */
  function addToCart(p) {
    if (!store) return;

    const key = `store:${slug}:cart`;
    const cart = JSON.parse(localStorage.getItem(key) || "[]");

    const existing = cart.find(i => i.id === p.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...p, quantity: 1 });

    localStorage.setItem(key, JSON.stringify(cart));
    window.dispatchEvent(
      new CustomEvent("store-cart-updated", { detail: { storeId: store.id } })
    );
  }

  if (loading) return <div className="loader">Cargando productos…</div>;
  if (error) return <div className="no-products">{error}</div>;
  if (!products.length) return <div className="no-products">No hay productos.</div>;

  return (
    <div className="public-store">
      <PublicNavBar slug={slug} storeName={store.name} />
{/* =========================
    FILTROS
========================= */}
<div
  className="filters-bar"
  style={{
    maxWidth: 1200,
    margin: "18px auto",
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center"
  }}
>
  <input
    className="input"
    placeholder="Buscar productos..."
    value={filters.q}
    onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
    style={{ minWidth: 220 }}
  />

  <select
    className="input"
    value={filters.category}
    onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
  >
    <option value="">Todas las categorías</option>
    {categories.map((c) => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>

  <input
    className="input"
    type="number"
    placeholder="Precio mín"
    value={filters.priceMin}
    onChange={(e) => setFilters(f => ({ ...f, priceMin: e.target.value }))}
    style={{ width: 120 }}
  />

  <input
    className="input"
    type="number"
    placeholder="Precio máx"
    value={filters.priceMax}
    onChange={(e) => setFilters(f => ({ ...f, priceMax: e.target.value }))}
    style={{ width: 120 }}
  />

  <select
    className="input"
    value={filters.sort}
    onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
    style={{ width: 170 }}
  >
    <option value="">Ordenar por</option>
    <option value="newest">Más nuevos</option>
    <option value="price_asc">Precio: menor</option>
    <option value="price_desc">Precio: mayor</option>
  </select>

  <button
    className="btn btn-ghost"
    onClick={() =>
      setFilters({
        q: "",
        category: "",
        priceMin: "",
        priceMax: "",
        sort: ""
      })
    }
  >
    Limpiar
  </button>
</div>

      <div className="products-section">
        <h2>Productos — {store.name}</h2>

        <div className="products-grid">
          {products.map((p) => (
            <article className="product-card" key={p.id}>
              <img src={p.image || "/placeholder.png"} alt={p.name} />
              <h3>{p.name}</h3>
              <span>{getCategoryName(p) || "Sin categoría"}</span>
              <strong>${p.price} COP</strong>

              <div className="actions">
                <Link
                   to={`/store/${slug}/products/${p.id}`}
                  className="btn-outline"
                >
                  Ver
                </Link>
                <button onClick={() => addToCart(p)} className="btn-add">
                  Agregar
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
