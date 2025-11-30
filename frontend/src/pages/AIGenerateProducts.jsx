import React, { useState } from "react";
import { useParams } from "react-router-dom";
//import { createAIProducts } from "../api/services/aiService";

export default function AIGenerateProducts() {
  const { storeId } = useParams();
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return alert("Describe el tipo de productos a generar");

    setLoading(true);

    try {
      await createAIProducts({
        storeId,
        prompt,
        count,
      });

      alert("Productos generados con éxito");
    } catch (err) {
      console.error(err);
      alert("Error generando productos");
    }

    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div className="page-title">Generar productos con IA</div>
      <div className="page-sub">
        La IA generará productos con imágenes incluidas.
      </div>

      <textarea
        className="input"
        style={{ height: 120, marginTop: 20 }}
        placeholder="Ej: Productos de electrónica moderna, gadgets inteligentes..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div style={{ marginTop: 20 }}>
        <label>Cantidad:</label>
        <input
          className="input"
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={(e) => setCount(e.target.value)}
          style={{ width: 120 }}
        />
      </div>

      <button
        className="btn btn-primary"
        style={{ marginTop: 20 }}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Generando..." : "Generar productos"}
      </button>
    </div>
  );
}
