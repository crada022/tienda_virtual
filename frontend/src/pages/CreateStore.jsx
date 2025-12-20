import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStore, createStoreWithAI } from "../api/services/storeService";
import { createAIStore } from "../api/services/authService.js";
import "../styles/CreateStore.css";

export default function CreateStore() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    domain: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Validaciones
  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "El nombre de la tienda es obligatorio";
    } else if (form.name.length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Formato de email inválido";
    }

    if (form.phone && !/^[\d\s\-\+\(\)]+$/.test(form.phone)) {
      newErrors.phone = "Formato de teléfono inválido";
    }

    if (form.domain && !/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(form.domain)) {
      newErrors.domain = "Formato de dominio inválido (ej: mitienda.com)";
    }

    if (useAI && !form.description.trim()) {
      newErrors.description = "La descripción es requerida para generación con IA";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (field) => {
    const newErrors = validateForm();
    if (newErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: newErrors[field] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario completo
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (useAI) {
        const prompt = form.description || `Crea una tienda moderna llamada ${form.name || "Mi tienda"}.`;
        const result = await createStoreWithAI(prompt);
        
        // Mostrar mensaje de éxito
        alert("¡Tienda generada exitosamente con IA! 🎉");
        navigate("/stores/list");
        return;
      }

      const payload = {
        name: form.name,
        description: form.description,
        address: form.address,
        phone: form.phone,
        email: form.email,
        domain: form.domain
      };
      
      const result = await createAIStore(payload);
      alert("¡Tienda creada exitosamente! 🎉");
      navigate("/stores/list");
      
    } catch (err) {
      console.error("Error al crear tienda:", err);
      
      try {
        const body = await err.json();
        setErrors({ submit: body.message || "Error al crear la tienda" });
      } catch (_) {
        setErrors({ submit: "Error al crear la tienda. Por favor, intente nuevamente." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-store-container">
      {/* Header */}
      <header className="create-store-header">
        <div className="header-content">
          <button 
            onClick={() => navigate("/stores/list")} 
            className="back-button"
            aria-label="Volver"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div>
            <h1 className="page-title">Crear nueva tienda</h1>
            <p className="page-subtitle">
              {useAI 
                ? "Describe tu tienda y la IA hará el resto ✨" 
                : "Llena los datos y publica tu tienda en segundos"}
            </p>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary"
            disabled={!form.name}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Vista previa
          </button>
        </div>
      </header>

      <div className="create-store-content">
        {/* Main Form */}
        <div className="form-section">
          <form onSubmit={handleSubmit}>
            {/* AI Toggle Card */}
            <div className="ai-toggle-card">
              <div className="ai-toggle-content">
                <div className="ai-toggle-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <div className="ai-toggle-text">
                  <h3>Generación con Inteligencia Artificial</h3>
                  <p>Deja que la IA configure automáticamente tu tienda basándose en tu descripción</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* Form Card */}
            <div className="form-card">
              <div className="form-card-header">
                <h2>Información de la tienda</h2>
                <span className="required-badge">* Campos obligatorios</span>
              </div>

              <div className="form-grid">
                {/* Nombre */}
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Nombre de la tienda <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    className={`form-input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Mi Tienda Online"
                    required
                    disabled={loading}
                  />
                  {errors.name && (
                    <span className="error-text">{errors.name}</span>
                  )}
                </div>

                {/* Dominio */}
                <div className="form-group">
                  <label htmlFor="domain" className="form-label">
                    Dominio / Subdominio
                    <span className="optional-badge">opcional</span>
                  </label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <input
                      type="text"
                      id="domain"
                      name="domain"
                      value={form.domain}
                      onChange={handleChange}
                      onBlur={() => handleBlur('domain')}
                      className={`form-input with-icon ${errors.domain ? 'input-error' : ''}`}
                      placeholder="mitienda.ejemplo.com"
                      disabled={loading}
                    />
                  </div>
                  {errors.domain && (
                    <span className="error-text">{errors.domain}</span>
                  )}
                </div>

                {/* Teléfono */}
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Teléfono
                    <span className="optional-badge">opcional</span>
                  </label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      onBlur={() => handleBlur('phone')}
                      className={`form-input with-icon ${errors.phone ? 'input-error' : ''}`}
                      placeholder="+57 300 123 4567"
                      disabled={loading}
                    />
                  </div>
                  {errors.phone && (
                    <span className="error-text">{errors.phone}</span>
                  )}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email de contacto
                    <span className="optional-badge">opcional</span>
                  </label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      className={`form-input with-icon ${errors.email ? 'input-error' : ''}`}
                      placeholder="contacto@mitienda.com"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>

                {/* Dirección */}
                <div className="form-group full-width">
                  <label htmlFor="address" className="form-label">
                    Dirección
                    <span className="optional-badge">opcional</span>
                  </label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className="form-input with-icon"
                      placeholder="Calle 123 #45-67, Bogotá, Colombia"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div className="form-group full-width">
                  <label htmlFor="description" className="form-label">
                    Descripción
                    {useAI && <span className="required">*</span>}
                    {useAI && <span className="ai-badge">Se usará como prompt para IA</span>}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    onBlur={() => handleBlur('description')}
                    className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                    rows="4"
                    placeholder={useAI 
                      ? "Ejemplo: Una tienda de ropa deportiva moderna con productos de alta calidad, enfocada en runners y atletas profesionales..."
                      : "Describe tu tienda, productos y servicios..."}
                    disabled={loading}
                  />
                  {errors.description && (
                    <span className="error-text">{errors.description}</span>
                  )}
                  <div className="character-count">
                    {form.description.length} caracteres
                  </div>
                </div>
              </div>

              {/* Error general */}
              {errors.submit && (
                <div className="error-banner" role="alert">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {errors.submit}
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate("/stores/list")}
                  className="btn-ghost"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {useAI ? "Generando con IA..." : "Creando tienda..."}
                    </>
                  ) : (
                    <>
                      {useAI ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                          </svg>
                          Generar con IA
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                          </svg>
                          Crear tienda
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Preview Sidebar */}
        {showPreview && form.name && (
          <aside className="preview-sidebar">
            <div className="preview-card">
              <div className="preview-header">
                <h3>Vista previa</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="close-preview"
                  aria-label="Cerrar vista previa"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="preview-content">
                <div className="preview-store-card">
                  <div className="preview-store-image">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <h4>{form.name || "Nombre de la tienda"}</h4>
                  <p>{form.description || "Descripción de la tienda..."}</p>
                  <div className="preview-details">
                    {form.domain && <span>🌐 {form.domain}</span>}
                    {form.phone && <span>📞 {form.phone}</span>}
                    {form.email && <span>✉️ {form.email}</span>}
                    {form.address && <span>📍 {form.address}</span>}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}