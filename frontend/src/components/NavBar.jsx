import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/nav.css";

const NavBar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand-link">
          <div className="logo-mark">TT</div>
          <div className="brand-text">TuTienda</div>
        </NavLink>

        <div className={`nav-center ${open ? "open" : ""}`}>
          <div className="search">
            <input placeholder="Buscar productos o tiendas..." />
            <button className="search-btn">Buscar</button>
          </div>

          <ul className="nav-links">
            <li><NavLink to="/stores/list" className={({isActive}) => isActive ? "active" : ""}>Tiendas</NavLink></li>
            <li><NavLink to="/stores/create" className={({isActive}) => isActive ? "active" : ""}>Crear tienda</NavLink></li>
            <li><NavLink to="/cart" className={({isActive}) => isActive ? "active" : ""}>Carrito</NavLink></li>
            <li><NavLink to="/stores/:storeId/manage-products" className={({isActive}) => isActive ? "active" : ""}>Productos</NavLink></li>
            <li><NavLink to="/products/1/reviews">Reseñas</NavLink></li>

          </ul>
        </div>

        <div className="nav-actions">
          <button className="btn-primary">Mi cuenta</button>
          <button className="nav-toggle" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;