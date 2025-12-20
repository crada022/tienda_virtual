import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStores, deleteStore } from "../api/services/storeService";
// import { getStores, deleteStore, updateStoreStatus } from "../api/services/storeService";
import { useStoreContext } from "../store/useStoreContext";
import { PUBLIC_STORE_URL } from "../config";
import "./StoresList.css";

export default function StoresList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const navigate = useNavigate();
  const { setCurrentStoreId } = useStoreContext();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const list = await getStores();
      
      let storesList = [];
      if (!Array.isArray(list)) {
        console.warn("getStores returned non-array:", list);
        storesList = Array.isArray(list?.stores) ? list.stores : [];
      } else {
        storesList = list;
      }

      // Inicializar isActive en true si no existe
      const storesWithStatus = storesList.map(store => ({
        ...store,
        isActive: store.isActive !== undefined ? store.isActive : true
      }));

      setStores(storesWithStatus);
    } catch (err) {
      console.error("Error loading stores:", err);
      setError("Error al cargar las tiendas. Por favor, intente nuevamente.");
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storeId, storeName) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la tienda "${storeName}"?\n\nEsta acción es irreversible y eliminará todos los productos asociados.`
    );
    
    if (!confirmed) return;

    setDeletingId(storeId);
    
    try {
      await deleteStore(storeId);
      setStores(prev => prev.filter(s => s.id !== storeId));
      
      // Mostrar notificación de éxito (opcional)
      alert(`✓ Tienda "${storeName}" eliminada exitosamente`);
    } catch (err) {
      console.error("Error deleting store:", err);
      alert("Error al eliminar la tienda. Por favor, intente nuevamente.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewStore = (storeId) => {
    window.open(`${PUBLIC_STORE_URL}/stores/${storeId}`, "_blank");
  };

  const handleManageProducts = (storeId) => {
    setCurrentStoreId(storeId);
    navigate(`/stores/${storeId}/manage-products`);
  };

  const handleEditStore = (storeId) => {
    navigate(`/stores/${storeId}/edit`);
  };

  const handleToggleActive = async (storeId, currentStatus) => {
    const store = stores.find(s => s.id === storeId);
    const newStatus = !currentStatus;
    
    // Actualizar estado local inmediatamente para mejor UX
    setStores(prev => prev.map(s => 
      s.id === storeId ? { ...s, isActive: newStatus } : s
    ));

    try {
      // TODO: Descomenta esta línea cuando agregues la función al servicio
      // await updateStoreStatus(storeId, newStatus);
      
      // Simulación temporal - ELIMINAR cuando conectes con el backend
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`✓ Tienda "${store.name}" ${newStatus ? 'activada' : 'desactivada'}`);
      
    } catch (err) {
      console.error("Error updating store status:", err);
      // Revertir cambio si falla
      setStores(prev => prev.map(s => 
        s.id === storeId ? { ...s, isActive: currentStatus } : s
      ));
      alert("Error al cambiar el estado de la tienda");
    }
  };

  // Filtrado de tiendas
  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && store.isActive) ||
                         (filterStatus === "inactive" && !store.isActive);
    
    return matchesSearch && matchesFilter;
  });

  // Estado de carga
  if (loading) {
    return (
      <div className="stores-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando tiendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stores-list-container">
      {/* Header */}
      <header className="stores-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Mis Tiendas</h1>
            <p className="page-subtitle">
              {stores.length} {stores.length === 1 ? 'tienda registrada' : 'tiendas registradas'}
            </p>
          </div>

          <button 
            className="btn-create-store" 
            onClick={() => navigate("/stores/create")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Crear tienda
          </button>
        </div>

        {/* Search and Filters */}
        {stores.length > 0 && (
          <div className="filters-bar">
            <div className="search-box">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                  aria-label="Limpiar búsqueda"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Todas
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => setFilterStatus('active')}
              >
                Activas
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
                onClick={() => setFilterStatus('inactive')}
              >
                Inactivas
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Error State */}
      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
          <button onClick={loadStores} className="retry-button">
            Reintentar
          </button>
        </div>
      )}

      {/* Content */}
      <section className="stores-content">
        {/* Empty State */}
        {stores.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3 className="empty-state-title">No tienes tiendas todavía</h3>
            <p className="empty-state-text">
              Crea tu primera tienda y comienza a vender en línea
            </p>
            <button 
              className="btn-create-store" 
              onClick={() => navigate("/stores/create")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Crear primera tienda
            </button>
          </div>
        )}

        {/* No Results State */}
        {filteredStores.length === 0 && stores.length > 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <h3 className="empty-state-title">No se encontraron resultados</h3>
            <p className="empty-state-text">
              Intenta ajustar los filtros o la búsqueda
            </p>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Stores Grid */}
        {filteredStores.length > 0 && (
          <div className="stores-grid">
            {filteredStores.map(store => (
              <article key={store.id} className="store-card">
                {/* Card Header */}
                <div className="store-card-header">
                  <div className="store-avatar">
                    {store.name?.slice(0, 2).toUpperCase() || "ST"}
                  </div>
                  
                  <div className="store-toggle-container">
                    <span className="toggle-label">
                      {store.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                    <label className="toggle-switch" title={store.isActive ? 'Desactivar tienda' : 'Activar tienda'}>
                      <input
                        type="checkbox"
                        checked={store.isActive ?? true}
                        onChange={() => handleToggleActive(store.id, store.isActive ?? true)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Card Body */}
                <div className="store-card-body">
                  <h3 className="store-card-title">{store.name}</h3>
                  <p className="store-card-description">
                    {store.description || "Sin descripción"}
                  </p>

                  <div className="store-card-info">
                    {store.email && (
                      <div className="info-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>{store.email}</span>
                      </div>
                    )}
                    
                    {store.phone && (
                      <div className="info-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>{store.phone}</span>
                      </div>
                    )}

                    {store.createdAt && (
                      <div className="info-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>Creada: {new Date(store.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="store-card-footer">
                  <button
                    className="action-btn secondary"
                    onClick={() => handleManageProducts(store.id)}
                    disabled={!store.isActive}
                    title={store.isActive ? "Gestionar productos" : "Activa la tienda para gestionar productos"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                    Productos
                  </button>

                  <button
                    className="action-btn secondary"
                    onClick={() => handleViewStore(store.id)}
                    disabled={!store.isActive}
                    title={store.isActive ? "Ver tienda pública" : "Activa la tienda para verla"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Ver
                  </button>

                  <button
                    className="action-btn primary"
                    onClick={() => handleEditStore(store.id)}
                    title="Editar tienda"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Editar
                  </button>

                  <button
                    className="action-btn danger"
                    onClick={() => handleDelete(store.id, store.name)}
                    disabled={deletingId === store.id}
                    title="Eliminar tienda"
                  >
                    {deletingId === store.id ? (
                      <svg className="spinner-small" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}