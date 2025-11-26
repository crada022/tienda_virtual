import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/nav.css";

const NavBar = () => {
  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <div className="brand">
          <NavLink to="/" className="brand-link">TuTienda</NavLink>
        </div>

        <button className="nav-toggle" aria-label="Toggle navigation" onClick={() => {
          document.querySelector(".nav-links").classList.toggle("open");
        }}>
          ☰
        </button>

        <ul className="nav-links">
          <li><NavLink to="/" end activeclassname="active">Inicio</NavLink></li>
          <li><NavLink to="/stores/list" activeclassname="active">Tiendas</NavLink></li>
          <li><NavLink to="/manage-products" activeclassname="active">Productos</NavLink></li>
          <li><NavLink to="/cart" activeclassname="active">Carrito</NavLink></li>
          <li><NavLink to="/orders" activeclassname="active">Pedidos</NavLink></li>
          <li><NavLink to="/profile" activeclassname="active">Mi perfil</NavLink></li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;