import { forwardRef } from "react";

const VARIANTS = {
  // Acción principal — igual al botón de "Iniciar Sesión" del login y
  // "Nueva Solicitud" / "Hacer Oferta" del Figma
  primary:
    "bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-gray-900 shadow-md",
  // Botones secundarios sobre fondo blanco — "Ver Detalles", "Ver Todas"
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:border-yellow-400 hover:bg-yellow-50",
  // Sobre header oscuro — nav items inactivos, iconos de logout, etc.
  ghostDark: "bg-transparent text-gray-300 hover:text-white hover:bg-gray-700/50",
  // Sobre fondo claro — cancelar en modales
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  // Acciones destructivas
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const SIZES = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-6 py-3 gap-2",
  icon: "size-9 p-0",
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Botón base reutilizable — mismas clases que ya usan Login, ClientDashboard
 * y WorkerDashboard del Figma. No inventa estilo nuevo, solo lo centraliza.
 *
 * <Button>Nueva Solicitud</Button>
 * <Button variant="outline" size="lg">Ver Detalles</Button>
 * <Button variant="ghostDark" icon={ArrowRightOnRectangleIcon} />
 */
export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    icon: Icon,
    iconPosition = "left",
    loading = false,
    disabled = false,
    fullWidth = false,
    className = "",
    type = "button",
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cx(
        "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {!loading && Icon && iconPosition === "left" && <Icon className="size-4" />}
      {children}
      {!loading && Icon && iconPosition === "right" && <Icon className="size-4" />}
    </button>
  );
});