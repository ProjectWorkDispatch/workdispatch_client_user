import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore.js";

export const LoginForm = ({ onForgot, onResendVerification }) => {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Ingresa tu correo y contraseña");
      return;
    }

    const result = await login({ email: form.email, password: form.password });

    if (result.success) {
      toast.success("¡Bienvenido!");
      navigate("/dashboard");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
          className="w-full px-3 py-2.5 text-sm bg-gray-700 border border-gray-600 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Contraseña */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Contraseña
        </label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          className="w-full px-3 py-2.5 text-sm bg-gray-700 border border-gray-600 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-gray-900 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 text-sm disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Iniciar Sesión"}
      </button>

      <p className="text-center text-sm space-y-1">
        <button
          type="button"
          className="text-yellow-400 hover:text-yellow-300 hover:underline block mx-auto"
          onClick={onForgot}
        >
          ¿Olvidaste tu contraseña?
        </button>
        <button
          type="button"
          className="text-yellow-400 hover:text-yellow-300 hover:underline block mx-auto"
          onClick={onResendVerification}
        >
          Reenviar correo de verificación
        </button>
      </p>
    </form>
  );
};
