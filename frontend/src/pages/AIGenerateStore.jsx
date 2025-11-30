import React, { useState } from 'react';
import axios from 'axios';

const AIGenerateStore = () => {
  const [prompt, setPrompt] = useState('');
  const [templates, setTemplates] = useState([]);  // Plantillas generadas por OpenAI
  const [selectedTemplate, setSelectedTemplate] = useState(null);  // Plantilla seleccionada
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateTemplates = async () => {
    setLoading(true);
    setError('');

    try {
      // Llamada al backend para generar plantillas basadas en el prompt
      const response = await axios.post("http://localhost:4000/api/ai/generate-store", { prompt });
      
      // Verificar si la respuesta es un array de plantillas
      if (Array.isArray(response.data)) {
        setTemplates(response.data); // Guardar las plantillas generadas
      } else {
        setError("La respuesta de la IA no contiene plantillas válidas.");
      }
    } catch (err) {
      console.error("Error generando plantillas:", err);
      setError("No se pudieron generar las plantillas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template);
    setLoading(true);

    try {
      // Llamada para generar la tienda con la plantilla seleccionada
      const response = await axios.post("http://localhost:4000/api/ai/generate-store-with-template", { templateId: template.id });
      
      // Mostrar la respuesta de la creación de la tienda
      console.log("Tienda generada con éxito:", response.data);
    } catch (err) {
      console.error("Error generando la tienda:", err);
      setError("No se pudo generar la tienda con la plantilla seleccionada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Generar Tienda con IA</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe el tipo de tienda que deseas generar"
      />
      <button onClick={handleGenerateTemplates} disabled={loading}>
        {loading ? 'Generando plantillas...' : 'Generar Plantillas'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {templates && templates.length > 0 && (
        <div>
          <h3>Plantillas Generadas:</h3>
          {templates.map((template, index) => (
            <div key={template.id} style={{ marginBottom: '20px' }}>
              <h4>Plantilla {index + 1}</h4>
              <p>{template.description || 'Sin descripción disponible'}</p>
              <button 
                onClick={() => handleSelectTemplate(template)}
                disabled={loading}
              >
                {loading ? 'Generando tienda...' : 'Seleccionar Plantilla'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIGenerateStore;
