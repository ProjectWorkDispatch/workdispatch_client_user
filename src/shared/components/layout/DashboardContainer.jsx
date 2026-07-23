import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import logoWorkDispatch from "../../../assets/img/logo_Workdispatch.png";
import { useAuthStore } from "../../../features/auth/store/authStore";
import { Button } from "../ui/Button";

/* ------------------------------------------------------------------ */
/* Navegación por rol — cada quien agrega su ruta aquí cuando la cree  */
/* ------------------------------------------------------------------ */
const CLIENT_NAV = [
  { label: "Inicio", to: "/dashboard", icon: HomeIcon },
  { label: "Mis Solicitudes", to: "/dashboard/my-requests", icon: ClipboardDocumentListIcon },
  { label: "Buscar Trabajadores", to: "/dashboard/find-workers", icon: MagnifyingGlassIcon },
  { label: "Mis Contratos", to: "/dashboard/my-services", icon: BriefcaseIcon },
];

const WORKER_NAV = [
  { label: "Trabajos Disponibles", to: "/dashboard", icon: BriefcaseIcon },
  { label: "Mis Ofertas", to: "/dashboard/my-offers", icon: ClipboardDocumentListIcon },
  { label: "Mis Servicios", to: "/dashboard/my-services", icon: BriefcaseIcon },
];

/* ------------------------------------------------------------------ */
/* Header — puerto de Layout.tsx del Figma                            */
/* ------------------------------------------------------------------ */
const DashboardHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = user?.role === "WORKER" ? WORKER_NAV : CLIENT_NAV;
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-yellow-500/20 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src={logoWorkDispatch}
              alt="WorkDispatch"
              className="w-10 h-10 object-contain transform hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <span className="font-bold text-xl text-white">
                Work<span className="text-yellow-400">Dispatch</span>
              </span>
              <p className="text-xs text-gray-400 -mt-1">Conectando talento</p>
            </div>
          </Link>

          {/* Navegación desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={active ? "primary" : "ghostDark"}
                    className={active ? "!bg-yellow-500 hover:!bg-yellow-400 !text-gray-900" : ""}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Acciones de usuario */}
          <div className="flex items-center gap-2">
            <Link to="/dashboard/messages">
              <Button variant="ghostDark" size="icon" className="rounded-full">
                <ChatBubbleLeftRightIcon className="size-5" />
              </Button>
            </Link>
            <Link to="/dashboard/notifications">
              <Button variant="ghostDark" size="icon" className="rounded-full">
                <BellIcon className="size-5" />
              </Button>
            </Link>

            <div className="hidden sm:flex items-center bg-gray-700/50 border border-yellow-500/30 px-3 py-1.5 rounded-full text-sm font-medium text-yellow-400">
              {user?.role === "CLIENT" ? "Cliente" : "Trabajador"}
            </div>

            <Link to="/dashboard/profile" className="block">
              <div className="size-10 rounded-full bg-yellow-500 text-gray-900 font-bold flex items-center justify-center ring-2 ring-yellow-500/30 hover:ring-yellow-500/50 transition-all">
                {initials || "?"}
              </div>
            </Link>

            <Button
              onClick={handleLogout}
              variant="ghostDark"
              size="icon"
              className="hidden md:flex hover:!text-red-400 hover:!bg-red-500/10 rounded-full"
              title="Cerrar Sesión"
            >
              <ArrowRightOnRectangleIcon className="size-5" />
            </Button>

            <Button
              variant="ghostDark"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <XMarkIcon className="size-5" /> : <Bars3Icon className="size-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Panel móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-700 px-4 py-4">
          <nav className="flex flex-col gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={active ? "primary" : "ghostDark"}
                    className={`w-full justify-start ${active ? "!bg-yellow-500 !text-gray-900" : ""}`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

/* ------------------------------------------------------------------ */
/* Card / Badge — helpers de UI que cada quien reutiliza en su vista  */
/* (mismas clases que ui/card.tsx y ui/badge.tsx del Figma)            */
/* ------------------------------------------------------------------ */
export const Card = ({ className = "", children, ...props }) => (
  <div className={`bg-white flex flex-col gap-6 rounded-xl border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className = "", children, ...props }) => (
  <div className={`flex flex-col gap-1.5 px-6 pt-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = "", children, ...props }) => (
  <h4 className={`font-bold leading-none ${className}`} {...props}>
    {children}
  </h4>
);

export const CardDescription = ({ className = "", children, ...props }) => (
  <p className={`text-gray-500 text-sm ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = "", children, ...props }) => (
  <div className={`px-6 pb-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = "", children, ...props }) => (
  <div className={`flex items-center px-6 pb-6 ${className}`} {...props}>
    {children}
  </div>
);

const BADGE_VARIANTS = {
  default: "bg-yellow-500 text-gray-900",
  secondary: "bg-gray-100 text-gray-700",
  outline: "border border-gray-300 text-gray-700 bg-transparent",
  destructive: "bg-red-600 text-white",
};

export const Badge = ({ variant = "default", className = "", children, ...props }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap ${BADGE_VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/* Contenedor principal del dashboard — esto es lo que se importa     */
/* en las rutas protegidas                                            */
/* ------------------------------------------------------------------ */
export const DashboardContainer = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
