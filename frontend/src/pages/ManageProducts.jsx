import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProducts, addProduct, deleteProduct } from "../api/services/productService";

function ManageProducts() {
  const { storeId } = useParams();
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", stock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    getProducts(storeId).then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [storeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const created = await addProduct(storeId, { ...newProduct, price: Number(newProduct.price), stock: Number(newProduct.stock) });
      setProducts([created, ...products]);
      setNewProduct({ name: "", price: "", description: "", stock: 0 });
    } catch (err) {
      console.error("Error creando producto:", err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!productId) return;
    if (!confirm("¿Eliminar producto?")) return;
    try {
      await deleteProduct(storeId, productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Error al eliminar producto", err);
    }
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <div className="page-title">Gestionar Productos</div>
          <div className="page-sub">Tiendas / {storeId} — administra tus productos</div>
        </div>
        <div className="center">
          <button className="btn btn-primary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Nuevo producto</button>
        </div>
      </header>

      <section className="card">
        <form onSubmit={handleAddProduct}>
          <div className="form-grid">
            <div className="form-row">
              <label className="muted">Nombre</label>
              <input className="input" name="name" value={newProduct.name} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label className="muted">Precio</label>
              <input className="input" name="price" value={newProduct.price} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label className="muted">Stock</label>
              <input className="input" name="stock" value={newProduct.stock} onChange={handleChange} />
            </div>
            <div className="form-row">
              <label className="muted">Imagen (URL)</label>
              <input className="input" name="image" value={newProduct.image || ""} onChange={handleChange} />
            </div>
            <div style={{ gridColumn: "1 / -1" }} className="form-row">
              <label className="muted">Descripción</label>
              <textarea name="description" value={newProduct.description} onChange={handleChange} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="submit" className="btn btn-primary">Agregar producto</button>
            <button type="button" className="btn btn-ghost" onClick={() => setNewProduct({ name: "", price: "", description: "", stock: 0 })}>Limpiar</button>
          </div>
        </form>
      </section>

      <section style={{ marginTop: 12 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Productos</h3>
            <div className="muted">{loading ? "Cargando..." : `${products.length} productos`}</div>
          </div>

          <div style={{ marginTop: 12 }} className="grid">
            {products.map(p => (
              <article key={p.id} className="card product-card">
                <div className="product-image">{p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} /> : "SIN IMAGEN"}</div>
                <div>
                  <div className="product-title">{p.name}</div>
                  <div className="product-desc">{p.description}</div>
                </div>
                <div className="product-meta">
                  <div>
                    <div className="product-price">${p.price}</div>
                    <div className="muted">stock: {p.stock ?? 0}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost" onClick={() => alert("Actualizar: implementar modal/route")}>Editar</button>
                    <button className="btn btn-danger" onClick={() => handleDeleteProduct(p.id)}>Eliminar</button>
                    <button
  className="btn btn-primary"
  onClick={() => navigate(`/stores/${storeId}/ai/generate-products`)}
>
  Generar productos con IA
</button>

                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ManageProducts;
