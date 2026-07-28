import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Button } from "../../shared/components/ui/Button";
import { Card, CardContent } from "../../shared/components/layout/DashboardContainer";
import { DashboardStats } from "./DashboardStats";
import { NewServiceRequestModal } from "./NewServiceRequestModal";
import { ServiceRequestDetailModal } from "./ServiceRequestDetailModal";
import { getMyServiceRequests, getCategories } from "../../shared/api/user";

const STATUS_BADGE = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export const ClientDashboardSummary = () => {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = async () => {
    try {
      const [requestsRes] = await Promise.all([
        getMyServiceRequests(),
        getCategories(),
      ]);
      setRequests(requestsRes.data.data || []);
    } catch {
      toast.error("Error al cargar tus solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeCount = requests.filter((r) => r.status === "OPEN").length;
  const inProgressCount = requests.filter((r) => r.status === "IN_PROGRESS").length;
  const completedCount = requests.filter((r) => r.status === "COMPLETED").length;

  const stats = [
    { label: "Solicitudes Activas", value: activeCount, icon: ClockIcon, bg: "bg-yellow-50", border: "border-yellow-200", color: "text-yellow-600" },
    { label: "En Progreso", value: inProgressCount, icon: CheckCircleIcon, bg: "bg-gray-100", border: "border-gray-300", color: "text-gray-700" },
    { label: "Completados", value: completedCount, icon: CheckCircleIcon, bg: "bg-gray-200", border: "border-gray-400", color: "text-gray-900" },
  ];

  const recentRequests = requests.slice(0, 3);

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

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">Cargando solicitudes...</p>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPinIcon className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Aun no has creado ninguna solicitud</p>
            <p className="text-gray-400 text-sm">
              Esta seccion la completa cada feature de solicitudes del cliente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {recentRequests.map((req) => (
              <Card
                key={req._id}
                className="cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all"
                onClick={() => setSelectedRequest(req)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{req.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{req.categoryId?.name || req.customCategory || "Sin categoría"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[req.status] || "bg-gray-100 text-gray-600"}`}>
                        {req.status}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        Q{req.budgetMin} - Q{req.budgetMax}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard/my-requests")}>
            Ver todas mis solicitudes
          </Button>
        </>
      )}

      <NewServiceRequestModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={fetchData}
      />

      <ServiceRequestDetailModal
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        serviceRequestId={selectedRequest?._id || null}
        onActionTaken={fetchData}
      />
    </div>
  );
};
