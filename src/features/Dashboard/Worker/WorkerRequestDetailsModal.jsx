import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhotoIcon,
  UserCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";
import { useAcceptedProposal } from "../hooks/useAcceptedProposal";
import { STATUS_BADGE, formatRelativeDate } from "../../../shared/utils/statusBadge";
import { getGivenReviews, scheduleService, toggleWorkPlanDay } from "../../../shared/api/user";
import { useAuthStore } from "../../auth/store/authStore";
import { useMessagesStore } from "../../../shared/store/userStore.js";
import { PostServiceReviewFlow } from "../../reviews/components/PostServiceReviewFlow";
import { ReportModal } from "../../reports/components/ReportModal";

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Por definir";

  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatBudget = (request) => {
  const min = Number(request?.budgetMin);
  const max = Number(request?.budgetMax);

  if (Number.isFinite(min) && Number.isFinite(max)) {
    return `${formatMoney(min)} - ${formatMoney(max)}`;
  }

  if (Number.isFinite(max)) return formatMoney(max);
  if (Number.isFinite(min)) return formatMoney(min);
  return "Presupuesto por definir";
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const getImageUrl = (job) => {
  return job?.serviceImage?.url || job?.image?.url || job?.photo?.url || "";
};

const getClientName = (client) => {
  if (!client || typeof client === "string") return "Cliente";
  return `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Cliente";
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
  open,
  onClose,
  job,
  service,
  alreadyOffered,
  onOffer,
}) => {
  const isServiceMode = !!service;
  const activeJob = isServiceMode ? (service?.requestId || service) : job;

  const serviceRequestIdForProposal = isServiceMode
    ? (typeof service?.requestId === "string" ? service.requestId : service?.requestId?._id)
    : null;

  const { proposal: acceptedProposal, loading: proposalLoading } = useAcceptedProposal(
    serviceRequestIdForProposal
  );

  const [showProposalContext, setShowProposalContext] = useState(false);

  const { user } = useAuthStore();
  const currentUserId = user?._id || user?.id;
  const navigate = useNavigate();
  const startConversation = useMessagesStore((s) => s.startConversation);
  const [messaging, setMessaging] = useState(false);

  const handleChatWithClient = async () => {
    const clientId = service?.clientId?._id || service?.clientId;
    if (!clientId) return;
    setMessaging(true);
    try {
      const conversation = await startConversation(currentUserId, clientId);
      if (conversation) navigate("/dashboard/messages", { state: { conversation } });
    } catch {
      toast.error("No se pudo iniciar la conversación con el cliente");
    } finally {
      setMessaging(false);
    }
  };

  const imageUrl = isServiceMode
    ? (service?.requestId?.serviceImage?.url || "")
    : getImageUrl(job);

  const [localService, setLocalService] = useState(service);
  useEffect(() => { setLocalService(service); }, [service]);

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
    } finally {
      setSavingPlan(false);
    }
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

  useEffect(() => {
    if (!canReview || !currentUserId) return;
    let cancelled = false;
    getGivenReviews(currentUserId)
      .then((res) => {
        if (cancelled) return;
        const reviews = res.data?.reviews || [];
        const alreadyReviewed = reviews.some((r) => {
          const rid = typeof r.serviceId === "string" ? r.serviceId : r.serviceId?._id;
          return rid === service?._id;
        });
        setHasReviewed(alreadyReviewed);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canReview, currentUserId, service?._id]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={isServiceMode ? "Detalle del servicio" : "Informacion de la solicitud"} size="xl">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={activeJob?.title || "Imagen de la solicitud"}
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-44 flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
              <PhotoIcon className="size-10" />
              <span className="text-sm font-semibold">Sin imagen adjunta</span>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {isServiceMode && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                Servicio
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[isServiceMode ? service?.status : activeJob?.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {isServiceMode ? service?.status : activeJob?.status}
            </span>
            {activeJob?.categoryId?.name || activeJob?.customCategory ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium">
                {activeJob?.categoryId?.name || activeJob?.customCategory}
              </span>
            ) : null}
            {!isServiceMode && alreadyOffered && (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-green-900/30 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-green-400">
                Ya ofertaste
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{activeJob?.title || "Solicitud abierta"}</h3>
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
          <DetailItem
            icon={CalendarDaysIcon}
            label="Creada"
            value={formatRelativeDate(isServiceMode ? service.createdAt : activeJob?.createdAt)}
          />
          <DetailItem icon={MapPinIcon} label="Dirección" value={activeJob?.address || "No especificada"} />
          <DetailItem icon={UserCircleIcon} label="Cliente" value={isServiceMode ? getClientName(service?.clientId) : getClientName(job?.clientId || job?.client)} />
        </div>

        {isServiceMode && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setShowProposalContext(!showProposalContext)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Propuesta ganadora</span>
              {showProposalContext ? (
                <ChevronUpIcon className="size-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <ChevronDownIcon className="size-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
            {showProposalContext && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-3">
                {proposalLoading ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Cargando...</p>
                ) : acceptedProposal ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Precio ofertado</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Q{acceptedProposal.price}</span>
                    </div>
                    {acceptedProposal.message && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mensaje</span>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 italic">"{acceptedProposal.message}"</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No se encontró la propuesta original.</p>
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
                  <button
                    type="button"
                    onClick={() => handleToggleDay(day.dayNumber)}
                    className="mt-0.5 shrink-0"
                  >
                    <CheckCircleIcon
                      className={`size-5 transition-colors ${
                        day.status === "DONE"
                          ? "text-emerald-500"
                          : "text-gray-300 hover:text-emerald-400"
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Día {day.dayNumber}</span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatDate(day.date)}</span>
                      {day.status === "DONE" && (
                        <span className="rounded-full bg-emerald-100 dark:bg-green-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-green-400">Hecho</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{day.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isServiceMode && canSchedule && !showScheduleForm && (
          <Button type="button" variant="ghost" onClick={() => setShowScheduleForm(true)}>
            Programar cita y plan de trabajo
          </Button>
        )}

        {isServiceMode && showScheduleForm && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Programar cita y plan de trabajo</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">Fecha de la cita</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">Duración estimada (días)</label>
                <select
                  value={scheduleDays}
                  onChange={(e) => setScheduleDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-2 text-sm"
                >
                  {Array.from({ length: 14 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {scheduleDescs.map((desc, i) => (
                <div key={i}>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">Día {i + 1}</label>
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder={`¿Qué harás el día ${i + 1}?`}
                    value={desc}
                    onChange={(e) => {
                      const updated = [...scheduleDescs];
                      updated[i] = e.target.value;
                      setScheduleDescs(updated);
                    }}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-2 text-sm resize-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowScheduleForm(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSavePlan} disabled={savingPlan || !scheduleDate}>
                {savingPlan ? "Guardando..." : "Guardar plan"}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <div>
              {canReview && (
                hasReviewed ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Ya dejaste una reseña</span>
              ) : (
                <Button onClick={() => setReviewFlowOpen(true)}>
                  Dejar reseña
                </Button>
              )
            )}
            {isServiceMode && (service?.status === "COMPLETED" || service?.status === "CANCELLED") && (
              <Button variant="ghost" onClick={() => setReportOpen(true)}>
                Reportar
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {isServiceMode && (service?.clientId?._id || service?.clientId) && service?.status !== "CANCELLED" && (
              <Button type="button" variant="ghost" onClick={handleChatWithClient} disabled={messaging}>
                {messaging ? "Abriendo..." : "Chatear con el cliente"}
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            {!isServiceMode && (
              <Button type="button" onClick={onOffer} disabled={alreadyOffered}>
                {alreadyOffered ? "Ya ofertaste" : "Enviar oferta"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isServiceMode && (
        <PostServiceReviewFlow
          open={reviewFlowOpen}
          onClose={() => setReviewFlowOpen(false)}
          serviceId={service?._id}
          revieweredId={service?.clientId?._id}
          revieweredName={service?.clientId ? `${service.clientId.firstName} ${service.clientId.lastName}` : ""}
          onSuccess={() => {
            setHasReviewed(true);
            setReviewFlowOpen(false);
          }}
        />
      )}

      {isServiceMode && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reporteredId={service?.clientId?._id}
          reporteredName={service?.clientId ? `${service.clientId.firstName} ${service.clientId.lastName}` : ""}
        />
      )}
    </Modal>
  );
};
