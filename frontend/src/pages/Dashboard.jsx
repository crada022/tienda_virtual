import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { getDashboardStats } from "../api/services/dashboardService";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "Usuario", email: "usuario@ejemplo.com" });
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalSales: 0,
    monthlyGrowth: 0
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

useEffect(() => {
  const loadStats = async () => {
    const data = await getDashboardStats();
    setStats(data);
  };
  loadStats();
}, []);


  const handleCreateStore = () => {
    navigate("/stores/create");
  };

  const handleViewStores = () => {
    navigate("/stores/list");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
    

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${!sidebarOpen ? 'sidebar-hidden' : ''}`}>
          <nav className="sidebar-nav">
            <a href="#dashboard" className="nav-item active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="20" x2="12" y2="10"></line>
                <line x1="18" y1="20" x2="18" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="16"></line>
              </svg>
              Dashboard
            </a>
            <a href="#stores" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              Mis Tiendas
            </a>
            <a href="#products" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              Productos
            </a>
            <a href="#settings" className="nav-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m6-12l-3 3m-6 6l-3 3m12 0l-3-3m-6-6l-3-3"></path>
              </svg>
              Configuración
            </a>
            <button onClick={handleLogout} className="nav-item logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Cerrar Sesión
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`dashboard-main ${sidebarOpen ? 'with-sidebar' : ''}`}>
          <div className="main-container">
            {/* Welcome Section */}
            <div className="welcome-section">
              <h2 className="welcome-title">
                Bienvenido de nuevo, {user.name.split(' ')[0]} 👋
              </h2>
              <p className="welcome-subtitle">
                Aquí está el resumen de tu negocio hoy
              </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-inner">
                  <div className="stat-content">
                    <p className="stat-label">Total de Tiendas</p>
                    <h3 className="stat-value">{stats.totalStores}</h3>
                  </div>
                  <div className="stat-icon blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-inner">
                  <div className="stat-content">
                    <p className="stat-label">Tiendas Activas</p>
                    <h3 className="stat-value">{stats.activeStores}</h3>
                  </div>
                  <div className="stat-icon green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-inner">
                  <div className="stat-content">
                    <p className="stat-label">Ventas Totales</p>
                    <h3 className="stat-value">${stats.totalSales.toLocaleString()}</h3>
                    <div className="stat-change">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                      <span className="stat-change-value">+{stats.monthlyGrowth}%</span>
                      <span className="stat-change-label">vs mes anterior</span>
                    </div>
                  </div>
                  <div className="stat-icon purple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <line x1="12" y1="20" x2="12" y2="10"></line>
                      <line x1="18" y1="20" x2="18" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="16"></line>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-inner">
                  <div className="stat-content">
                    <p className="stat-label">Productos</p>
                    <h3 className="stat-value">48</h3>
                  </div>
                  <div className="stat-icon orange">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h3 className="section-title">Acciones Rápidas</h3>
              <div className="quick-actions-grid">
                <button onClick={handleCreateStore} className="quick-action-card primary">
                  <div className="quick-action-inner">
                    <div className="quick-action-icon primary">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                    <div className="quick-action-content">
                      <h3 className="quick-action-title primary">Crear Nueva Tienda</h3>
                      <p className="quick-action-description">
                        Configura y lanza una nueva tienda en minutos
                      </p>
                    </div>
                  </div>
                </button>

                <button onClick={handleViewStores} className="quick-action-card secondary">
                  <div className="quick-action-inner">
                    <div className="quick-action-icon secondary">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      </svg>
                    </div>
                    <div className="quick-action-content">
                      <h3 className="quick-action-title secondary">Ver Mis Tiendas</h3>
                      <p className="quick-action-description">
                        Gestiona y monitorea todas tus tiendas existentes
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-section">
              <div className="activity-header">
                <h3 className="activity-title">Actividad Reciente</h3>
                <button className="view-all-button">Ver todo</button>
              </div>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-item-left">
                    <div className="activity-dot"></div>
                    <div>
                      <p className="activity-text">
                        Nueva venta en <span className="activity-store">Tienda Principal</span>
                      </p>
                      <p className="activity-time">Hace 2 horas</p>
                    </div>
                  </div>
                  <span className="activity-amount">$125</span>
                </div>

                <div className="activity-item">
                  <div className="activity-item-left">
                    <div className="activity-dot"></div>
                    <div>
                      <p className="activity-text">
                        Producto agregado a <span className="activity-store">Tienda Norte</span>
                      </p>
                      <p className="activity-time">Hace 5 horas</p>
                    </div>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-item-left">
                    <div className="activity-dot"></div>
                    <div>
                      <p className="activity-text">
                        Tienda activada <span className="activity-store">Tienda Centro</span>
                      </p>
                      <p className="activity-time">Ayer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}