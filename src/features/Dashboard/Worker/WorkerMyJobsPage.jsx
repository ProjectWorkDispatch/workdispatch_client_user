import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
} from "../../../shared/components/layout/DashboardContainer";
import { Button } from "../../../shared/components/ui/Button";
import {
  getWorkerProposals,
  getWorkerServices,
  completeService,
  cancelService,
} from "../../../shared/api/user";
import { useAuthStore } from "../../auth/store/authStore";
import { useMessagesStore } from "../../../shared/store/userStore.js";
import { useRequireVerification } from "../../verification/hooks/useRequireVerification";
import { WorkerRequestDetailsModal } from "./WorkerRequestDetailsModal";
import { CancelServiceModal } from "./CancelServiceModal";

const getArrayFromResponse = (response, keys = []) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.Id || "";
};

const getUserId = (user) => user?.id || user?._id || user?.userId || user?.Id;

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Por definir";

  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const getImageUrl = (item) => {
  if (item._type === "proposal") {
    return item.serviceRequestId?.serviceImage?.url || "";
  }
  return item.requestId?.serviceImage?.url || "";
};

const getTitle = (item) => {
  if (item._type === "proposal") {
    return item.serviceRequestId?.title || "Solicitud asociada";
  }
  return item.requestId?.title || item.serviceCode || "Servicio asignado";
};

const getDescription = (item) => {
  if (item._type === "proposal") {
    return item.serviceRequestId?.description || "Sin descripción disponible.";
  }
  return item.requestId?.description || "Sin descripción disponible.";
};

const getCategoryName = (item) => {
  if (item._type === "proposal") {
    const cat = item.serviceRequestId?.categoryId;
    if (!cat) return "Sin categoría";
    if (typeof cat === "string") return "Categoría asignada";
    return cat.name || "Sin categoría";
  }
  const cat = item.requestId?.categoryId;
  if (!cat) return "Sin categoría";
  if (typeof cat === "string") return "Categoría asignada";
  return cat.name || "Sin categoría";
};

const NORMALIZED_STATUS = {
  PENDING: { label: "Propuesta pendiente", class: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200" },
  ACCEPTED: { label: "Propuesta aceptada", class: "bg-emerald-50 dark:bg-green-900/30 text-emerald-700 dark:text-green-400 border-emerald-200" },
  REJECTED: { label: "Rechazada", class: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200" },
  CANCELLED: { label: "Cancelada", class: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700" },
  IN_PROGRESS: { label: "Trabajo en curso", class: "bg-sky-50 dark:bg-blue-900/30 text-sky-700 dark:text-blue-400 border-sky-200" },
  COMPLETED: { label: "Finalizado", class: "bg-emerald-50 dark:bg-green-900/30 text-emerald-700 dark:text-green-400 border-emerald-200" },
};

const FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "COMPLETED", label: "Finalizados" },
  { value: "CANCELLED", label: "Cancelados" },
];

export const WorkerMyJobsPage = () => {
  const { user } = useAuthStore();
  const { requireVerification } = useRequireVerification();
  const workerId = getUserId(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proposals, setProposals] = useState([]);
  const [services, setServices] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();
  const startConversation = useMessagesStore((s) => s.startConversation);
  const [messagingId, setMessagingId] = useState(null);

  const handleChat = async (e, clientId) => {
    e.stopPropagation();
    if (!workerId || !clientId) return;
    setMessagingId(clientId);
    try {
      const conversation = await startConversation(workerId, clientId);
      if (conversation) navigate("/dashboard/messages", { state: { conversation } });
    } catch {
      toast.error("No se pudo iniciar la conversación");
    } finally {
      setMessagingId(null);
    }
  };

  useEffect(() => {
    if (!workerId) return;

    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [proposalsRes, servicesRes] = await Promise.all([
          getWorkerProposals(workerId),
          getWorkerServices(workerId),
        ]);

        if (!mounted) return;
        setProposals(getArrayFromResponse(proposalsRes, ["proposals"]));
        setServices(getArrayFromResponse(servicesRes, ["services"]));
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError?.response?.data?.message || "No se pudieron cargar tus trabajos.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [workerId]);

  const mergedItems = useMemo(() => {
    const serviceRequestIds = new Set(
      (services || []).map((s) => {
        const rid = s.requestId;
        if (!rid) return null;
        if (typeof rid === "string") return rid;
        return rid._id || rid.id || null;
      }).filter(Boolean)
    );

    const normalizedProposals = (proposals || [])
      .filter((p) => {
        const sid = typeof p.serviceRequestId === "string"
          ? p.serviceRequestId
          : p.serviceRequestId?._id || p.serviceRequestId?.id;
        return sid ? !serviceRequestIds.has(sid) : true;
      })
      .map((p) => ({
        ...p,
        _type: "proposal",
        _normalizedStatus: p.status,
        _sortDate: new Date(p.createdAt).getTime(),
      }));

    const normalizedServices = (services || []).map((s) => ({
      ...s,
      _type: "service",
      _normalizedStatus: s.status,
      _sortDate: new Date(s.createdAt).getTime(),
    }));

    return [...normalizedProposals, ...normalizedServices].sort(
      (a, b) => b._sortDate - a._sortDate
    );
  }, [proposals, services]);

  const filteredItems = useMemo(() => {
    if (statusFilter === "ALL") return mergedItems;
    return mergedItems.filter((item) => item._normalizedStatus === statusFilter);
  }, [mergedItems, statusFilter]);

  const counts = useMemo(() => {
    const c = { ALL: 0, PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, ACCEPTED: 0, REJECTED: 0 };
    mergedItems.forEach((item) => {
      c.ALL += 1;
      c[item._normalizedStatus] = (c[item._normalizedStatus] || 0) + 1;
    });
    return c;
  }, [mergedItems]);

  const handleComplete = async (serviceId) => {
    if (!requireVerification("completar un servicio")) return;
    setCompletingId(serviceId);
    try {
      await completeService(serviceId);
      toast.success("Servicio marcado como completado");
      const servicesRes = await getWorkerServices(workerId);
      setServices(getArrayFromResponse(servicesRes, ["services"]));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al completar servicio");
    } finally {
      setCompletingId(null);
    }
  };

  const handleCancelConfirm = async (reason) => {
    if (!cancelTarget) return;
    if (!requireVerification("cancelar un servicio")) return;
    setCancelling(true);
    try {
      await cancelService(cancelTarget._id, reason, "WORKER");
      toast.success("Servicio cancelado");
      setCancelTarget(null);
      const servicesRes = await getWorkerServices(workerId);
      setServices(getArrayFromResponse(servicesRes, ["services"]));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cancelar servicio");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Mis Trabajos</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Propuestas enviadas y servicios activos en un solo lugar.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
          <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              <FunnelIcon className="size-5 text-gray-400 dark:text-gray-500" />
              Filtrar por estado
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const active = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                      active
                        ? "border-yellow-400 bg-yellow-400 text-gray-900"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-yellow-300 hover:bg-yellow-50"
                    }`}
                  >
                    {filter.label} ({counts[filter.value] || 0})
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Cargando trabajos...</p>
          ) : filteredItems.length ? (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const statusInfo = NORMALIZED_STATUS[item._normalizedStatus];
                const imageUrl = getImageUrl(item);
                const isService = item._type === "service";
                const isInProgress = item._normalizedStatus === "IN_PROGRESS";

                return (
                  <div
                    key={`${item._type}-${getId(item)}`}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition hover:border-yellow-300 cursor-pointer"
                    onClick={() => {
                      if (item._type === "service" && !item.requestId) return;
                      if (item._type === "proposal" && !item.serviceRequestId) return;
                      setSelectedItem(item);
                    }}
                  >
                    <div className="flex gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={getTitle(item)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                            <PhotoIcon className="size-8" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold ${statusInfo?.class || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}
                          >
                            {statusInfo?.label || item._normalizedStatus}
                          </span>
                          <span className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-bold text-yellow-700 dark:text-yellow-400">
                            {getCategoryName(item)}
                          </span>
                          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <h2 className="truncate text-base font-black text-gray-900 dark:text-gray-100">
                          {getTitle(item)}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500 dark:text-gray-400">
                          {getDescription(item)}
                        </p>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                          {isService ? formatMoney(item.finalPrice) : formatMoney(item.price)}
                        </p>
                      </div>
                    </div>

                    {isService && isInProgress && (
                      <div className="mt-4 flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                        <Button
                          size="sm"
                          onClick={() => handleComplete(getId(item))}
                          disabled={completingId === getId(item)}
                        >
                          {completingId === getId(item) ? "Completando..." : "Marcar completado"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setCancelTarget(item)}
                        >
                          Cancelar servicio
                        </Button>
                        {item.clientId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleChat(e, item.clientId?._id || item.clientId)}
                            disabled={messagingId === (item.clientId?._id || item.clientId)}
                          >
                            {messagingId === (item.clientId?._id || item.clientId) ? "Abriendo..." : "Chatear con el cliente"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <BriefcaseIcon className="mx-auto mb-4 size-12 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-bold text-gray-500 dark:text-gray-400">No hay trabajos en este filtro</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                Cuando envíes propuestas o acepten una oferta, aparecerán aquí.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <WorkerRequestDetailsModal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        job={selectedItem?._type === "proposal" ? selectedItem.serviceRequestId : null}
        service={selectedItem?._type === "service" ? selectedItem : null}
        alreadyOffered={selectedItem?._type === "proposal"}
        onOffer={() => {}}
      />

      <CancelServiceModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        loading={cancelling}
      />
    </div>
  );
};
