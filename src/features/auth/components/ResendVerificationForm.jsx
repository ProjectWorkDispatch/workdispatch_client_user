import { useState } from "react";
import toast from "react-hot-toast";
import { resendVerification } from "../../../shared/api";

export const ResendVerificationForm = ({ onSwitch }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Ingresa tu correo electrónico");
      return;
    }

    setLoading(true);
    try {
      await resendVerification(email);
      toast.success("Correo de verificación reenviado. Revisa tu bandeja.");
      setEmail("");
    } catch (error) {
      const msg = error.response?.data?.message || "Error al reenviar el correo";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-300">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="w-full px-3 py-2.5 mb-5 text-sm bg-gray-700 border border-gray-600 text-white
          placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full mb-3 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400
          hover:to-yellow-300 text-gray-900 font-semibold py-2.5 px-4 rounded-lg transition-all
          duration-200 text-sm disabled:opacity-50"
        >
          {loading ? "Reenviando..." : "Reenviar correo de verificación"}
        </button>
        <p className="text-center text-sm text-gray-400">
          ¿Ya verificaste tu cuenta?{" "}
        </p>
        <button
          type="button"
          onClick={onSwitch}
          className="text-yellow-400 hover:text-yellow-300 hover:underline mx-auto block"
        >
          Iniciar sesión
        </button>
      </div>
    </form>
  );
};
