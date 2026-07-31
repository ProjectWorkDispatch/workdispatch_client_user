import { useState, useEffect } from "react";
import { Modal } from "../../../shared/components/ui/Modal";
import { Button } from "../../../shared/components/ui/Button";
import { DateTimePickerModal } from "../../../shared/components/ui/DateTimePickerModal";
import { getMeetingById, confirmMeeting, cancelMeeting, proposeAlternativeTime, getClientTrustStats, getReceivedReviews } from "../../../shared/api/user";
import toast from "react-hot-toast";

const formatDateTime = (iso) => {
  if (!iso) return "Por definir";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Por definir";
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "full", timeStyle: "short" }).format(d);
};

const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Por definir";
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 0 }).format(amount);
};

export const MeetingDetailModal = ({ open, onClose, meetingId, onAction }) => {
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [clientStats, setClientStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (open && meetingId) {
      setLoading(true);
      getMeetingById(meetingId)
        .then((res) => setMeeting(res.data?.data || res.data))
        .catch(() => toast.error("Error al cargar la reunión"))
        .finally(() => setLoading(false));
    }
  }, [open, meetingId]);

  const clientId = meeting?.clientId?._id || meeting?.clientId;

  useEffect(() => {
    if (!open || !clientId) return;
    let mounted = true;
    setLoadingStats(true);
    Promise.all([
      getClientTrustStats(clientId).catch(() => null),
      getReceivedReviews(clientId).catch(() => null),
    ]).then(([statsRes, reviewsRes]) => {
      if (!mounted) return;
      if (statsRes?.data?.success) setClientStats(statsRes.data.data);
      if (reviewsRes?.data?.success) setReviews(reviewsRes.data.reviews || []);
    }).finally(() => { if (mounted) setLoadingStats(false); });
    return () => { mounted = false; };
  }, [open, clientId]);

  const handleConfirm = async () => {
    if (!meeting) return;
    setActionLoading(true);
    try {
      const res = await confirmMeeting(meetingId);
      setMeeting(res.data?.data || res.data);
      toast.success("Asistencia confirmada");
      onAction?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al confirmar");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!meeting) return;
    setActionLoading(true);
    try {
      await cancelMeeting(meetingId);
      setMeeting((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
      toast.success("Reunión cancelada");
      onAction?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cancelar");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeTime = async (isoDate) => {
    if (!meeting) return;
    setActionLoading(true);
    setShowPicker(false);
    try {
      const res = await proposeAlternativeTime(meetingId, isoDate);
      setMeeting(res.data?.data || res.data);
      toast.success("Nuevo horario propuesto");
      onAction?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al proponer horario");
    } finally {
      setActionLoading(false);
    }
  };

  const sr = meeting?.serviceRequestId;
  const title = sr && typeof sr === "object" ? sr.title || "Solicitud de servicio" : "Solicitud de servicio";
  const clientObj = meeting?.clientId;
  const clientName = clientObj && typeof clientObj === "object"
    ? `${clientObj.firstName || ""} ${clientObj.lastName || ""}`.trim() || "Cliente"
    : "Cliente";
  const workerObj = meeting?.workerId;
  const workerName = workerObj && typeof workerObj === "object"
    ? `${workerObj.firstName || ""} ${workerObj.lastName || ""}`.trim() || "Trabajador"
    : "Trabajador";
  const isConfirmed = meeting?.status === "CONFIRMED";
  const isCancelled = meeting?.status === "CANCELLED";
  const srDescription = sr && typeof sr === "object" ? sr.description : "";
  const srBudgetMin = sr && typeof sr === "object" ? sr.budgetMin : null;
  const srBudgetMax = sr && typeof sr === "object" ? sr.budgetMax : null;

  const renderStars = (rating) => {
    const value = Number(rating) || 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} className={`size-3 ${value > 0 && star <= Math.round(value) ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-xs text-gray-500 ml-1">{value > 0 ? value.toFixed(1) : ""}</span>
      </div>
    );
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Detalle de la reunión"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            {meeting?.status === "PENDING" && !meeting.confirmedByWorker && (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={actionLoading}>
                  Rechazar
                </Button>
                <Button variant="outline" onClick={() => setShowPicker(true)} disabled={actionLoading}>
                  Proponer otra hora
                </Button>
                <Button onClick={handleConfirm} loading={actionLoading} disabled={actionLoading}>
                  Aceptar horario
                </Button>
              </>
            )}
            {isConfirmed && (
              <Button variant="outline" onClick={handleCancel} disabled={actionLoading}>
                Cancelar reunión
              </Button>
            )}
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando reunión...</p>
        ) : !meeting ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No se encontró la reunión.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Servicio</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</p>
              {srDescription && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{srDescription}</p>
              )}
            </div>

            {(srBudgetMin != null || srBudgetMax != null) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Presupuesto</p>
                <p className="text-lg font-black text-yellow-600 dark:text-yellow-400">{formatMoney(srBudgetMin)} - {formatMoney(srBudgetMax)}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Cliente</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{clientName}</p>
                {loadingStats ? (
                  <p className="text-xs text-gray-400 mt-1">Cargando...</p>
                ) : clientStats ? (
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      {renderStars(clientStats.ratingAverage)}
                      <span className="text-xs text-gray-500">
                        {clientStats.ratingCount > 0 ? `(${clientStats.ratingCount})` : "sin calificar aún"}
                      </span>
                    </div>
                    {clientStats.completionRate != null && (
                      <p className="text-xs text-gray-500">{Math.round(clientStats.completionRate * 100)}% completados</p>
                    )}
                    {reviews.length > 0 && (
                      <p className="text-xs text-gray-400">{reviews.length} reseña{reviews.length !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Trabajador</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{workerName}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Fecha y hora</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{formatDateTime(meeting.startTime)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Estado</p>
              {isCancelled ? (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-bold text-red-700 dark:text-red-400">
                  <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Entrevista cancelada
                </div>
              ) : isConfirmed ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-green-900/30 px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Entrevista confirmada
                  </div>
                  {meeting.meetLink && (
                    <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 text-sm font-bold text-blue-700 dark:text-blue-400 hover:underline">
                      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                      Abrir videollamada
                    </a>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-yellow-700 dark:text-yellow-400">
                    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Entrevista solicitada
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {meeting.lastProposedBy === "WORKER" ? "Propusiste: " : "Proponen: "}{formatDateTime(meeting.startTime)}
                  </p>
                  {meeting.confirmedByWorker && meeting.confirmedByClient ? null : meeting.confirmedByWorker ? (
                    <p className="text-xs italic text-yellow-600 dark:text-yellow-400">Esperando confirmación del cliente</p>
                  ) : null}
                </div>
              )}
            </div>

            {meeting?.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Notas</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{meeting.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <DateTimePickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onConfirm={handleProposeTime}
        title="Proponé otro horario"
        mode="datetime"
      />
    </>
  );
};
