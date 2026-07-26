import { useState, useEffect } from "react";
import { Modal } from "../../shared/components/ui/Modal";
import { Button } from "../../shared/components/ui/Button";
import { MapPicker } from "../../shared/components/ui/MapPicker";
import { getCategories, createServiceRequest } from "../../shared/api/user";
import toast from "react-hot-toast";

const INITIAL_FORM = {
  title: "",
  description: "",
  categoryId: "",
  address: "",
  latitude: "",
  longitude: "",
  budgetMin: "",
  budgetMax: "",
};

const INITIAL_ERRORS = {
  title: "",
  description: "",
  categoryId: "",
  address: "",
  location: "",
  budgetMin: "",
  budgetMax: "",
};

export const NewServiceRequestModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategoriesLoading(true);
    getCategories()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, [open]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors(INITIAL_ERRORS);
    setImageFile(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title || form.title.length < 10) e.title = "El título debe tener al menos 10 caracteres";
    if (!form.description) e.description = "La descripción es obligatoria";
    if (!form.categoryId) e.categoryId = "Seleccioná una categoría";
    if (!form.address) e.address = "La dirección es obligatoria";
    if (!form.latitude || !form.longitude) e.location = "Selecciona la ubicación en el mapa";
    if (!form.budgetMin || parseFloat(form.budgetMin) < 0) e.budgetMin = "El presupuesto mínimo no puede ser negativo";
    if (!form.budgetMax || parseFloat(form.budgetMax) < 0) e.budgetMax = "El presupuesto máximo no puede ser negativo";
    if (form.budgetMin && form.budgetMax && parseFloat(form.budgetMax) < parseFloat(form.budgetMin)) {
      e.budgetMax = "El presupuesto máximo no puede ser menor al mínimo";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("categoryId", form.categoryId);
    fd.append("address", form.address);
    fd.append("latitude", form.latitude);
    fd.append("longitude", form.longitude);
    fd.append("budgetMin", form.budgetMin);
    fd.append("budgetMax", form.budgetMax);
    if (imageFile) fd.append("serviceImage", imageFile);

    setSubmitting(true);
    try {
      await createServiceRequest(fd);
      toast.success("Solicitud creada exitosamente");
      resetForm();
      onClose();
      onCreated?.();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || "Error al crear la solicitud";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nueva Solicitud"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>Cancelar</Button>
          <Button type="submit" form="new-service-request-form" loading={submitting}>Crear Solicitud</Button>
        </>
      }
    >
      <form id="new-service-request-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ej: Reparación de plomería"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe el trabajo que necesitás..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none resize-none"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
          {categoriesLoading ? (
            <p className="text-gray-500 text-sm">Cargando categorías...</p>
          ) : categories.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay categorías disponibles</p>
          ) : (
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          )}
          {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Dirección del lugar"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        {/* Mapa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación en el mapa *</label>
          <MapPicker
            lat={form.latitude || null}
            lng={form.longitude || null}
            onLocationChange={(lat, lng) => {
              setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
              if (errors.location) setErrors(prev => ({ ...prev, location: "" }));
            }}
          />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
        </div>

        {/* Presupuesto */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto Mín. (Q) *</label>
            <input
              type="number"
              name="budgetMin"
              value={form.budgetMin}
              onChange={handleChange}
              min="0"
              step="any"
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
            />
            {errors.budgetMin && <p className="text-red-500 text-xs mt-1">{errors.budgetMin}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto Máx. (Q) *</label>
            <input
              type="number"
              name="budgetMax"
              value={form.budgetMax}
              onChange={handleChange}
              min="0"
              step="any"
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
            />
            {errors.budgetMax && <p className="text-red-500 text-xs mt-1">{errors.budgetMax}</p>}
          </div>
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Foto (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
          />
        </div>

        {/* IA Estimate — deshabilitado */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-500">Estimado con IA</span>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Próximamente</span>
          </div>
          <p className="text-xs text-gray-400">Se estimará automáticamente el costo según la categoría y descripción.</p>
          {/* TODO: integrar Gemini cuando el equipo defina el endpoint */}
        </div>
      </form>
    </Modal>
  );
};
