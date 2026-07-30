import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
  VideoCameraIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Button } from "../../shared/components/ui/Button";
import { Card, CardContent } from "../../shared/components/layout/DashboardContainer";
import { DashboardStats } from "./DashboardStats";
import { NewServiceRequestModal } from "./NewServiceRequestModal";
import { ServiceRequestDetailModal } from "./ServiceRequestDetailModal";
import { getMyServiceRequests, getClientServices, getMeetingsByUser } from "../../shared/api/user";
import { useAuthStore } from "../auth/store/authStore";
import { formatRelativeDate } from "../../shared/utils/statusBadge";
import { getMeetingReminders, getClientVerifyReminders } from "../../shared/utils/reminders";

const NORMALIZED_BADGE = {
  SEARCHING: { label: "Buscando ofertas", bg: "bg-yellow-50 dark:bg-yellow-900/30", border: "border-yellow-200 dark:border-yellow-800", text: "text-yellow-700 dark:text-yellow-400" },
  IN_PROGRESS: { label: "En curso", bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-400" },
  COMPLETED: { label: "Finalizado", bg: "bg-green-50 dark:bg-green-900/30", border: "border-green-200 dark:border-green-800", text: "text-green-700 dark:text-green-400" },
  CANCELLED: { label: "Cancelado", bg: "bg-red-50 dark:bg-red-900/30", border: "border-red-200 dark:border-red-800", text: "text-red-700 dark:text-red-400" },
};

const normalizeItem = (item, type) => {
  if (type === "serviceRequest") {
    if (item.status === "OPEN") return "SEARCHING";
    return item.status;
  }
  if (item.status === "PENDING") return "SEARCHING";
  return item.status;
};

const getRequestIdString = (service) => {
  const rid = service.requestId;
  if (!rid) return null;
  if (typeof rid === "string") return rid;
  return rid._id || rid.id || null;
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
  if (item._type === "serviceRequest") return item.serviceImage?.url || "";
  return item.requestId?.serviceImage?.url || "";
};

const getItemBudgetOrPrice = (item) => {
  if (item._type === "serviceRequest") {
    return `Q${item.budgetMin} - Q${item.budgetMax}`;
  }
  return item.finalPrice ? `Q${item.finalPrice}` : "Por definir";
};

const REMINDER_ICONS = {
  meeting: VideoCameraIcon,
  workLog: ClipboardDocumentCheckIcon,
  verifyDay: CheckCircleIcon,
};

export const ClientDashboardSummary = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUserId = user?._id || user?.id;

  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [services, setServices] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, servicesRes, meetingsRes] = await Promise.all([
        getMyServiceRequests(),
        currentUserId ? getClientServices(currentUserId) : Promise.resolve({ data: { services: [] } }),
        currentUserId ? getMeetingsByUser(currentUserId) : Promise.resolve({ data: { meetings: [] } }),
      ]);
      setRequests(requestsRes.data.data || []);
      setServices(servicesRes.data.services || []);
      setMeetings(meetingsRes.data.meetings || []);
    } catch {
      toast.error("Error al cargar tus datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  const mergedItems = useMemo(() => {
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
  }, [requests, services]);

  const stats = useMemo(() => {
    const counts = { SEARCHING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    mergedItems.forEach((item) => {
      if (item._normalizedStatus in counts) {
        counts[item._normalizedStatus]++;
      }
    });
    return [
      { label: "Solicitudes Activas", value: counts.SEARCHING, icon: ClockIcon, bg: "bg-yellow-50 dark:bg-yellow-900/30", border: "border-yellow-200 dark:border-yellow-800", color: "text-yellow-700 dark:text-yellow-400" },
      { label: "En Progreso", value: counts.IN_PROGRESS, icon: CheckCircleIcon, bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-200 dark:border-blue-800", color: "text-blue-700 dark:text-blue-400" },
      { label: "Completados", value: counts.COMPLETED, icon: CheckCircleIcon, bg: "bg-green-50 dark:bg-green-900/30", border: "border-green-200 dark:border-green-800", color: "text-green-700 dark:text-green-400" },
    ];
  }, [mergedItems]);

  const reminders = useMemo(() => {
    if (!currentUserId) return [];
    return [
      ...getMeetingReminders(meetings, currentUserId),
      ...getClientVerifyReminders(services),
    ];
  }, [meetings, services, currentUserId]);

  const previewItems = useMemo(() => mergedItems.slice(0, 3), [mergedItems]);

  const handleItemPress = (item) => {
    navigate("/dashboard/my-requests", { state: { openItemId: item._id, openItemType: item._type } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Panel de Cliente</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona tus solicitudes y servicios</p>
        </div>
        <Button size="lg" onClick={() => setOpenModal(true)}>
          <PlusIcon className="size-5" />
          Nueva Solicitud
        </Button>
      </div>

      <DashboardStats stats={stats} />

      {reminders.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="size-5 text-gray-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Recordatorios</h2>
            </div>
            <div className="space-y-3">
              {reminders.map((item) => {
                const Icon = REMINDER_ICONS[item.kind] || MapPinIcon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.route, { state: item.state })}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                  >
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${item.overdue ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
                      <Icon className={`size-5 ${item.overdue ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-md ${item.overdue ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"}`}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Cargando tus datos...</p>
          </CardContent>
        </Card>
      ) : previewItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPinIcon className="size-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Aún no hay actividad</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Creá una solicitud y cuando un trabajador la acepte, aparecerá aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Actividad reciente</h2>
            <div className="space-y-4">
              {previewItems.map((item) => {
                const badge = NORMALIZED_BADGE[item._normalizedStatus] || NORMALIZED_BADGE.SEARCHING;
                const image = getItemImage(item);
                return (
                  <motion.div
                    key={`${item._type}-${item._id}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card
                      className="cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all"
                      onClick={() => handleItemPress(item)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {image ? (
                            <img
                              src={image}
                              alt={getItemTitle(item)}
                              className="size-16 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="size-16 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0">
                              <MagnifyingGlassIcon className="size-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{getItemTitle(item)}</h3>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border} ${badge.text}`}>
                                {badge.label}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                {getItemCategory(item)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {item.createdAt ? formatRelativeDate(item.createdAt) : ""}
                              </span>
                              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                {getItemBudgetOrPrice(item)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard/my-requests")}>
            Ver todos mis servicios
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
