import { Link } from "react-router-dom";
import "../styles/publicNavBar.css";


export default function PublicNavBar() {
  return (
    <nav className="public-nav">
      <div className="nav-left">
        <Link to="/" className="brand">MiTienda</Link>
      </div>

      <div className="nav-right">
        <Link to="#products" className="nav-item">Productos</Link>
        <Link to="/cart" className="nav-item">Carrito</Link>

        <button
          className="dark-toggle"
          onClick={() => {
            document.body.classList.toggle("dark-mode");
          }}
        >
          🌓
        </button>
      </div>
    </nav>
  );
}
