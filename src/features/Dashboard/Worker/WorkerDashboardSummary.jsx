import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardDocumentCheckIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Card, CardContent } from "../../../shared/components/layout/DashboardContainer";
import { getWorkerProposals, getWorkerServices, getMeetingsByUser } from "../../../shared/api/user";
import { getMeetingReminders, getWorkerLogReminders } from "../../../shared/utils/reminders";
import { DashboardStats } from "../DashboardStats";

const getArrayFromResponse = (response, keys = []) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getUserId = (user) => user?.id || user?._id || user?.userId || user?.Id;

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Por definir";
  return new Intl.NumberFormat("es-GT", {
    style: "currency", currency: "GTQ", maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusLabel = (status) => {
  const labels = {
    PENDING: "Pendiente", ACCEPTED: "Aceptada", REJECTED: "Rechazada",
    CANCELLED: "Cancelada", IN_PROGRESS: "En curso", COMPLETED: "Completada",
  };
  return labels[status] || status || "Pendiente";
};

const statusClass = (status) => {
  const styles = {
    PENDING: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200",
    ACCEPTED: "bg-emerald-50 dark:bg-green-900/30 text-emerald-700 dark:text-green-400 border-emerald-200",
    REJECTED: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200",
    CANCELLED: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    IN_PROGRESS: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200",
    COMPLETED: "bg-emerald-50 dark:bg-green-900/30 text-emerald-700 dark:text-green-400 border-emerald-200",
  };
  return styles[status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700";
};

const REMINDER_ICONS = {
  meeting: ClipboardDocumentCheckIcon,
  workLog: ClockIcon,
};

export const WorkerDashboardSummary = ({ user }) => {
  const navigate = useNavigate();
  const workerId = getUserId(user);
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [services, setServices] = useState([]);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    if (!workerId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [proposalsRes, servicesRes, meetingsRes] = await Promise.all([
        getWorkerProposals(workerId),
        getWorkerServices(workerId),
        getMeetingsByUser(workerId),
      ]);
      if (!mounted) return;
      setProposals(getArrayFromResponse(proposalsRes, ["proposals"]));
      setServices(getArrayFromResponse(servicesRes, ["services", "service"]));
      setMeetings(getArrayFromResponse(meetingsRes, ["meetings"]));
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [workerId]);

  const pendingProposals = proposals.filter((p) => p?.status === "PENDING");
  const activeServices = services.filter((s) => s?.status === "IN_PROGRESS");

  const stats = [
    { label: "Mis Ofertas", value: pendingProposals.length, icon: ClipboardDocumentCheckIcon, bg: "bg-gray-100 dark:bg-gray-700", border: "border-gray-300 dark:border-gray-600", color: "text-gray-700 dark:text-gray-300" },
    { label: "En Curso", value: activeServices.length, icon: ClockIcon, bg: "bg-gray-200 dark:bg-gray-600", border: "border-gray-400 dark:border-gray-500", color: "text-gray-900 dark:text-gray-100" },
  ];

  const reminders = useMemo(
    () => [...getMeetingReminders(meetings, workerId), ...getWorkerLogReminders(services)],
    [meetings, services, workerId]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Inicio</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Revisa tus ofertas y trabajos en curso</p>
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
                    onClick={() => navigate(item.route)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                  >
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${item.overdue ? "bg-red-100 dark:bg-red-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"}`}>
                      <Icon className={`size-5 ${item.overdue ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Estado de tus ofertas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Seguimiento rapido de propuestas enviadas.</p>
            {loading ? (
              <p className="text-sm text-gray-400 italic">Cargando...</p>
            ) : proposals.length ? (
              <div className="space-y-3">
                {proposals.slice(0, 4).map((proposal) => (
                  <div key={proposal._id || proposal.id} className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                          {proposal?.serviceRequestId?.title || "Oferta enviada"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatMoney(proposal?.price)}</p>
                      </div>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${statusClass(proposal?.status)}`}>
                        {getStatusLabel(proposal?.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">Aun no hay ofertas registradas.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Trabajos en curso</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Servicios activos que necesitan seguimiento.</p>
            {loading ? (
              <p className="text-sm text-gray-400 italic">Cargando...</p>
            ) : activeServices.length ? (
              <div className="space-y-3">
                {activeServices.slice(0, 4).map((service) => (
                  <div key={service._id || service.id} className="border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                      {service?.requestId?.title || service?.serviceCode || "Trabajo en curso"}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatMoney(service?.finalPrice)}</p>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${statusClass(service?.status)}`}>
                        {getStatusLabel(service?.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No tienes trabajos en curso.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
