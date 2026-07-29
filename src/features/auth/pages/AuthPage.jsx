import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { LoginForm } from "../components/LoginForm.jsx";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";
import { RegisterForm } from "../components/RegisterForm.jsx";
import { ResendVerificationForm } from "../components/ResendVerificationForm.jsx";
import logoWorkDispatch from "../../../assets/img/logo_Workdispatch.png";

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [view, setView] = useState("login");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl" />
      </div>

      {/* Contenedor principal */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo + título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoWorkDispatch}
              alt="WorkDispatch"
              className="h-20 w-auto object-contain"
            />
          </div>

          <h1 className="text-4xl font-black text-white mb-2">
            Work<span className="text-yellow-400">Dispatch</span>
          </h1>

          <p className="text-gray-400 text-sm mb-6">Conectando talento</p>
          <div className="relative grid w-full grid-cols-2 bg-gray-800 border rounded-full border-gray-700 p-1 overflow-hidden">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-yellow-400 rounded-full transition-all duration-300 ease-out ${
                view === "login"
                  ? "translate-x-0 left-1 opacity-100"
                  : view === "register"
                    ? "translate-x-full left-[-1px] opacity-100"
                    : "opacity-0 scale-95"
              }`}
            />

            <button
              onClick={() => setView("login")}
              className={`relative z-10 py-2 text-sm font-medium transition-colors duration-300 ${
                view === "login" ? "text-black" : "text-yellow-400"
              }`}
            >
              Ingresar
            </button>

            <button
              onClick={() => setView("register")}
              className={`relative z-10 py-2 text-sm font-medium transition-colors duration-300 ${
                view === "register" ? "text-black" : "text-yellow-400"
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-6 md:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {view === "forgot" && "Recuperar Contraseña"}
              {view === "resend" && "Reenviar Verificación"}
              {view === "login" && "Bienvenido de Nuevo"}
              {view === "register" && "Crear Cuenta"}
            </h1>

            <p className="text-gray-400 text-sm max-w-md mx-auto">
              {view === "forgot" && "Ingresa la información necesaria para recuperar tu acceso."}
              {view === "resend" && "Ingresa tu correo para reenviar el enlace de verificación."}
              {(view === "login" || view === "register") && "Ingresa tus credenciales para acceder a la plataforma."}
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {view === "login" && (
              <LoginForm
                onForgot={() => setView("forgot")}
                onResendVerification={() => setView("resend")}
              />
            )}
            {view === "register" && (
              <RegisterForm onRegister={() => setView("login")} />
            )}
            {view === "forgot" && (
              <ForgotPasswordForm onSwitch={() => setView("login")} />
            )}
            {view === "resend" && (
              <ResendVerificationForm onSwitch={() => setView("login")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { AuthPage };