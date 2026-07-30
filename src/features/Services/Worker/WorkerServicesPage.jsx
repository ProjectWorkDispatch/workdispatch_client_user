import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent } from "../../../shared/components/layout/DashboardContainer";
import { Button } from "../../../shared/components/ui/Button";
import {
  getWorkerProposals,
  getWorkerServices,
  getReviewsByReviewer,
  completeService,
  cancelService,
  getMeetingsByUser,
} from "../../../shared/api/user";
import { useAuthStore } from "../../auth/store/authStore";
import { useMessagesStore } from "../../../shared/store/userStore.js";
import { PostServiceReviewFlow } from "../../reviews/components/PostServiceReviewFlow";
import { CancelServiceModal } from "../../Dashboard/Worker/CancelServiceModal";

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

const getUserId = (user) => user?.id || user?._id || user?.userId || user?.Id || "";

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Por definir";
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 0 }).format(amount);
};

const getRequest = (item) => {
  if (item._type === "proposal") {
    const req = item.serviceRequestId;
    return req && typeof req === "object" ? req : null;
  }
  const req = item.requestId || item.serviceRequestId;
  return req && typeof req === "object" ? req : null;
};

const getClientName = (item) => {
  const client = item?.clientId;
  if (!client || typeof client === "string") return "Cliente";
  return `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Cliente";
};

const getCategoryName = (item) => {
  const request = getRequest(item);
  const category = request?.categoryId;
  if (!category) return "Sin categoría";
  if (typeof category === "string") return "Categoría asignada";
  return category.name || category.nombre || "Categoría asignada";
};

const getImageUrl = (item) => {
  const request = getRequest(item);
  return request?.serviceImage?.url || request?.image?.url || "";
};

const getTitle = (item) => {
  if (item._type === "proposal") {
    const req = item.serviceRequestId;
    if (!req || typeof req === "string") return "Solicitud asociada";
    return req.title || "Solicitud asociada";
  }
  const request = getRequest(item);
  return request?.title || item.serviceCode || "Servicio asignado";
};

const getDescription = (item) => {
  if (item._type === "proposal") {
    const req = item.serviceRequestId;
    if (!req || typeof req === "string") return "Sin descripción disponible.";
    return req.description || "Sin descripción disponible.";
  }
  const request = getRequest(item);
  return request?.description || "Sin descripción disponible.";
};

const canCompleteService = (service) => {
  const hasWorkPlan = Array.isArray(service.workPlan) && service.workPlan.length > 0;
  if (!hasWorkPlan || !service.estimatedEndDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const planEndDate = new Date(service.estimatedEndDate);
  planEndDate.setHours(0, 0, 0, 0);
  return today >= planEndDate;
};

const getCompleteBlockedReason = (service) => {
  const hasWorkPlan = Array.isArray(service.workPlan) && service.workPlan.length > 0;
  if (!hasWorkPlan) return "Define un plan de trabajo para poder completar el servicio.";
  if (!service.estimatedEndDate) return "El plan de trabajo no tiene fecha de fin.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const planEndDate = new Date(service.estimatedEndDate);
  planEndDate.setHours(0, 0, 0, 0);
  if (today < planEndDate) return `Podrás completarlo a partir del ${planEndDate.toLocaleDateString("es-GT")}.`;
  return "";
};

const getStatusLabel = (status) => {
  const labels = {
    PENDING: "Pendiente", ACCEPTED: "Aceptada", REJECTED: "Rechazada",
    CANCELLED: "Cancelada", IN_PROGRESS: "En curso", COMPLETED: "Finalizado",
  };
  return labels[status] || status || "Pendiente";
};

const statusClass = (status) => {
  const styles = {
    PENDING: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200",
    ACCEPTED: "bg-emerald-50 dark:bg-green-900/30 text-emerald-700 dark:text-green-400 border-emerald-200",
    REJECTED: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200",
    CANCELLED: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    IN_PROGRESS: "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200",
    COMPLETED: "bg-emerald-50 dark:bg-green-900/30 text-emerald-700 dark:text-green-400 border-emerald-200",
  };
  return styles[status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700";
};

const FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "COMPLETED", label: "Finalizados" },
  { value: "CANCELLED", label: "Cancelados" },
];

export const WorkerServicesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const workerId = getUserId(user);
  const startConversation = useMessagesStore((s) => s.startConversation);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proposals, setProposals] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedService, setSelectedService] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [messagingId, setMessagingId] = useState(null);

  const loadData = async () => {
    if (!workerId) return;
    setLoading(true);
    setError("");
    try {
      const [proposalsRes, servicesRes, reviewsRes, meetingsRes] = await Promise.all([
        getWorkerProposals(workerId),
        getWorkerServices(workerId),
        getReviewsByReviewer(workerId),
        getMeetingsByUser(workerId).catch(() => null),
      ]);
      setProposals(getArrayFromResponse(proposalsRes, ["proposals"]));
      setServices(getArrayFromResponse(servicesRes, ["services"]));
      setReviews(getArrayFromResponse(reviewsRes, ["reviews"]));
      if (meetingsRes?.data?.meetings) setMeetings(meetingsRes.data.meetings);
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "No se pudieron cargar tus trabajos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [workerId]);

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
        const sid = typeof p.serviceRequestId === "string" ? p.serviceRequestId : p.serviceRequestId?._id || p.serviceRequestId?.id;
        return sid ? !serviceRequestIds.has(sid) : true;
      })
      .map((p) => ({ ...p, _type: "proposal", _normalizedStatus: p.status, _sortDate: new Date(p.createdAt).getTime() }));
    const normalizedServices = (services || []).map((s) => ({ ...s, _type: "service", _normalizedStatus: s.status, _sortDate: new Date(s.createdAt).getTime() }));
    return [...normalizedProposals, ...normalizedServices].sort((a, b) => b._sortDate - a._sortDate);
  }, [proposals, services]);

  const filteredItems = useMemo(() => {
    if (statusFilter === "ALL") return mergedItems;
    return mergedItems.filter((item) => item._normalizedStatus === statusFilter);
  }, [mergedItems, statusFilter]);

  const counts = useMemo(() => {
    const c = { ALL: 0, PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, ACCEPTED: 0, REJECTED: 0 };
    mergedItems.forEach((item) => { c.ALL += 1; c[item._normalizedStatus] = (c[item._normalizedStatus] || 0) + 1; });
    return c;
  }, [mergedItems]);

  const reviewedServiceIds = useMemo(() => {
    return new Set(reviews.map((r) => getId(r?.serviceId)).filter(Boolean));
  }, [reviews]);

  const pendingInterviews = useMemo(() => {
    return (meetings || []).filter((m) => {
      if (m.status === "CANCELLED") return false;
      return !(m.proposalId?._id || m.proposalId);
    });
  }, [meetings]);

  const formatMeetingDateTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("es-GT", { dateStyle: "full", timeStyle: "short" }).format(d);
  };

  const getMeetingServiceTitle = (meeting) => {
    const sr = meeting.serviceRequestId;
    if (!sr || typeof sr === "string") return "Solicitud de servicio";
    return sr.title || "Solicitud de servicio";
  };

  const handleComplete = async (serviceId) => {
    setCompletingId(serviceId);
    try {
      await completeService(serviceId);
      toast.success("Servicio marcado como completado");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al completar servicio");
    } finally { setCompletingId(null); }
  };

  const handleCancelConfirm = async (reason) => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelService(getId(cancelTarget), reason, "WORKER");
      toast.success("Servicio cancelado");
      setCancelTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cancelar servicio");
    } finally { setCancelling(false); }
  };

  const handleChat = async (clientId) => {
    if (!workerId || !clientId) return;
    setMessagingId(clientId);
    try {
      const conversation = await startConversation(workerId, clientId);
      if (conversation) navigate("/dashboard/messages", { state: { conversation } });
    } catch { toast.error("No se pudo iniciar la conversación"); }
    finally { setMessagingId(null); }
  };

  const handleReviewCreated = (review) => {
    if (!review) return;
    setReviews((current) => [review, ...current]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Mis Trabajos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Propuestas enviadas y servicios activos en un solo lugar.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
          <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-yellow-400 border-yellow-500 text-gray-900"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-yellow-400"
              }`}
            >
              {filter.label} ({counts[filter.value] || 0})
            </button>
          );
        })}
      </div>

      {pendingInterviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Entrevistas solicitadas ({pendingInterviews.length})
          </h2>
          {pendingInterviews.map((meeting) => {
            const mId = meeting._id || meeting.id;
            const formattedTime = formatMeetingDateTime(meeting.startTime);
            const workerName = meeting.workerId
              ? `${meeting.workerId.firstName || ""} ${meeting.workerId.lastName || ""}`.trim() || "Trabajador"
              : "Trabajador";
            const isConfirmed = meeting.status === "CONFIRMED";
            return (
              <button
                key={mId}
                type="button"
                onClick={() => navigate(`/dashboard/worker-service/${mId}`)}
                className="w-full text-left rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-4 space-y-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${isConfirmed ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-yellow-100 text-yellow-800 border border-yellow-200"}`}>
                    {isConfirmed ? "Confirmada" : "Entrevista solicitada"}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{getMeetingServiceTitle(meeting)}</p>
                <p className="text-xs text-gray-500">{workerName}</p>
                {formattedTime && <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">{formattedTime}</p>}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-10 gap-2">
          <div className="size-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Cargando trabajos...</p>
        </div>
      ) : filteredItems.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => {
            const itemId = getId(item);
            const isService = item._type === "service";
            const isInProgress = item._normalizedStatus === "IN_PROGRESS";
            const isCompleted = item._normalizedStatus === "COMPLETED";
            const alreadyReviewed = reviewedServiceIds.has(itemId);
            const imageUrl = getImageUrl(item);
            const clientId = isService && item.clientId
              ? (typeof item.clientId === "string" ? item.clientId : item.clientId._id || item.clientId.id)
              : null;
            const blockedReason = isService ? getCompleteBlockedReason(item) : "";
            const completable = isService ? canCompleteService(item) : false;

            return (
              <article key={`${item._type}-${itemId}`} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    if (item._type === "proposal") navigate(`/dashboard/my-offers/${itemId}`);
                    else navigate(`/dashboard/worker-service/${itemId}`);
                  }}
                  className="w-full text-left"
                >
                  <div className="flex gap-3 p-4">
                    <div className="size-[86px] shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                      {imageUrl ? (
                        <img src={imageUrl} alt={getTitle(item)} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                          <BriefcaseIcon className="size-7" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${statusClass(item._normalizedStatus)}`}>
                          {getStatusLabel(item._normalizedStatus)}
                        </span>
                        <span className="rounded-md bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 text-[11px] font-bold text-yellow-700 dark:text-yellow-400">
                          {getCategoryName(item)}
                        </span>
                      </div>
                      <h2 className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{getTitle(item)}</h2>
                      <div className="flex items-start gap-2 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex-1 line-clamp-2 leading-relaxed">{getDescription(item)}</p>
                        {isService && clientId && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleChat(clientId); }}
                            disabled={messagingId === clientId}
                            className="shrink-0 size-7 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition disabled:opacity-50"
                          >
                            {messagingId === clientId ? (
                              <div className="size-3.5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ChatBubbleLeftRightIcon className="size-3.5 text-yellow-700 dark:text-yellow-400" />
                            )}
                          </button>
                        )}
                      </div>
                      {isService && <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1.5">{getClientName(item)}</p>}
                    </div>
                  </div>
                </button>

                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Precio</p>
                    <p className="text-base font-black text-gray-900 dark:text-gray-100">
                      {isService ? formatMoney(item.finalPrice) : formatMoney(item.price)}
                    </p>
                  </div>
                  {isService && isCompleted && (
                    alreadyReviewed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-green-900/30 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-green-400">
                        <StarIcon className="size-4" />
                        Reseña enviada
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => setSelectedService(item)}>Dejar reseña</Button>
                    )
                  )}
                </div>

                {isService && isInProgress && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-2">
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button size="sm" onClick={() => handleComplete(itemId)} disabled={completingId === itemId || !completable}>
                        {completingId === itemId ? "Completando..." : "Marcar completado"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setCancelTarget(item)}>Cancelar servicio</Button>
                    </div>
                    {!completable && <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{blockedReason}</p>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <BriefcaseIcon className="mx-auto mb-4 size-12 text-gray-400 dark:text-gray-500" />
          <p className="text-lg font-bold text-gray-500 dark:text-gray-400">No hay trabajos en este filtro</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Cuando acepten una oferta, el servicio aparecerá aquí.</p>
        </div>
      )}

      <PostServiceReviewFlow
        open={!!selectedService}
        onClose={() => setSelectedService(null)}
        serviceId={getId(selectedService)}
        revieweredId={
          selectedService?.clientId
            ? (typeof selectedService.clientId === "string" ? selectedService.clientId : selectedService.clientId._id || selectedService.clientId.id || "")
            : ""
        }
        revieweredName={
          selectedService?.clientId && typeof selectedService.clientId === "object"
            ? `${selectedService.clientId.firstName || ""} ${selectedService.clientId.lastName || ""}`.trim() || "Cliente"
            : "Cliente"
        }
        onSuccess={(review) => {
          handleReviewCreated(review);
          setSelectedService(null);
        }}
      />

      <CancelServiceModal open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancelConfirm} loading={cancelling} />
    </div>
  );
};
