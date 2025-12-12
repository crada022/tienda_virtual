import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStores } from "../api/services/storeService";
import { getProducts, addProduct, deleteProduct, getCategories, createCategory } from "../api/services/productService";

function ManageProducts() {
  const { storeId: routeStoreId } = useParams();
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);

  const [selectedStore, setSelectedStore] = useState(routeStoreId || "");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // <- agregado
  const [loading, setLoading] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    stock: 0,
    image: "",
    categoryId: "", // <- agregado
  });

  const [newCategory, setNewCategory] = useState("");

  // 1️⃣ Cargar tiendas del usuario
  useEffect(() => {
    async function loadStores() {
      const data = await getStores();
      setStores(data);
      setStoresLoading(false);
    }
    loadStores();
  }, []);

  // 2️⃣ Sincronizar la URL con selectedStore
  useEffect(() => {
    if (routeStoreId) {
      setSelectedStore(routeStoreId);
    }
  }, [routeStoreId]);

  // 3️⃣ Cuando cambie selectedStore, cargar productos y categorías
  useEffect(() => {
    if (!selectedStore) return;

    async function loadData() {
      setLoading(true);
      try {
        const [p, cats] = await Promise.all([
          getProducts(selectedStore),
          getCategories(selectedStore), // <- nueva llamada
        ]);
        setProducts(p);
        setCategories(cats);
      } catch {
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedStore]);

  const handleChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedStore) return alert("Selecciona una tienda primero");
    if (!newProduct.categoryId) return alert("Selecciona una categoría");

    try {
      const created = await addProduct(selectedStore, {
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
      });

      setProducts([created, ...products]);
      setNewProduct({ name: "", price: "", description: "", stock: 0, image: "", categoryId: "" });
    } catch (err) {
      console.error("Error creando producto:", err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("¿Eliminar producto?")) return;
    await deleteProduct(selectedStore, productId);
    setProducts(products.filter((p) => p.id !== productId));
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return alert("Ingresa nombre de categoría");
    try {
      const cat = await createCategory(selectedStore, newCategory.trim());
      setCategories([...categories, cat]);
      setNewCategory("");
    } catch (err) {
      alert("Error creando categoría: " + err.message);
    }
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title">Gestionar Productos</div>
          <div className="page-sub">Selecciona una tienda para administrar sus productos</div>
        </div>
      </header>

      {/* SELECTOR DE TIENDAS */}
      <section className="card" style={{ marginBottom: 20 }}>
        <label className="muted">Selecciona una Tienda</label>

        {storesLoading ? (
          <p className="muted">Cargando tiendas...</p>
        ) : (
          <select
            className="input"
            value={selectedStore}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedStore(value);
              navigate(`/stores/${value}/manage-products`);
            }}
          >
            <option value="">-- Seleccionar --</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </section>

      {!selectedStore ? (
        <h3 className="muted">Selecciona una tienda para continuar</h3>
      ) : (
        <>
          {/* FORMULARIO DE PRODUCTO */}
          <section className="card">
            <form onSubmit={handleAddProduct}>
              <div className="form-grid">
                <div className="form-row">
                  <label className="form-label form-label-required">Nombre</label>
                  <input className="input" name="name" value={newProduct.name} onChange={handleChange} required />
                </div>
                <div className="form-row">
                  <label className="form-label form-label-required">Categoría</label>
                  <select 
                    className="input" 
                    name="categoryId" 
                    value={newProduct.categoryId} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Seleccionar categoría --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label className="form-label form-label-required">Precio</label>
                  <input className="input" name="price" value={newProduct.price} onChange={handleChange} type="number" step="0.01" required />
                </div>
                <div className="form-row">
                  <label className="form-label">Stock</label>
                  <input className="input" name="stock" type="number" value={newProduct.stock} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <label className="form-label">Imagen URL</label>
                  <input className="input" name="image" value={newProduct.image} onChange={handleChange} />
                </div>
                <div className="form-row" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Descripción</label>
                  <textarea className="input" name="description" value={newProduct.description} onChange={handleChange} />
                </div>
              </div>

              <div style={{ marginTop: 12, justifyContent: "flex-end", display: "flex", gap: 10 }}>
                <button type="submit" className="btn btn-primary">
                  Agregar producto
                </button>
              </div>
            </form>
          </section>

          {/* NUEVA CATEGORÍA */}
          <section className="card" style={{ marginTop: 12 }}>
            <form onSubmit={handleAddCategory}>
              <div className="form-row">
                <label className="form-label">Nueva Categoría</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="input"
                    placeholder="Ej: Electrónica"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <button type="button" className="btn btn-primary" onClick={handleAddCategory}>
                    +
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* LISTADO */}
          <section style={{ marginTop: 12 }}>
            <div className="card">
              <h3>Productos de {stores.find((s) => s.id === selectedStore)?.name}</h3>
              <div className="muted">{loading ? "Cargando..." : `${products.length} productos`}</div>

              <div className="grid" style={{ marginTop: 12 }}>
                {products.map((p) => (
                  <article key={p.id} className="card product-card">
                    <div className="product-image">
                      {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%" }} /> : "Sin Imagen"}
                    </div>

                    <div>
                      <div className="product-title">{p.name}</div>
                      <div className="product-category">{p.category?.name ?? "Sin categoría"}</div>
                      <div className="product-desc">{p.description}</div>
                    </div>

                    <div className="product-meta">
                      <div>
                        <div className="product-price">${p.price}</div>
                        <div className="muted">stock: {p.stock}</div>
                      </div>

                      <button className="btn btn-danger" onClick={() => handleDeleteProduct(p.id)}>
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
 
}

export default ManageProducts;
