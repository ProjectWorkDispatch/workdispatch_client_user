import { useState } from "react";
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";
import {
  Card,
  CardContent,
} from "../../../shared/components/layout/DashboardContainer";
import { useAuthStore } from "../../auth/store/authStore";

export const DashboardHome = () => {
  const { user } = useAuthStore();
  const [openModal, setOpenModal] = useState(false);
  const isClient = user?.role !== "WORKER";

  // Placeholder — cada equipo conecta esto a datos reales
  const stats = isClient
    ? [
        { label: "Solicitudes Activas", value: 0, icon: ClockIcon, bg: "bg-yellow-50", border: "border-yellow-200", color: "text-yellow-600" },
        { label: "En Progreso", value: 0, icon: CheckCircleIcon, bg: "bg-gray-100", border: "border-gray-300", color: "text-gray-700" },
        { label: "Completados", value: 0, icon: CheckCircleIcon, bg: "bg-gray-200", border: "border-gray-400", color: "text-gray-900" },
      ]
    : [
        { label: "Trabajos Disponibles", value: 0, icon: ClockIcon, bg: "bg-yellow-50", border: "border-yellow-200", color: "text-yellow-600" },
        { label: "Mis Ofertas", value: 0, icon: CheckCircleIcon, bg: "bg-gray-100", border: "border-gray-300", color: "text-gray-700" },
        { label: "Completados", value: 0, icon: CheckCircleIcon, bg: "bg-gray-200", border: "border-gray-400", color: "text-gray-900" },
      ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            {isClient ? "Panel de Cliente" : "Trabajos Disponibles"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isClient ? "Gestiona tus solicitudes de trabajo" : "Encuentra trabajos que se ajusten a tus habilidades"}
          </p>
        </div>

        {isClient && (
          <Button size="lg" onClick={() => setOpenModal(true)}>
            <PlusIcon className="size-5" />
            Nueva Solicitud
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className={`${stat.bg} ${stat.border} border-2`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`size-10 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vacío — cada equipo lo reemplaza con datos reales */}
      <Card>
        <CardContent className="p-12 text-center">
          <MapPinIcon className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {isClient ? "Aún no has creado ninguna solicitud" : "Aún no hay trabajos disponibles"}
          </p>
          <p className="text-gray-400 text-sm">
            Esta sección la completa cada feature (mis-solicitudes / trabajos-disponibles).
          </p>
        </CardContent>
      </Card>

      {/* Ejemplo de uso del Modal base */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Nueva Solicitud"
        description="Este modal es solo un ejemplo de cómo reutilizar el componente Modal."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button onClick={() => setOpenModal(false)}>Guardar</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Aquí va el formulario real de creación de solicitud.</p>
      </Modal>
    </div>
  );
};