import { useState } from "react";
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";
import { Card, CardContent } from "../../../shared/components/layout/DashboardContainer";
import { DashboardStats } from "./DashboardStats";

export const ClientDashboardSummary = () => {
  const [openModal, setOpenModal] = useState(false);

  const stats = [
    { label: "Solicitudes Activas", value: 0, icon: ClockIcon, bg: "bg-yellow-50", border: "border-yellow-200", color: "text-yellow-600" },
    { label: "En Progreso", value: 0, icon: CheckCircleIcon, bg: "bg-gray-100", border: "border-gray-300", color: "text-gray-700" },
    { label: "Completados", value: 0, icon: CheckCircleIcon, bg: "bg-gray-200", border: "border-gray-400", color: "text-gray-900" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Panel de Cliente</h1>
          <p className="text-gray-600 mt-1">Gestiona tus solicitudes de trabajo</p>
        </div>

        <Button size="lg" onClick={() => setOpenModal(true)}>
          <PlusIcon className="size-5" />
          Nueva Solicitud
        </Button>
      </div>

      <DashboardStats stats={stats} />

      <Card>
        <CardContent className="p-12 text-center">
          <MapPinIcon className="size-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Aun no has creado ninguna solicitud</p>
          <p className="text-gray-400 text-sm">
            Esta seccion la completa cada feature de solicitudes del cliente.
          </p>
        </CardContent>
      </Card>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Nueva Solicitud"
        description="Este modal es solo un ejemplo de como reutilizar el componente Modal."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button onClick={() => setOpenModal(false)}>Guardar</Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">Aqui va el formulario real de creacion de solicitud.</p>
      </Modal>
    </div>
  );
};
