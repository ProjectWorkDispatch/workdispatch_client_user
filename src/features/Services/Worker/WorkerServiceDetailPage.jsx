import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PencilSquareIcon,
  StarIcon as StarOutline,
  ListBulletIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import {
  Card,
  CardContent,
} from "../../../shared/components/layout/DashboardContainer";
import { MapPicker } from "../../../shared/components/ui/MapPicker";
import {
  getServiceById,
  getServiceRequestMeeting,
  confirmMeeting,
  proposeAlternativeTime,
  cancelMeeting,
  completeService,
  setupPlan,
  addWorkLog,
  editWorkLog,
  completeWorkDay,
  getClientTrustStats,
  getReceivedReviews,
} from "../../../shared/api/user";

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Por definir";
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
};

const getCategoryName = (request) => {
  const category = request?.categoryId;
  if (!category) return "Sin categoria";
  if (typeof category === "string") return "Categoria";
  return category.name || "Categoria";
};

const renderStars = (rating) => {
  const value = rating ?? 0;
  const full = Math.floor(value);
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      i < full ? (
        <StarSolid key={i} className="size-3 text-yellow-400" />
      ) : (
        <StarOutline key={i} className="size-3 text-yellow-400" />
      )
    );
  }
  return stars;
};

export const WorkerServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [service, setService] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [completing, setCompleting] = useState(false);
  const [clientStats, setClientStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showSetupPlan, setShowSetupPlan] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [workPlanLoading, setWorkPlanLoading] = useState(null);

  const [planStart, setPlanStart] = useState("");
  const [planEnd, setPlanEnd] = useState("");
  const [generalPlan, setGeneralPlan] = useState("");
  const [logDescription, setLogDescription] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const serviceRes = await getServiceById(id);
      const svc = serviceRes.data?.service || serviceRes.data;
      setService(svc);

      const srId = svc.requestId?._id || svc.requestId;
      if (srId) {
        getServiceRequestMeeting(srId)
          .then((res) => {
            if (res?.data?.data) setMeeting(res.data.data);
          })
          .catch(() => {});
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Servicio no encontrado");
      } else {
        setError(err.response?.data?.message || "Error al cargar los datos");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const request = service?.requestId || service?.serviceRequestId || {};
  const clientInfo = request.clientId || service?.clientId || {};
  const clientId = clientInfo._id || clientInfo.id || "";

  useEffect(() => {
    if (!clientId) return;
    let mounted = true;
    const load = async () => {
      setLoadingStats(true);
      try {
        const [statsRes, reviewsRes] = await Promise.all([
          getClientTrustStats(clientId),
          getReceivedReviews(clientId),
        ]);
        if (!mounted) return;
        if (statsRes?.data?.success) setClientStats(statsRes.data.data);
        if (reviewsRes?.data?.reviews) setReviews(reviewsRes.data.reviews);
      } catch {} finally {
        if (mounted) setLoadingStats(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [clientId]);

  const handleConfirm = async () => {
    if (!meeting) return;
    setMeetingLoading(true);
    try {
      const res = await confirmMeeting(meeting._id);
      toast.success("Asistencia confirmada");
      setMeeting(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al confirmar asistencia");
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleProposeTime = async () => {
    if (!meeting || !newDate) return;
    setMeetingLoading(true);
    try {
      const res = await proposeAlternativeTime(meeting._id, newDate);
      toast.success("Nuevo horario propuesto");
      setMeeting(res.data.data);
      setShowPicker(false);
      setNewDate("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al proponer horario");
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleCancelMeetingCall = async () => {
    if (!meeting) return;
    setMeetingLoading(true);
    try {
      await cancelMeeting(meeting._id);
      toast.success("Entrevista cancelada");
      setMeeting((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cancelar entrevista");
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeService(id);
      toast.success("Servicio marcado como completado");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al completar servicio");
    } finally {
      setCompleting(false);
    }
  };

  const handleSetupPlan = async () => {
    try {
      const res = await setupPlan(id, {
        estimatedStartDate: new Date(planStart).toISOString(),
        estimatedEndDate: new Date(planEnd).toISOString(),
        generalPlan: generalPlan.trim(),
      });
      const svc = res.data?.service || res.data;
      setService(svc);
      setShowSetupPlan(false);
      toast.success("Plan de trabajo guardado");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar plan");
    }
  };

  const handleAddLog = async () => {
    if (!service || !logDescription.trim()) return;
    const plan = service.workPlan || [];
    const maxDay = plan.reduce((max, d) => Math.max(max, d.dayNumber || 0), 0);
    const nextDay = maxDay + 1;
    let autoDate;
    if (service.estimatedStartDate) {
      const d = new Date(service.estimatedStartDate);
      d.setDate(d.getDate() + (nextDay - 1));
      autoDate = d.toISOString();
    } else {
      autoDate = new Date().toISOString();
    }
    try {
      const res = await addWorkLog(id, { date: autoDate, description: logDescription.trim() });
      const svc = res.data?.service || res.data;
      setService(svc);
      setShowAddLog(false);
      setLogDescription("");
      setEditingLog(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar entrada");
    }
  };

  const handleEditLog = async () => {
    if (!editingLog || !logDescription.trim()) return;
    try {
      const res = await editWorkLog(id, editingLog.dayNumber, { description: logDescription.trim() });
      const svc = res.data?.service || res.data;
      setService(svc);
      setShowAddLog(false);
      setLogDescription("");
      setEditingLog(null);
      toast.success("Entrada actualizada");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al editar entrada");
    }
  };

  const handleCompleteDay = async (dayNumber) => {
    setWorkPlanLoading(`complete-${dayNumber}`);
    try {
      const res = await completeWorkDay(id, dayNumber);
      const svc = res.data?.service || res.data;
      setService(svc);
      toast.success(`Dia ${dayNumber} marcado como completado`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al completar el dia");
    } finally {
      setWorkPlanLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Cargando servicio...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <ExclamationTriangleIcon className="size-10 text-gray-400 dark:text-gray-500" />
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{error || "Servicio no encontrado"}</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/worker-service")}
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-500"
        >
          Volver
        </button>
      </div>
    );
  }

  const imageUrl = request.serviceImage?.url || "";
  const formattedTime = formatDateTime(meeting?.startTime);
  const isInProgress = service.status === "IN_PROGRESS";
  const isCompleted = service.status === "COMPLETED";
  const hasWorkPlan = Array.isArray(service.workPlan) && service.workPlan.length > 0;
  const planEndDateReached = (() => {
    if (!service.estimatedEndDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const planEndDate = new Date(service.estimatedEndDate);
    planEndDate.setHours(0, 0, 0, 0);
    return today >= planEndDate;
  })();
  const canComplete = hasWorkPlan && planEndDateReached;
  const totalPlanDays = (() => {
    if (!service.estimatedStartDate || !service.estimatedEndDate) return Infinity;
    const start = new Date(service.estimatedStartDate);
    const end = new Date(service.estimatedEndDate);
    return Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  })();

  const completeBlockedReason = !hasWorkPlan
    ? "Primero define un plan de trabajo para poder completar el servicio."
    : !planEndDateReached
      ? `Podras completarlo a partir del ${new Date(service.estimatedEndDate).toLocaleDateString("es-GT")}.`
      : "";

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/worker-service")}
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeftIcon className="size-4" />
        Volver
      </button>

      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">{request.title || "Servicio"}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
            isCompleted
              ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              : isInProgress
                ? "border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
                : "border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
          }`}>
            {isCompleted ? "Finalizado" : isInProgress ? "En curso" : service.status}
          </span>
          <span className="inline-flex rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1 text-xs font-bold text-gray-600 dark:text-gray-400">
            {getCategoryName(request)}
          </span>
        </div>
      </div>

      {imageUrl && (
        <img src={imageUrl} alt={request.title || "Servicio"} className="w-full rounded-xl object-cover" style={{ maxHeight: 240 }} />
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">Descripcion</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{request.description || "Sin descripcion"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">Precio acordado</h2>
          <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{formatMoney(service.finalPrice || service.price)}</p>
        </CardContent>
      </Card>

      {request.latitude && request.longitude && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">Ubicacion</h2>
            <MapPicker lat={request.latitude} lng={request.longitude} onLocationChange={() => {}} readOnly />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-yellow-400 dark:border-yellow-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-bold text-yellow-700 dark:text-yellow-400 transition hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            >
              <MapPinIcon className="size-5" />
              Ver ubicacion en el mapa
            </a>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">Informacion</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Presupuesto</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatMoney(request.budgetMin)} - {formatMoney(request.budgetMax)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Direccion</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{request.address || "No especificada"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {clientInfo.firstName && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">Cliente</h2>
            {loadingStats ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando informacion del cliente...</p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <span className="text-lg font-bold text-gray-500 dark:text-gray-300">{clientInfo.firstName?.charAt(0)}{clientInfo.lastName?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{clientInfo.firstName} {clientInfo.lastName}</p>
                  {clientStats && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">{renderStars(clientStats.ratingAverage)}</div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({clientStats.ratingCount || 0}){clientStats.completionRate != null ? ` · ${Math.round(clientStats.completionRate * 100)}% completados` : ""}
                      </span>
                    </div>
                  )}
                  {reviews.length > 0 && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{reviews.length} reseña{reviews.length !== 1 ? "s" : ""} recibida{reviews.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {meeting && meeting.status !== "CANCELLED" && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100">Entrevista</h2>
            {meeting.status === "CONFIRMED" ? (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Entrevista confirmada</span>
                </div>
                {formattedTime && <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">{formattedTime}</p>}
                {meeting.meetLink && (
                  <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-bold text-blue-600 dark:text-blue-400 underline">Abrir videollamada</a>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Entrevista solicitada</span>
                </div>
                {formattedTime && <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">{meeting.lastProposedBy === "WORKER" ? "Propusiste: " : "Proponen: "}{formattedTime}</p>}
                {meeting.confirmedByWorker && meeting.confirmedByClient ? null : meeting.confirmedByWorker ? (
                  <p className="mt-1 text-sm italic text-yellow-600 dark:text-yellow-400">Esperando confirmacion del cliente</p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={handleConfirm} disabled={meetingLoading} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                        {meetingLoading ? "..." : "Aceptar horario"}
                      </button>
                      <button type="button" onClick={handleCancelMeetingCall} disabled={meetingLoading} className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                        Rechazar
                      </button>
                    </div>
                    <button type="button" onClick={() => setShowPicker(true)} disabled={meetingLoading} className="rounded-lg border border-yellow-400 dark:border-yellow-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-bold text-yellow-700 dark:text-yellow-400 transition hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-50">
                      Proponer hora
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showPicker && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-gray-100">Proponer nuevo horario</h2>
            <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mb-3 h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100" />
            <div className="flex gap-2">
              <button type="button" onClick={handleProposeTime} disabled={!newDate || meetingLoading} className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-500 disabled:opacity-50">
                {meetingLoading ? "..." : "Proponer"}
              </button>
              <button type="button" onClick={() => { setShowPicker(false); setNewDate(""); }} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                Cancelar
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {isInProgress && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
              <ListBulletIcon className="size-5" />
              Plan de trabajo
            </h2>

            {!service.estimatedStartDate ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Todavia no definiste un plan de trabajo.</p>
                <button type="button" onClick={() => { setShowSetupPlan(true); setPlanStart(""); setPlanEnd(""); setGeneralPlan(""); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700">
                  <CalendarDaysIcon className="size-4" />
                  Crear plan de trabajo
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Inicio</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{new Date(service.estimatedStartDate).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className="text-gray-400 dark:text-gray-500">&rarr;</span>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fin</p>
                    <p className="font-bold text-gray-900 dark:text-gray-100">{service.estimatedEndDate ? new Date(service.estimatedEndDate).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" }) : "Sin definir"}</p>
                  </div>
                </div>

                {service.generalPlan && (
                  <div className="mb-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Plan general</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{service.generalPlan}</p>
                  </div>
                )}

                <button type="button" onClick={() => { setShowSetupPlan(true); setPlanStart(service.estimatedStartDate || ""); setPlanEnd(service.estimatedEndDate || ""); setGeneralPlan(service.generalPlan || ""); }} className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <PencilSquareIcon className="size-3" />
                  Editar plan
                </button>

                {Array.isArray(service.workPlan) && service.workPlan.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Registro diario</h3>
                    {[...service.workPlan].sort((a, b) => a.dayNumber - b.dayNumber).map((day) => {
                      const isPending = day.status === "PENDING";
                      const isDone = day.status === "DONE";
                      const isVerified = day.status === "VERIFIED";
                      const isDisputed = day.status === "DISPUTED";
                      const now = new Date(); now.setHours(23, 59, 59, 999);
                      const isFutureDay = day.date ? new Date(day.date).getTime() > now.getTime() : false;

                      return (
                        <div key={day.dayNumber} className={`rounded-lg border p-3 ${
                          isDone
                            ? "border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
                            : isVerified
                              ? "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                              : isDisputed
                                ? "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                                : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40"
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Dia {day.dayNumber}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(day.date).toLocaleDateString("es-GT", { day: "2-digit", month: "short" })}
                              </span>
                            </div>
                            {isDone && <span className="rounded-md bg-emerald-100 dark:bg-emerald-800/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Completado</span>}
                            {isVerified && <span className="rounded-md bg-blue-100 dark:bg-blue-800/50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">Verificado</span>}
                            {isDisputed && <span className="rounded-md bg-red-100 dark:bg-red-800/50 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">Disputado</span>}
                            {isPending && <span className="rounded-md bg-yellow-100 dark:bg-yellow-800/50 px-2 py-0.5 text-[10px] font-bold text-yellow-700 dark:text-yellow-300">Pendiente</span>}
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{day.description}</p>
                          {isPending && !isFutureDay && (
                            <div className="mt-2 flex gap-2">
                              <button type="button" onClick={() => handleCompleteDay(day.dayNumber)} disabled={workPlanLoading === `complete-${day.dayNumber}`} className="rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-gray-900 transition hover:bg-yellow-500 disabled:opacity-50">
                                {workPlanLoading === `complete-${day.dayNumber}` ? "..." : "Marcar completado"}
                              </button>
                              <button type="button" onClick={() => { setEditingLog(day); setLogDescription(day.description); setShowAddLog(true); }} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700">
                                Editar
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(!Array.isArray(service.workPlan) || service.workPlan.length < totalPlanDays) && (
                  <button type="button" onClick={() => { setEditingLog(null); setLogDescription(""); setShowAddLog(true); }} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700">
                    Agregar entrada diaria
                  </button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {showSetupPlan && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">
              {service?.estimatedStartDate ? "Editar plan de trabajo" : "Crear plan de trabajo"}
            </h2>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Fecha inicio</label>
                <input type="date" value={planStart ? new Date(planStart).toISOString().split("T")[0] : ""} onChange={(e) => setPlanStart(new Date(e.target.value).toISOString())} className="h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Fecha fin</label>
                <input type="date" value={planEnd ? new Date(planEnd).toISOString().split("T")[0] : ""} onChange={(e) => setPlanEnd(new Date(e.target.value).toISOString())} className="h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100" />
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Plan general (opcional)</label>
              <textarea value={generalPlan} onChange={(e) => setGeneralPlan(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" placeholder="Describe el trabajo general que vas a realizar..." />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSetupPlan} disabled={!planStart || !planEnd} className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-500 disabled:opacity-50">
                Guardar plan
              </button>
              <button type="button" onClick={() => setShowSetupPlan(false)} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                Cancelar
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddLog && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-gray-100">
              {editingLog ? "Editar entrada diaria" : "Agregar entrada diaria"}
            </h2>
            <textarea value={logDescription} onChange={(e) => setLogDescription(e.target.value)} rows={3} maxLength={300} className="mb-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100" placeholder="Ej: Lije y prepare las paredes para pintar..." />
            <p className="mb-3 text-right text-xs text-gray-400 dark:text-gray-500">{logDescription.length}/300</p>
            <div className="flex gap-2">
              <button type="button" onClick={editingLog ? handleEditLog : handleAddLog} disabled={!logDescription.trim()} className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-500 disabled:opacity-50">
                Guardar
              </button>
              <button type="button" onClick={() => { setShowAddLog(false); setEditingLog(null); setLogDescription(""); }} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                Cancelar
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {isInProgress && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-gray-100">Acciones</h2>
            <button type="button" onClick={handleComplete} disabled={completing || !canComplete} className="w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-yellow-500 disabled:opacity-50">
              {completing ? "Completando..." : "Marcar como completado"}
            </button>
            {!canComplete && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{completeBlockedReason}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};