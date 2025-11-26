import { useState } from "react";
import { createStore } from "../api/services/storeService";

function CreateStore() {
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    domain: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await createStore(form); // No pasamos ownerId
      console.log("Tienda creada:", res);
      alert("Tienda creada con éxito");
    } catch (err) {
      console.error(err);
      alert("Error creando tienda");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Nombre" onChange={handleChange} />
      <input name="address" placeholder="Dirección" onChange={handleChange} />
      <input name="phone" placeholder="Teléfono" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <textarea name="description" placeholder="Descripción" onChange={handleChange} />
      <input name="domain" placeholder="Dominio" onChange={handleChange} />
      <button type="submit">Crear tienda</button>
    </form>
  );
}

export default CreateStore;
