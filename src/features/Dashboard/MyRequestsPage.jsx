import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Button } from "../../shared/components/ui/Button";
import { Card, CardContent } from "../../shared/components/layout/DashboardContainer";
import { NewServiceRequestModal } from "./NewServiceRequestModal";
import { getMyServiceRequests, getCategories } from "../../shared/api/user";

const STATUS_BADGE = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const STATUS_TABS = [
  { label: "Todas", value: null },
  { label: "Abiertas", value: "OPEN" },
  { label: "En Progreso", value: "IN_PROGRESS" },
  { label: "Completadas", value: "COMPLETED" },
  { label: "Canceladas", value: "CANCELLED" },
];

const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: "year", divisor: 31536000 },
    { label: "month", divisor: 2592000 },
    { label: "week", divisor: 604800 },
    { label: "day", divisor: 86400 },
    { label: "hour", divisor: 3600 },
    { label: "minute", divisor: 60 },
    { label: "second", divisor: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.divisor);
    if (count >= 1) {
      const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
      return rtf.format(-count, interval.label);
    }
  }
  return "hace un momento";
};

export const MyRequestsPage = () => {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchData = async (status) => {
    setLoading(true);
    try {
      const [requestsRes, categoriesRes] = await Promise.all([
        getMyServiceRequests(status),
        getCategories(),
      ]);
      setRequests(requestsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      toast.error("Error al cargar tus solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(statusFilter);
  }, [statusFilter]);

  const filteredRequests = useMemo(() => {
    if (!categoryFilter) return requests;
    return requests.filter((r) => r.categoryId?._id === categoryFilter);
  }, [requests, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Mis Solicitudes</h1>
          <p className="text-gray-600 mt-1">Todas tus solicitudes de trabajo en un solo lugar</p>
        </div>
        <Button size="lg" onClick={() => setOpenModal(true)}>
          <PlusIcon className="size-5" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Tabs de status */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-yellow-500 text-gray-900"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-yellow-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Select de categoría */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Separador */}
      <hr className="border-gray-200" />

      {/* Lista */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">Cargando solicitudes...</p>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MagnifyingGlassIcon className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {requests.length === 0
                ? "Aun no has creado ninguna solicitud"
                : "No tenés solicitudes con este filtro"}
            </p>
            <p className="text-gray-400 text-sm">
              {requests.length === 0
                ? "Creá tu primera solicitud desde el botón de arriba."
                : "Probá con otro filtro o creá una nueva solicitud."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <Card
              key={req._id}
              className="cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all"
              onClick={() => navigate(`/dashboard/my-requests/${req._id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {req.serviceImage?.url ? (
                    <img
                      src={req.serviceImage.url}
                      alt={req.title}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <MagnifyingGlassIcon className="size-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{req.title}</h3>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        {req.categoryId?.name}
                      </span>
                    </div>
                    {req.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(req.createdAt)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[req.status] || "bg-gray-100 text-gray-600"}`}>
                      <span className="size-1.5 rounded-full bg-current" />
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
      )}

      <NewServiceRequestModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={() => fetchData(statusFilter)}
      />
    </div>
  );
};
