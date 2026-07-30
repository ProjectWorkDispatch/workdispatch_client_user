import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhotoIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";
import { MapPicker } from "../../../shared/components/ui/MapPicker";
import { DateTimePickerModal } from "../../../shared/components/ui/DateTimePickerModal";
import { useAcceptedProposal } from "../hooks/useAcceptedProposal";
import { STATUS_BADGE } from "../../../shared/utils/statusBadge";
import { getGivenReviews, getServiceRequestMeeting, scheduleService, toggleWorkPlanDay, workerRequestMeeting, getClientTrustStats, getReceivedReviews } from "../../../shared/api/user";
import { useAuthStore } from "../../auth/store/authStore";
import { useMessagesStore } from "../../../shared/store/userStore.js";
import { PostServiceReviewFlow } from "../../reviews/components/PostServiceReviewFlow";
import { ReportModal } from "../../reports/components/ReportModal";

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Por definir";
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 0 }).format(amount);
};

const formatBudget = (request) => {
  const min = Number(request?.budgetMin);
  const max = Number(request?.budgetMax);
  if (Number.isFinite(min) && Number.isFinite(max)) return `${formatMoney(min)} - ${formatMoney(max)}`;
  if (Number.isFinite(max)) return formatMoney(max);
  if (Number.isFinite(min)) return formatMoney(min);
  return "Presupuesto por definir";
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-GT", { day: "2-digit", month: "long", year: "numeric" }).format(date);
};

const getImageUrl = (job) => job?.serviceImage?.url || job?.image?.url || job?.photo?.url || "";

const getClientName = (client) => {
  if (!client || typeof client === "string") return "Cliente";
  return `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Cliente";
};

const getClientId = (client) => {
  if (!client || typeof client === "string") return "";
  return client._id || client.id || "";
};

const StarRating = ({ rating }) => {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`size-3.5 ${star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500">{typeof rating === "number" ? rating.toFixed(1) : ""}</span>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }) => ( // eslint-disable-line no-unused-vars
  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
    <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
      <Icon className="size-4" />
      {label}
    </div>
    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</p>
  </div>
);

export const WorkerRequestDetailsModal = ({
  open, onClose, job, service, alreadyOffered, onOffer, workerId: propWorkerId,
}) => {
  const isServiceMode = !!service;
  const activeJob = isServiceMode ? (service?.requestId || service) : job;
  const imageUrl = isServiceMode ? (service?.requestId?.serviceImage?.url || "") : getImageUrl(job);
  const { user } = useAuthStore();
  const currentUserId = user?._id || user?.id;
  const workerId = propWorkerId || currentUserId;
  const navigate = useNavigate();
  const startConversation = useMessagesStore((s) => s.startConversation);

  const client = isServiceMode ? service?.clientId : (job?.clientId || job?.client);
  const clientId = getClientId(client);
  const address = activeJob?.address || "Ubicacion por confirmar";
  const lat = job?.latitude || job?.lat || activeJob?.latitude || activeJob?.lat;
  const lng = job?.longitude || job?.lng || activeJob?.longitude || activeJob?.lng;

  const [loadingStats, setLoadingStats] = useState(false);
  const [clientStats, setClientStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [existingMeeting, setExistingMeeting] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingMeeting, setLoadingMeeting] = useState(false);

  const [messaging, setMessaging] = useState(false);
  const [localService, setLocalService] = useState(service);
  useEffect(() => { setLocalService(service); }, [service]);

  const serviceRequestIdForProposal = isServiceMode
    ? (typeof service?.requestId === "string" ? service.requestId : service?.requestId?._id)
    : null;
  const { proposal: acceptedProposal, loading: proposalLoading } = useAcceptedProposal(serviceRequestIdForProposal);
  const [showProposalContext, setShowProposalContext] = useState(false);
  const canReview = isServiceMode && (localService?.status === "COMPLETED" || localService?.status === "CANCELLED");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewFlowOpen, setReviewFlowOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const hasWorkPlan = isServiceMode && Array.isArray(localService?.workPlan) && localService.workPlan.length > 0;
  const canSchedule = isServiceMode && localService && !localService.scheduledDate && localService.status !== "CANCELLED" && localService.status !== "COMPLETED";
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleDays, setScheduleDays] = useState(1);
  const [scheduleDescs, setScheduleDescs] = useState([""]);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    const arr = [];
    for (let i = 0; i < scheduleDays; i++) arr.push(scheduleDescs[i] || "");
    setScheduleDescs(arr);
  }, [scheduleDays]);

  useEffect(() => {
    if (!open || !clientId) return;
    let mounted = true;
    const load = async () => {
      setLoadingStats(true);
      setLoadingMeeting(true);
      try {
        const [statsRes, reviewsRes, meetingRes] = await Promise.all([
          getClientTrustStats(clientId),
          getReceivedReviews(clientId),
          job?._id ? getServiceRequestMeeting(job._id) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        if (statsRes?.data?.success) setClientStats(statsRes.data.data);
        if (reviewsRes?.data?.success) setReviews(reviewsRes.data.reviews || []);
        if (meetingRes?.data?.success && meetingRes.data.data) setExistingMeeting(meetingRes.data.data);
      } catch { /* empty */ }
      finally { if (mounted) { setLoadingStats(false); setLoadingMeeting(false); } }
    };
    load();
    return () => { mounted = false; };
  }, [open, clientId, job?._id]);

  useEffect(() => {
    if (!canReview || !currentUserId) return;
    let cancelled = false;
    getGivenReviews(currentUserId).then((res) => {
      if (cancelled) return;
      const reviews = res.data?.reviews || [];
      const alreadyReviewed = reviews.some((r) => {
        const rid = typeof r.serviceId === "string" ? r.serviceId : r.serviceId?._id;
        return rid === service?._id;
      });
      setHasReviewed(alreadyReviewed);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [canReview, currentUserId, service?._id]);

  const handleRequestInterview = async (startTime) => {
    if (!job?._id || !workerId || !startTime) return;
    setSending(true);
    try {
      const res = await workerRequestMeeting({ serviceRequestId: job._id, startTime });
      if (res?.data?.success) {
        toast.success("Solicitud de entrevista enviada");
        setShowPicker(false);
        const meetingRes = await getServiceRequestMeeting(job._id);
        if (meetingRes?.data?.success && meetingRes.data.data) setExistingMeeting(meetingRes.data.data);
      } else {
        toast.error(res?.data?.message || "Error al solicitar entrevista");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al solicitar entrevista");
    } finally { setSending(false); }
  };

  const handleChatWithClient = async () => {
    if (!clientId) return;
    setMessaging(true);
    try {
      const conversation = await startConversation(currentUserId, clientId);
      if (conversation) navigate("/dashboard/messages", { state: { conversation } });
    } catch { toast.error("No se pudo iniciar la conversación con el cliente"); }
    finally { setMessaging(false); }
  };

  const handleSavePlan = async () => {
    if (!scheduleDate || !localService) return;
    const payload = scheduleDescs.map((desc, i) => ({ dayNumber: i + 1, description: desc }));
    setSavingPlan(true);
    try {
      const res = await scheduleService(localService._id, scheduleDate, scheduleDays, payload);
      setLocalService(res.data.service);
      setShowScheduleForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Error al guardar el plan");
    } finally { setSavingPlan(false); }
  };

  const handleToggleDay = async (dayNumber) => {
    if (!localService) return;
    try {
      const res = await toggleWorkPlanDay(localService._id, dayNumber);
      setLocalService(res.data.service);
    } catch (err) {
      alert(err.response?.data?.message || "Error al actualizar el día");
    }
  };

  const meetingStatusLabel = (status) => {
    switch (status) {
      case "PENDING": return "Entrevista pendiente de confirmación";
      case "CONFIRMED": return "Entrevista confirmada";
      case "CANCELLED": return "Entrevista cancelada";
      default: return "";
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={isServiceMode ? "Detalle del servicio" : "Informacion de la solicitud"} size="xl">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
          {imageUrl ? (
            <img src={imageUrl} alt={activeJob?.title || "Imagen"} className="h-44 w-full object-cover" />
          ) : (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
              <PhotoIcon className="size-8" />
              <span className="text-sm font-semibold">Sin imagen adjunta</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-yellow-100 dark:bg-yellow-900/30 px-2.5 py-1 text-xs font-bold text-yellow-800 dark:text-yellow-400">
            {activeJob?.categoryId?.name || activeJob?.customCategory || "Sin categoria"}
          </span>
          {alreadyOffered && (
            <span className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-green-900/30 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-green-400">
              Ya ofertaste
            </span>
          )}
          {isServiceMode && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[service?.status] || "bg-gray-100 text-gray-600"}`}>
              <span className="size-1.5 rounded-full bg-current" />{service?.status}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">{activeJob?.title || "Solicitud abierta"}</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-gray-400">
            {activeJob?.description || "El cliente aun no agrego una descripcion detallada."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {isServiceMode ? (
            <DetailItem icon={CurrencyDollarIcon} label="Precio final" value={formatMoney(service?.finalPrice)} />
          ) : (
            <DetailItem icon={CurrencyDollarIcon} label="Presupuesto" value={formatBudget(job)} />
          )}
          <DetailItem icon={CalendarDaysIcon} label="Publicado" value={formatDate(activeJob?.createdAt)} />
          <div className="sm:col-span-2">
            <DetailItem icon={MapPinIcon} label="Ubicacion" value={address} />
          </div>
        </div>

        {lat && lng && (
          <>
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <MapPicker lat={lat} lng={lng} onLocationChange={() => {}} readOnly />
            </div>
            <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm font-bold text-yellow-700 dark:text-yellow-400 hover:underline">
              <MapPinIcon className="size-5" />
              Ver ubicación en el mapa
            </a>
          </>
        )}

        {loadingStats ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="size-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Cargando información del cliente...</span>
          </div>
        ) : client ? (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">Cliente</p>
            <div className="flex items-center gap-3">
              <UserCircleIcon className="size-9 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{getClientName(client)}</p>
                {clientStats && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={clientStats.ratingAverage} />
                    <span className="text-xs text-gray-500">
                      ({clientStats.ratingCount || 0}) {clientStats.completionRate != null ? `· ${Math.round(clientStats.completionRate * 100)}% completados` : ""}
                    </span>
                  </div>
                )}
                {reviews.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{reviews.length} reseña{reviews.length !== 1 ? "s" : ""} recibida{reviews.length !== 1 ? "s" : ""}</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {loadingMeeting ? (
          <div className="flex justify-center py-2"><div className="size-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : existingMeeting ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm font-bold text-yellow-800 dark:text-yellow-400">
            {existingMeeting.status === "CONFIRMED" ? (
              <CheckCircleIcon className="size-5 text-emerald-600" />
            ) : (
              <CalendarDaysIcon className="size-5" />
            )}
            {meetingStatusLabel(existingMeeting.status)}
          </div>
        ) : !alreadyOffered && !isServiceMode ? (
          <Button fullWidth onClick={() => setShowPicker(true)} disabled={sending}>
            {sending ? "Enviando..." : "Solicitar entrevista"}
          </Button>
        ) : null}

        {isServiceMode && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button type="button" onClick={() => setShowProposalContext(!showProposalContext)} className="flex w-full items-center justify-between p-4 text-left">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Propuesta ganadora</span>
              {showProposalContext ? <ChevronUpIcon className="size-5 text-gray-400" /> : <ChevronDownIcon className="size-5 text-gray-400" />}
            </button>
            {showProposalContext && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
                {proposalLoading ? (
                  <p className="text-sm text-gray-400">Cargando...</p>
                ) : acceptedProposal ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Precio ofertado</span>
                      <span className="text-sm font-bold text-gray-900">Q{acceptedProposal.price}</span>
                    </div>
                    {acceptedProposal.message && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Mensaje</span>
                        <p className="mt-1 text-sm text-gray-600 italic">"{acceptedProposal.message}"</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No se encontró la propuesta original.</p>
                )}
              </div>
            )}
          </div>
        )}

        {isServiceMode && hasWorkPlan && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between p-4">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Plan de trabajo</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {localService.workPlan.filter((d) => d.status === "DONE").length}/{localService.workPlan.length} completados
              </span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-2">
              {localService.workPlan.map((day) => (
                <div key={day.dayNumber} className="flex items-start gap-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3">
                  <button type="button" onClick={() => handleToggleDay(day.dayNumber)} className="mt-0.5 shrink-0">
                    <CheckCircleIcon className={`size-5 transition-colors ${day.status === "DONE" ? "text-emerald-500" : "text-gray-300 hover:text-emerald-400"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Día {day.dayNumber}</span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(day.date)}</span>
                      {day.status === "DONE" && <span className="rounded-full bg-emerald-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-green-400">Hecho</span>}
                    </div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{day.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isServiceMode && canSchedule && !showScheduleForm && (
          <Button variant="ghost" onClick={() => setShowScheduleForm(true)}>Programar cita y plan de trabajo</Button>
        )}

        {isServiceMode && showScheduleForm && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Programar cita y plan de trabajo</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">Fecha de la cita</label>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">Duración estimada (días)</label>
                <select value={scheduleDays} onChange={(e) => setScheduleDays(Number(e.target.value))} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-2 text-sm">
                  {Array.from({ length: 14 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {scheduleDescs.map((desc, i) => (
                <div key={i}>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">Día {i + 1}</label>
                  <textarea rows={2} maxLength={300} placeholder={`¿Qué harás el día ${i + 1}?`} value={desc} onChange={(e) => { const updated = [...scheduleDescs]; updated[i] = e.target.value; setScheduleDescs(updated); }} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-2 text-sm resize-none" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowScheduleForm(false)}>Cancelar</Button>
              <Button onClick={handleSavePlan} disabled={savingPlan || !scheduleDate}>{savingPlan ? "Guardando..." : "Guardar plan"}</Button>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {isServiceMode && (service?.clientId?._id || service?.clientId) && service?.status !== "CANCELLED" && (
              <Button variant="ghost" onClick={handleChatWithClient} disabled={messaging}>
                {messaging ? "Abriendo..." : "Chatear con el cliente"}
              </Button>
            )}
            {canReview && (hasReviewed ? (
              <span className="text-sm text-gray-500 dark:text-gray-400">Ya dejaste una reseña</span>
            ) : (
              <Button onClick={() => setReviewFlowOpen(true)}>Dejar reseña</Button>
            ))}
            {canReview && <Button variant="ghost" onClick={() => setReportOpen(true)}>Reportar</Button>}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            {!isServiceMode && <Button onClick={onOffer} disabled={alreadyOffered}>{alreadyOffered ? "Ya ofertaste" : "Enviar oferta"}</Button>}
          </div>
        </div>
      </div>

      <DateTimePickerModal open={showPicker} onClose={() => setShowPicker(false)}
        onConfirm={(iso) => handleRequestInterview(iso)}
        title="Seleccionar fecha y hora para la entrevista" mode="datetime" />

      {isServiceMode && (
        <PostServiceReviewFlow open={reviewFlowOpen} onClose={() => setReviewFlowOpen(false)}
          serviceId={service?._id} revieweredId={service?.clientId?._id}
          revieweredName={service?.clientId ? `${service.clientId.firstName} ${service.clientId.lastName}` : ""}
          onSuccess={() => { setHasReviewed(true); setReviewFlowOpen(false); }} />
      )}
      {isServiceMode && (
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)}
          reporteredId={service?.clientId?._id}
          reporteredName={service?.clientId ? `${service.clientId.firstName} ${service.clientId.lastName}` : ""} />
      )}
    </Modal>
  );
};
