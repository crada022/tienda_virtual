import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStores } from "../api/services/storeService";
import { 
  getProducts, 
  addProduct, 
  deleteProduct, 
  getCategories, 
  createCategory 
} from "../api/services/productService";
import "../styles/ManageProducts.css";

export default function ManageProducts() {
  const { storeId: routeStoreId } = useParams();
  const navigate = useNavigate();

  // Estados principales
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(routeStoreId || "");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Estados del formulario
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    stock: 0,
    image: "",
    categoryId: "",
  });
  const [errors, setErrors] = useState({});
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Estados de UI
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // 1️⃣ Cargar tiendas
  useEffect(() => {
    async function loadStores() {
      try {
        const data = await getStores();
        setStores(Array.isArray(data) ? data : data.stores || []);
      } catch (err) {
        console.error("Error loading stores:", err);
        setStores([]);
      } finally {
        setStoresLoading(false);
      }
    }
    loadStores();
  }, []);

  // 2️⃣ Sincronizar URL con selectedStore
  useEffect(() => {
    if (routeStoreId) {
      setSelectedStore(routeStoreId);
    }
  }, [routeStoreId]);

  // 3️⃣ Cargar productos y categorías cuando cambia la tienda
  useEffect(() => {
    if (!selectedStore) return;

    async function loadData() {
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(selectedStore),
          getCategories(selectedStore),
        ]);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        console.error("Error loading data:", err);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedStore]);

  // Validación del formulario
  const validateProduct = () => {
    const newErrors = {};

    if (!newProduct.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (!newProduct.categoryId) {
      newErrors.categoryId = "Selecciona una categoría";
    }

    if (!newProduct.price || Number(newProduct.price) <= 0) {
      newErrors.price = "El precio debe ser mayor a 0";
    }

    if (newProduct.stock < 0) {
      newErrors.stock = "El stock no puede ser negativo";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!selectedStore) {
      alert("Selecciona una tienda primero");
      return;
    }

    const formErrors = validateProduct();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      const created = await addProduct(selectedStore, {
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
      });

      setProducts([created, ...products]);
      setNewProduct({ 
        name: "", 
        price: "", 
        description: "", 
        stock: 0, 
        image: "", 
        categoryId: "" 
      });
      setErrors({});
      alert("✓ Producto agregado exitosamente");
    } catch (err) {
      console.error("Error creando producto:", err);
      alert("Error al crear el producto. Intenta nuevamente.");
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el producto "${productName}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmed) return;

    setDeletingId(productId);
    try {
      await deleteProduct(selectedStore, productId);
      setProducts(products.filter((p) => p.id !== productId));
      alert(`✓ Producto "${productName}" eliminado`);
    } catch (err) {
      console.error("Error eliminando producto:", err);
      alert("Error al eliminar el producto. Intenta nuevamente.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      alert("Ingresa un nombre para la categoría");
      return;
    }

    try {
      const cat = await createCategory(selectedStore, newCategory.trim());
      setCategories([...categories, cat]);
      setNewCategory("");
      setShowCategoryForm(false);
      alert(`✓ Categoría "${cat.name}" creada`);
    } catch (err) {
      console.error("Error creando categoría:", err);
      alert("Error al crear la categoría: " + err.message);
    }
  };

  const handleStoreChange = (value) => {
    setSelectedStore(value);
    if (value) {
      navigate(`/stores/${value}/manage-products`);
    }
  };

  // Filtrado y ordenamiento
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || product.categoryId === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "stock":
          return b.stock - a.stock;
        default: // newest
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  const selectedStoreData = stores.find((s) => s.id === selectedStore);

  return (
    <div className="manage-products-container">
      {/* Header */}
      <header className="products-header">
        <div className="header-content">
          <button 
            onClick={() => navigate("/stores/list")} 
            className="back-button"
            aria-label="Volver a tiendas"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div>
            <h1 className="page-title">Gestionar Productos</h1>
            <p className="page-subtitle">
              {selectedStoreData 
                ? `Administra los productos de ${selectedStoreData.name}`
                : "Selecciona una tienda para administrar sus productos"}
            </p>
          </div>
        </div>
      </header>

      {/* Store Selector */}
      <section className="store-selector-card">
        <div className="selector-content">
          <div className="selector-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </div>
          <div className="selector-input-wrapper">
            <label htmlFor="store-select" className="selector-label">
              Selecciona una tienda
            </label>
            {storesLoading ? (
              <div className="loading-text">Cargando tiendas...</div>
            ) : (
              <select
                id="store-select"
                className="store-select"
                value={selectedStore}
                onChange={(e) => handleStoreChange(e.target.value)}
              >
                <option value="">-- Seleccionar tienda --</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {!selectedStore ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </div>
          <h3 className="empty-state-title">Selecciona una tienda</h3>
          <p className="empty-state-text">
            Elige una tienda del selector para comenzar a gestionar sus productos
          </p>
        </div>
      ) : (
        <>
          {/* Add Product Form */}
          <section className="product-form-card">
            <div className="form-header">
              <h2 className="form-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Agregar nuevo producto
              </h2>
            </div>

            <form onSubmit={handleAddProduct}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Nombre del producto <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newProduct.name}
                    onChange={handleChange}
                    className={`form-input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ej: Laptop Dell XPS"
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="categoryId" className="form-label">
                    Categoría <span className="required">*</span>
                  </label>
                  <div className="category-select-wrapper">
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={newProduct.categoryId}
                      onChange={handleChange}
                      className={`form-input ${errors.categoryId ? 'input-error' : ''}`}
                    >
                      <option value="">-- Seleccionar categoría --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(!showCategoryForm)}
                      className="add-category-btn"
                      title="Agregar nueva categoría"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                  {errors.categoryId && <span className="error-text">{errors.categoryId}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="price" className="form-label">
                    Precio <span className="required">*</span>
                  </label>
                  <div className="input-with-icon">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={newProduct.price}
                      onChange={handleChange}
                      className={`form-input with-prefix ${errors.price ? 'input-error' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {errors.price && <span className="error-text">{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="stock" className="form-label">
                    Stock disponible
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={newProduct.stock}
                    onChange={handleChange}
                    className={`form-input ${errors.stock ? 'input-error' : ''}`}
                    placeholder="0"
                    min="0"
                  />
                  {errors.stock && <span className="error-text">{errors.stock}</span>}
                </div>

                <div className="form-group full-width">
                  <label htmlFor="image" className="form-label">
                    URL de la imagen
                  </label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={newProduct.image}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description" className="form-label">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newProduct.description}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Describe las características del producto..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Agregar producto
                </button>
              </div>
            </form>
          </section>

          {/* Category Form (Collapsible) */}
          {showCategoryForm && (
            <section className="category-form-card">
              <div className="category-form-header">
                <h3>Nueva Categoría</h3>
                <button
                  onClick={() => setShowCategoryForm(false)}
                  className="close-btn"
                  aria-label="Cerrar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddCategory} className="category-form">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre de la categoría (Ej: Electrónica)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button type="submit" className="btn-primary">
                  Crear categoría
                </button>
              </form>
            </section>
          )}

          {/* Filters and Search */}
          {products.length > 0 && (
            <section className="filters-section">
              <div className="search-box">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <select
                className="filter-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Más recientes</option>
                <option value="name">Nombre (A-Z)</option>
                <option value="price-asc">Precio (menor a mayor)</option>
                <option value="price-desc">Precio (mayor a menor)</option>
                <option value="stock">Stock disponible</option>
              </select>
            </section>
          )}

          {/* Products List */}
          <section className="products-section">
            <div className="products-header-info">
              <h2 className="section-title">
                Productos {selectedStoreData && `de ${selectedStoreData.name}`}
              </h2>
              <span className="products-count">
                {loading ? "Cargando..." : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Cargando productos...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-products">
                <div className="empty-products-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                </div>
                <h3>No hay productos todavía</h3>
                <p>Agrega tu primer producto usando el formulario de arriba</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="product-card">
                    <div className="product-image-wrapper">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="product-image"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="product-image-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        </div>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="stock-badge low">Poco stock</span>
                      )}
                      {product.stock === 0 && (
                        <span className="stock-badge out">Agotado</span>
                      )}
                    </div>

                    <div className="product-body">
                      <div className="product-category-badge">
                        {product.category?.name || "Sin categoría"}
                      </div>
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">
                        {product.description || "Sin descripción"}
                      </p>
                    </div>

                    <div className="product-footer">
                      <div className="product-info">
                        <div className="product-price">${Number(product.price).toFixed(2)}</div>
                        <div className="product-stock">
                          Stock: <span className={product.stock === 0 ? 'out-of-stock' : ''}>{product.stock}</span>
                        </div>
                      </div>

                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        disabled={deletingId === product.id}
                        title="Eliminar producto"
                      >
                        {deletingId === product.id ? (
                          <svg className="spinner-small" width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Eliminar
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}