import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import styles from "../styles/privateNavBar.module.css";

const NavBar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className={styles.appNav}>
      <div className={styles.navInner}>
        <NavLink to="/Dashboard" className={styles.brandLink}>
          <div className={styles.logoMark}>TT</div>
          <div className={styles.brandText}>TuTienda</div>
        </NavLink>

        <div className={`${styles.navCenter} ${open ? styles.open : ''}`}>
          <div className={styles.search}>
            <input placeholder="Buscar productos o tiendas..." />
            <button className={styles.searchBtn}>Buscar</button>
          </div>

          <ul className={styles.navLinks}>
            <li><NavLink to="/stores/list">Tiendas</NavLink></li>
            <li><NavLink to="/stores/create">Crear tienda</NavLink></li>
            <li><NavLink to="/stores/:storeId/manage-products">Productos</NavLink></li>
          </ul>
        </div>

        <div className={styles.navActions}>
          
          <NavLink to="/account" className={styles.btn}>Mi cuenta</NavLink>

          <button
            className={styles.navToggle}
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
