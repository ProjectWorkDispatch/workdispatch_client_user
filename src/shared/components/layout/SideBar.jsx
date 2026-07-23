import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "../../../features/auth/store/authStore";

const CLIENT_ITEMS = [
  { label: "Inicio", to: "/dashboard", icon: HomeIcon, end: true },
  { label: "Mis Solicitudes", to: "/dashboard/mis-solicitudes", icon: ClipboardDocumentListIcon },
  { label: "Buscar Trabajadores", to: "/dashboard/buscar-trabajadores", icon: MagnifyingGlassIcon },
  { label: "Mis Contratos", to: "/dashboard/mis-contratos", icon: BriefcaseIcon },
];

const WORKER_ITEMS = [
  { label: "Trabajos Disponibles", to: "/dashboard", icon: BriefcaseIcon, end: true },
  { label: "Mis Ofertas", to: "/dashboard/mis-ofertas", icon: ClipboardDocumentListIcon },
];

const COMMON_ITEMS = [{ label: "Mi Perfil", to: "/dashboard/perfil", icon: UserIcon }];

export const Sidebar = () => {
  const { user } = useAuthStore();
  const roleItems = user?.role === "WORKER" ? WORKER_ITEMS : CLIENT_ITEMS;
  const items = [...roleItems, ...COMMON_ITEMS];

  return (
    <aside className="w-60 bg-white min-h-[calc(100vh-4rem)] p-4 shadow-sm hidden md:block">
      <ul className="space-y-1">
        {items.map(({ label, to, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  isActive
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};
