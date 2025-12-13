import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PublicNavBar from "../components/PublicNavBar";
import "../styles/publicStore.css";
import { getProductsPublic, getStorePublic } from "../api/storesApi";

export default function StoreProducts() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // fuente original para filtrar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ q: "", category: "", priceMin: "", priceMax: "", sort: "" });
  const [categories, setCategories] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);

  
  const getCategoryName = (p) => {
    if (!p) return "";
    // cuando backend incluye la relación: { category: { name: "..." } }
    if (p.category && typeof p.category === "object") return p.category.name ?? "";
    // cuando backend devuelve solo un string o un campo separado
    if (typeof p.category === "string") return p.category;
    if (typeof p.categoryName === "string") return p.categoryName;
    return "";
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // obtener productos + tienda
        const [allProducts, s] = await Promise.all([
          getProductsPublic(storeId),
          getStorePublic(storeId).catch(() => null)
        ]);

        // Si la API no incluye category, intentar obtener listado de categorías públicas
        let categoriesById = {};
        // intenta varios endpoints públicos de categorías (fallback /api/... y /stores/...)
        const tryPaths = [
          `/api/stores/${storeId}/categories`,
          `/stores/${storeId}/categories`,
        ];
        for (const path of tryPaths) {
          try {
            const resp = await fetch(path);
            if (resp.ok) {
              const cats = await resp.json();
              categoriesById = Object.fromEntries(cats.map(c => [String(c.id), c.name]));
              break;
            }
          } catch (e) {
            // continuar al siguiente path
          }
        }
        if (!Object.keys(categoriesById).length) {
          // último recurso: si el backend devuelve alguna categoría embebida en productos privados
          // intentar extraer nombres únicos desde allProducts si existen objetos category
          const inline = allProducts
            .map(p => (p.category && typeof p.category === "object" ? p.category : null))
            .filter(Boolean);
          if (inline.length) {
            categoriesById = Object.fromEntries(inline.map(c => [String(c.id), c.name]));
          }
        }

        // inyectar category cuando falte
        const enriched = allProducts.map(p => {
          if (!p.category && p.categoryId && categoriesById[String(p.categoryId)]) {
            return { ...p, category: { id: p.categoryId, name: categoriesById[String(p.categoryId)] } };
          }
          return p;
        });

        if (!mounted) return;
        setStore(s);
        setAllProducts(enriched);
        setProducts(enriched);
        const cats = Array.from(new Set(enriched.map(p => (getCategoryName(p) || "").trim()).filter(Boolean)));
        setCategories(cats);
      } catch (err) {
        console.error("Error cargando productos:", err);
        setError(err.message || "Error cargando productos");
        setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [storeId]);

  // refetch cuando cambian filtros (debounced)
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        // Si ya tenemos productos cargados, filtrar en cliente para respuesta instantánea
        let source = allProducts;
        if (!source || source.length === 0) {
          // fallback: pedir al backend si no hay datos locales
          source = await getProductsPublic(storeId);
          setAllProducts(source);
        }

        const filtered = source.filter((p) => {
          const q = (filters.q || "").toLowerCase().trim();
          if (q) {
            const matchesText =
              String(p.name || "").toLowerCase().includes(q) ||
              String(p.description || "").toLowerCase().includes(q) ||
              String(getCategoryName(p) || "").toLowerCase().includes(q);
            if (!matchesText) return false;
          }
          if (filters.category) {
            if ((getCategoryName(p) || "") !== filters.category) return false;
          }
          if (filters.priceMin !== "") {
            const min = Number(filters.priceMin);
            if (!Number.isNaN(min) && (Number(p.price) || 0) < min) return false;
          }
          if (filters.priceMax !== "") {
            const max = Number(filters.priceMax);
            if (!Number.isNaN(max) && (Number(p.price) || 0) > max) return false;
          }
          return true;
        });

        // ordenar
        const sorted = filtered.slice();
        if (filters.sort === "newest") {
          sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (filters.sort === "price_asc") {
          sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        } else if (filters.sort === "price_desc") {
          sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        }

        setProducts(sorted);
        setError(null);
      } catch (err) {
        console.error("Error filtrando productos:", err);
        setError(err.message || "Error filtrando productos");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    setDebounceTimer(t);
    return () => clearTimeout(t);
  }, [storeId, filters, allProducts]);

  function addToCart(p) {
    const key = `store:${storeId}:cart`;
    const cart = JSON.parse(localStorage.getItem(key) || "[]");
    const existing = cart.find((c) => c.id === p.id);
    if (existing) existing.quantity = (existing.quantity || 1) + 1;
    else cart.push({ ...p, quantity: 1 });
    localStorage.setItem(key, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("store-cart-updated", { detail: { storeId } }));
  }

  function handleFilterChange(changes) {
    setFilters(prev => ({ ...prev, ...changes }));
  }

  if (loading) return <div className="loader">Cargando productos…</div>;
  if (error) return <div className="no-products">Error cargando productos: {error}</div>;
  if (!products.length) return <div className="no-products">No hay productos disponibles.</div>;

  return (
    <div className="public-store">
      <PublicNavBar storeId={storeId} storeName={store?.name} />

      <div className="filters-bar" style={{ maxWidth: 1200, margin: "18px auto 6px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input className="input" placeholder="Buscar productos..." value={filters.q} onChange={(e) => handleFilterChange({ q: e.target.value })} style={{ minWidth: 220 }} />
        <select className="input" value={filters.category} onChange={(e) => handleFilterChange({ category: e.target.value })}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input" type="number" placeholder="Precio min" value={filters.priceMin} onChange={(e) => handleFilterChange({ priceMin: e.target.value })} style={{ width: 110 }} />
        <input className="input" type="number" placeholder="Precio max" value={filters.priceMax} onChange={(e) => handleFilterChange({ priceMax: e.target.value })} style={{ width: 110 }} />
        <select className="input" value={filters.sort} onChange={(e) => handleFilterChange({ sort: e.target.value })} style={{ width: 160 }}>
          <option value="">Orden por</option>
          <option value="newest">Más nuevos</option>s
          <option value="price_asc">Precio: menor</option>
          <option value="price_desc">Precio: mayor</option>
        </select>
        <button className="btn btn-ghost" onClick={() => setFilters({ q: "", category: "", priceMin: "", priceMax: "", sort: "" })}>Limpiar</button>
      </div>

      <div className="products-section" style={{ maxWidth: 1200, margin: "18px auto" }}>
        <h2>Productos {store ? `— ${store.name}` : ""}</h2>
        <div className="products-grid">
          {products.map((p) => (
            <article className="product-card" key={p.id}>
              <img src={p.image || p.imageUrl || "/placeholder.png"} alt={p.name} />
              <h3 className="product-title">{p.name}</h3>
              <div className="product-category">{getCategoryName(p) || "Sin categoría"}</div>
              <div className="price">{(p.price ?? 0).toFixed(2)} COP</div>
              <p className="desc">{p.description}</p>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <Link to={`/stores/${storeId}/products/${p.id}`} className="btn-outline">Ver</Link>
                <button className="btn-add" onClick={() => addToCart(p)}>Agregar</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}