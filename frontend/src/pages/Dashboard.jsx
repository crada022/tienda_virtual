import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleCreateStore = () => {
    navigate("/stores/create"); // Redirigir a la página de creación de tienda
  };

  const handleViewStores = () => {
    navigate("/stores/list"); // Redirigir a la lista de tiendas
  };

  return (
    <div className="dashboard-page">
      <h2>Bienvenido, usuario</h2>
      <p>¡Hola, estás conectado! Aquí puedes gestionar tus tiendas.</p>

      <div className="actions">
        <button className="btn btn-primary" onClick={handleCreateStore}>
          Crear Nueva Tienda
        </button>
        <button className="btn btn-secondary" onClick={handleViewStores}>
          Ver Mis Tiendas
        </button>
      </div>
    </div>
  );
}
