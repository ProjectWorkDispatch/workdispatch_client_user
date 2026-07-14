import { useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import logoWorkDispatch from "../../../assets/img/logo_Workdispatch.png";
import { useAuthStore } from "../../../features/auth/store/authStore";

const ROLE_LABELS = {
  CLIENT: "Cliente",
  WORKER: "Trabajador",
};

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-yellow-500/20 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoWorkDispatch} alt="WorkDispatch" className="h-9 w-auto object-contain" />
          <span className="hidden sm:block font-bold text-lg text-white">
            Work<span className="text-yellow-400">Dispatch</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center bg-gray-700/50 border border-yellow-500/30 px-3 py-1.5 rounded-full text-xs font-semibold text-yellow-400">
            {ROLE_LABELS[user?.role] ?? "Usuario"}
          </span>

          <div className="size-9 rounded-full bg-yellow-500 text-gray-900 font-bold flex items-center justify-center">
            {initials || "?"}
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg p-2 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="size-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};