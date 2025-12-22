import { Link } from "react-router-dom";
import "../styles/index.css";

export default function Index() {
  return (
    <div className="landing">

      {/* HERO */}
      <section className="hero">
        <h1>Crea tu tienda online en minutos</h1>
        <p>
          Vende productos, gestiona pedidos y comparte tu tienda con un solo enlace.
          Sin conocimientos técnicos.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn-primary">
            Crear mi tienda
          </Link>
          <Link to="/stores/list" className="btn-secondary">
            Ver tiendas
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2>¿Qué puedes hacer aquí?</h2>

        <div className="features-grid">
          <div className="feature-card">
            <h3>🛍️ Crear tu tienda</h3>
            <p>
              Diseña tu tienda con tu propio enlace y comparte tu catálogo
              fácilmente.
            </p>
          </div>

          <div className="feature-card">
            <h3>📦 Gestionar pedidos</h3>
            <p>
              Recibe pedidos, controla estados y administra ventas desde un panel
              sencillo.
            </p>
          </div>

          <div className="feature-card">
            <h3>👥 Clientes y reseñas</h3>
            <p>
              Permite que tus clientes se registren, compren y dejen reseñas en tu tienda.
            </p>
          </div>

          <div className="feature-card">
            <h3>🌍 Tienda pública</h3>
            <p>
              Cada tienda tiene su propio enlace público accesible desde cualquier lugar.
            </p>
          </div>
        </div>
      </section>

      {/* FOR WHO */}
      <section className="for-who">
        <h2>¿Para quién es esta plataforma?</h2>
        <ul>
          <li>✔ Emprendedores</li>
          <li>✔ Pequeños negocios</li>
          <li>✔ Tiendas físicas que quieren vender online</li>
          <li>✔ Personas que quieren vender sin complicaciones</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Empieza hoy</h2>
        <p>Crea tu tienda y empieza a vender en minutos.</p>

        <Link to="/register" className="btn-primary">
          Registrarme gratis
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} Tu Plataforma de Tiendas</p>
      </footer>

    </div>
  );
}
