import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";
import { loginUser } from "../api/services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await loginUser({ email, password });
      login(res.user, res.token); // Guarda el token y el user en el store global
      navigate("/stores/create"); // Redirige al formulario de creación de tienda
    } catch (err) {
      console.error(err);
      alert("Error en el login");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Iniciar sesión</button>
      </form>
    </div>
  );
}

export default Login;
