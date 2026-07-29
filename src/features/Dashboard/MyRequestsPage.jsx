import { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "../../shared/components/ui/Button";
import { Card, CardContent } from "../../shared/components/layout/DashboardContainer";
import { NewServiceRequestModal } from "./NewServiceRequestModal";
import { ServiceRequestDetailModal } from "./ServiceRequestDetailModal";
import {
  getMyServiceRequests,
  getClientServices,
  getCategories,
} from "../../shared/api/user";
import { useAuthStore } from "../auth/store/authStore";
import { useMessagesStore } from "../../shared/store/userStore.js";
import { formatRelativeDate } from "../../shared/utils/statusBadge";

const STATUS_TABS = [
  { label: "Todas", value: null },
  { label: "Buscando ofertas", value: "SEARCHING" },
  { label: "En curso", value: "IN_PROGRESS" },
  { label: "Finalizadas", value: "COMPLETED" },
  { label: "Canceladas", value: "CANCELLED" },
];

const NORMALIZED_STATUS = {
  SEARCHING: { label: "Buscando ofertas", class: "bg-yellow-100 text-yellow-800" },
  IN_PROGRESS: { label: "En curso", class: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Finalizado", class: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", class: "bg-gray-100 text-gray-600" },
};

const normalizeItem = (item, type) => {
  if (type === "serviceRequest") {
    const status = item.status;
    if (status === "OPEN") return "SEARCHING";
    return status;
  }
  return item.status;
};

const getRequestIdString = (service) => {
  const rid = service.requestId;
  if (!rid) return null;
  if (typeof rid === "string") return rid;
  return rid._id || rid.id || null;
};

const mergeAndSort = (requests, services) => {
  const serviceRequestIds = new Set(
    (services || []).map(getRequestIdString).filter(Boolean)
  );

  const normalizedRequests = (requests || [])
    .filter((r) => !serviceRequestIds.has(r._id))
    .map((r) => ({
      ...r,
      _type: "serviceRequest",
      _normalizedStatus: normalizeItem(r, "serviceRequest"),
      _sortDate: new Date(r.createdAt).getTime(),
    }));

  const normalizedServices = (services || []).map((s) => ({
    ...s,
    _type: "service",
    _normalizedStatus: normalizeItem(s, "service"),
    _sortDate: new Date(s.createdAt).getTime(),
  }));

  return [...normalizedRequests, ...normalizedServices].sort(
    (a, b) => b._sortDate - a._sortDate
  );
};

const getItemTitle = (item) => {
  if (item._type === "serviceRequest") return item.title;
  return item.requestId?.title || item.serviceCode || "Servicio asignado";
};

const getItemCategory = (item) => {
  if (item._type === "serviceRequest") {
    return item.categoryId?.name || item.customCategory || "Sin categoría";
  }
  return item.requestId?.categoryId?.name || "Sin categoría";
};

const getItemImage = (item) => {
  if (item._type === "serviceRequest") {
    return item.serviceImage?.url || "";
  }
  return item.requestId?.serviceImage?.url || "";
};

const getItemBudget = (item) => {
  if (item._type === "serviceRequest") {
    return `Q${item.budgetMin} - Q${item.budgetMax}`;
  }
  return item.finalPrice ? `Q${item.finalPrice}` : "Por definir";
};

export const MyRequestsPage = () => {
  const { user } = useAuthStore();
  const userId = user?._id || user?.id;
  const navigate = useNavigate();
  const startConversation = useMessagesStore((s) => s.startConversation);
  const [openModal, setOpenModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [messagingId, setMessagingId] = useState(null);

  const handleChat = async (e, workerId) => {
    e.stopPropagation();
    if (!userId || !workerId) return;
    setMessagingId(workerId);
    try {
      const conversation = await startConversation(userId, workerId);
      if (conversation) navigate("/dashboard/messages", { state: { conversation } });
    } catch {
      toast.error("No se pudo iniciar la conversación");
    } finally {
      setMessagingId(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, servicesRes, categoriesRes] = await Promise.all([
        getMyServiceRequests(),
        userId ? getClientServices(userId) : Promise.resolve({ data: { services: [] } }),
        getCategories(),
      ]);
      setRequests(requestsRes.data.data || []);
      setServices(servicesRes.data.services || []);
      setCategories(categoriesRes.data.data || []);
    } catch {
      toast.error("Error al cargar tus solicitudes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mergedItems = useMemo(() => mergeAndSort(requests, services), [requests, services]);

  const filteredItems = useMemo(() => {
    let items = mergedItems;
    if (statusFilter) {
      items = items.filter((item) => item._normalizedStatus === statusFilter);
    }
    if (categoryFilter) {
      items = items.filter((item) => {
        if (item._type === "serviceRequest") {
          return item.categoryId?._id === categoryFilter;
        }
        return item.requestId?.categoryId?._id === categoryFilter;
      });
    }
    return items;
  }, [mergedItems, statusFilter, categoryFilter]);

  const statusCounts = useMemo(() => {
    const counts = { SEARCHING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
    mergedItems.forEach((item) => {
      counts[item._normalizedStatus] = (counts[item._normalizedStatus] || 0) + 1;
    });
    return counts;
  }, [mergedItems]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Mis Solicitudes y Servicios</h1>
          <p className="text-gray-600 mt-1">Todas tus solicitudes y servicios en un solo lugar</p>
        </div>
        <Button size="lg" onClick={() => setOpenModal(true)}>
          <PlusIcon className="size-5" />
          Nueva Solicitud
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === tab.value
                  ? "bg-yellow-500 text-gray-900"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-yellow-400"
                }`}
            >
              {tab.label}
              {tab.value && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({statusCounts[tab.value] || 0})
                </span>
              )}
            </button>
          ))}
        </div>

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

      <hr className="border-gray-200" />

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">Cargando...</p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MagnifyingGlassIcon className="size-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {mergedItems.length === 0
                ? "Aun no has creado ninguna solicitud"
                : "No hay resultados con este filtro"}
            </p>
            <p className="text-gray-400 text-sm">
              {mergedItems.length === 0
                ? "Creá tu primera solicitud desde el botón de arriba."
                : "Probá con otro filtro."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const statusInfo = NORMALIZED_STATUS[item._normalizedStatus];
            return (
              <Card
                key={`${item._type}-${item._id}`}
                className="cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all"
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {getItemImage(item) ? (
                        <img
                          src={getItemImage(item)}
                          alt={getItemTitle(item)}
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <MagnifyingGlassIcon className="size-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          {getItemTitle(item)}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            {getItemCategory(item)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {item._type === "service" ? "Servicio" : "Solicitud"}
                          </span>
                        </div>
                        {item.createdAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeDate(item.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap sm:flex-shrink-0 sm:justify-end">
                      {item._type === "service" && item.workerId && item.status !== "CANCELLED" && (
                        <button
                          onClick={(e) => handleChat(e, item.workerId?._id || item.workerId)}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
                          disabled={messagingId === (item.workerId?._id || item.workerId)}
                        >
                          <ChatBubbleLeftIcon className="size-4" />
                        </button>
                      )}
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${statusInfo?.class || "bg-gray-100 text-gray-600"}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {statusInfo?.label || item._normalizedStatus}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {getItemBudget(item)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NewServiceRequestModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={fetchData}
      />

      <ServiceRequestDetailModal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        serviceRequestId={selectedItem?._type === "serviceRequest" ? selectedItem._id : null}
        service={selectedItem?._type === "service" ? selectedItem : null}
        onActionTaken={fetchData}
      />
    </div>
  );
};
