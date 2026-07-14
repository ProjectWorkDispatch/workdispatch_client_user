import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore.js";

export const RegisterForm = ({ onRegister }) => {
  const { register, loading } = useAuthStore();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "CLIENT",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      toast.error("Todos los campos marcados con * son obligatorios");
      return;
    }

    if (form.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      role: form.role,
      password: form.password,
    };

    const result = await register(payload);

    if (result.success) {
      toast.success("Cuenta creada. Ahora puedes iniciar sesión.");
      onRegister?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre y Apellido */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-300">Nombre *</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="Juan"
            className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-300">Apellido *</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Pérez"
            className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      {/* Correo Electrónico */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-300">Correo electrónico *</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
          className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Teléfono */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-300">Teléfono *</label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="+502 7845 1234"
          className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Tipo de Cuenta */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-300">Tipo de cuenta *</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 appearance-none"
        >
          <option value="CLIENT">Cliente — Publicar solicitudes de trabajo</option>
          <option value="WORKER">Profesional — Ofrecer servicios</option>
        </select>
      </div>

      {/* Contraseña */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-300">Contraseña *</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Mínimo 8 caracteres"
          className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Confirmar Contraseña */}
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-300">Confirmar contraseña *</label>
        <input
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Repite tu contraseña"
          className="w-full px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Botón Principal */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-gray-900 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 text-sm disabled:opacity-50"
      >
        {loading ? "Creando cuenta..." : "Crear Cuenta"}
      </button>

      {/* Texto de ayuda */}
      <div className="text-center space-y-3 mt-4">
        <p className="text-[10px] text-gray-400 leading-tight">
          Al registrarte serás redirigido a la verificación de identidad. <br />
          Solo usuarios verificados pueden interactuar en la plataforma.
        </p>
      </div>
    </form>
  );
};
