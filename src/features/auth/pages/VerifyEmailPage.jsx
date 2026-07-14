import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../../../shared/api";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado.");
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Correo verificado exitosamente. Ya puedes iniciar sesión.");
      })
      .catch((error) => {
        setStatus("error");
        const msg = error.response?.data?.message || "Error al verificar el correo. El enlace puede haber expirado.";
        setMessage(msg);
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/src/assets/img/logo_Workdispatch.png"
            alt="WorkDispatch"
            className="h-16 w-auto object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">Verificación de Correo</h1>

        {status === "loading" && (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="text-gray-400 text-sm">Verificando tu correo...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="text-green-400 text-5xl">&#10003;</div>
            <p className="text-gray-300 text-sm">{message}</p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-gray-900 font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 text-sm"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="text-red-400 text-5xl">&#10007;</div>
            <p className="text-gray-300 text-sm">{message}</p>
            <Link
              to="/"
              className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-gray-900 font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 text-sm"
            >
              Volver al Inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export { VerifyEmailPage };
