import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ClockIcon, MapPinIcon, VideoCameraIcon, ChatBubbleLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Button } from "../../shared/components/ui/Button";
import { Card, CardContent } from "../../shared/components/layout/DashboardContainer";
import { Modal } from "../../shared/components/ui/Modal";
import { MapPicker } from "../../shared/components/ui/MapPicker";
import { getServiceRequestById, getProposalsForRequest, acceptProposal, rejectProposal, requestMeeting, confirmMeeting, proposeAlternativeTime, cancelMeeting, getServiceRequestMeeting, getWorkerTrustStats, getReceivedReviews } from "../../shared/api/user";
import { STATUS_BADGE, formatRelativeDate } from "../../shared/utils/statusBadge";
import { useAuthStore } from "../auth/store/authStore";
import { useMessagesStore } from "../../shared/store/userStore.js";
import { useRequireVerification } from "../verification/hooks/useRequireVerification";
import { PostServiceReviewFlow } from "../reviews/components/PostServiceReviewFlow";
import { ReportModal } from "../reports/components/ReportModal";

const StarRating = ({ rating }) => {
  if (!rating) return <span className="text-sm text-gray-400 dark:text-gray-500">Sin calificación</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={`size-4 ${star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">{typeof rating === "number" ? rating.toFixed(1) : ""}</span>
    </div>
  );
};

const formatDateTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "full", timeStyle: "short" }).format(d);
};

export const ServiceRequestDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { requireVerification } = useRequireVerification();
  const startConversation = useMessagesStore((s) => s.startConversation);
  const currentUserId = user?._id || user?.id;

  const [serviceRequest, setServiceRequest] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [messaging, setMessaging] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);
  const [pickerDate, setPickerDate] = useState("");
  const [meetingsByProposal, setMeetingsByProposal] = useState({});
  const [srMeeting, setSrMeeting] = useState(null);
  const [workerStats, setWorkerStats] = useState({});
  const [workerReviews, setWorkerReviews] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMeetingId, setDatePickerMeetingId] = useState(null);
  const [proposeDate, setProposeDate] = useState("");
  const [reviewFlowOpen, setReviewFlowOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestRes, proposalsRes, srMeetingRes] = await Promise.all([
        getServiceRequestById(id),
        getProposalsForRequest(id),
        getServiceRequestMeeting(id).catch(() => null),
      ]);
      setServiceRequest(requestRes.data.data || requestRes.data);
      const proposalsData = proposalsRes.data.proposals || [];
      setProposals(proposalsData);
      if (srMeetingRes?.data?.data) setSrMeeting(srMeetingRes.data.data);

      const statsMap = {};
      const reviewsMap = {};
      await Promise.all(proposalsData.map(async (p) => {
        const wid = p.workerId?._id || p.workerId;
        if (!wid) return;
        try {
          const [statsRes, reviewsRes] = await Promise.all([
            getWorkerTrustStats(wid),
            getReceivedReviews(wid),
          ]);
          if (statsRes?.data?.success) statsMap[wid] = statsRes.data.data;
          if (reviewsRes?.data?.reviews) reviewsMap[wid] = reviewsRes.data.reviews;
        } catch { /* skip failed stats for individual workers */ }
      }));
      setWorkerStats(statsMap);
      setWorkerReviews(reviewsMap);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        setError(err.response?.data?.message || "Solicitud no encontrada");
      } else {
        toast.error("Error al cargar los datos");
        setError("Error al cargar los datos");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAccept = async (proposalId) => {
    if (!requireVerification("aceptar una propuesta")) return;
    setActionLoading(proposalId);
    try {
      await acceptProposal(proposalId);
      toast.success("Propuesta aceptada");
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al aceptar propuesta");
    } finally { setActionLoading(null); }
  };

  const handleReject = async (proposalId, reason) => {
    if (!requireVerification("rechazar una propuesta")) return;
    setActionLoading(proposalId);
    try {
      await rejectProposal(proposalId, reason);
      toast.success("Propuesta rechazada");
      setRejectTarget(null); setRejectReason("");
      const proposalsRes = await getProposalsForRequest(id);
      setProposals(proposalsRes.data.proposals || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al rechazar propuesta");
    } finally { setActionLoading(null); }
  };

  const handleChatWithWorker = async (workerId) => {
    if (!currentUserId || !workerId) return;
    setMessaging(true);
    try {
      const conversation = await startConversation(currentUserId, workerId);
      if (conversation) navigate("/dashboard/messages", { state: { conversation } });
    } catch { toast.error("No se pudo iniciar la conversación"); }
    finally { setMessaging(false); }
  };

  const handleRequestMeeting = async () => {
    if (!pickerTarget || !pickerDate) return;
    const { proposalId } = pickerTarget;
    setMeetingLoading(proposalId);
    try {
      const res = await requestMeeting(proposalId, pickerDate);
      toast.success("Entrevista solicitada");
      setMeetingsByProposal((prev) => ({ ...prev, [proposalId]: res.data.data }));
      setPickerTarget(null); setPickerDate("");
    } catch (err) { toast.error(err.response?.data?.message || "Error al solicitar entrevista"); }
    finally { setMeetingLoading(null); }
  };

  const handleConfirmMeeting = async (meetingId) => {
    setMeetingLoading("confirm");
    try {
      const res = await confirmMeeting(meetingId);
      toast.success("Asistencia confirmada");
      const updated = res.data.data;
      if (pickerTarget?.proposalId) {
        setMeetingsByProposal((prev) => ({ ...prev, [pickerTarget.proposalId]: updated }));
      } else if (srMeeting) setSrMeeting(updated);
    } catch (err) { toast.error(err.response?.data?.message || "Error al confirmar"); }
    finally { setMeetingLoading(null); }
  };

  const handleProposeTime = async () => {
    if (!proposeDate || !datePickerMeetingId) return;
    setMeetingLoading("propose");
    try {
      const res = await proposeAlternativeTime(datePickerMeetingId, proposeDate);
      toast.success("Nuevo horario propuesto");
      setShowDatePicker(false); setDatePickerMeetingId(null); setProposeDate("");
      const updated = res.data.data;
      for (const key of Object.keys(meetingsByProposal)) {
        if (meetingsByProposal[key]._id === datePickerMeetingId) {
          setMeetingsByProposal((prev) => ({ ...prev, [key]: updated }));
          return;
        }
      }
      if (srMeeting?._id === datePickerMeetingId) setSrMeeting(updated);
    } catch (err) { toast.error(err.response?.data?.message || "Error al proponer horario"); }
    finally { setMeetingLoading(null); }
  };

  const handleCancelMeeting = async (meetingId) => {
    setMeetingLoading("cancel");
    try {
      await cancelMeeting(meetingId);
      toast.success("Entrevista cancelada");
      for (const key of Object.keys(meetingsByProposal)) {
        if (meetingsByProposal[key]._id === meetingId) {
          setMeetingsByProposal((prev) => ({ ...prev, [key]: { ...prev[key], status: "CANCELLED" } }));
          return;
        }
      }
      if (srMeeting?._id === meetingId) setSrMeeting(null);
    } catch (err) { toast.error(err.response?.data?.message || "Error al cancelar"); }
    finally { setMeetingLoading(null); }
  };

  const pendingProposals = proposals.filter((p) => p.status === "PENDING");
  const acceptedProposal = proposals.find((p) => p.status === "ACCEPTED");
  const isAccepted = !!acceptedProposal || serviceRequest?.status === "IN_PROGRESS";
  const isCompleted = serviceRequest?.status === "COMPLETED" || serviceRequest?.status === "CANCELLED";
  const acceptedWorkerId = acceptedProposal?.workerId?._id || acceptedProposal?.workerId;

  const renderMeetingSection = (meeting) => {
    if (!meeting || meeting.status === "CANCELLED") return null;
    const formattedTime = formatDateTime(meeting.startTime);
    return (
      <div className="mt-3 rounded-lg border p-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Entrevista</h3>
        {meeting.status === "CONFIRMED" ? (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircleIcon className="size-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Confirmada</span>
            </div>
            {formattedTime && <p className="text-sm text-emerald-600 dark:text-emerald-400">{formattedTime}</p>}
            {meeting.meetLink && (
              <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-blue-600 underline">
                <VideoCameraIcon className="size-4" /> Abrir Google Meet
              </a>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <ClockIcon className="size-4 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Solicitada</span>
            </div>
            {formattedTime && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                {meeting.lastProposedBy === "CLIENT" ? "Propusiste: " : "Proponen: "}{formattedTime}
              </p>
            )}
            {!meeting.confirmedByClient && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleConfirmMeeting(meeting._id)} disabled={meetingLoading === "confirm"} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {meetingLoading === "confirm" ? "..." : "Aceptar horario"}
                </button>
                <button type="button" onClick={() => { setDatePickerMeetingId(meeting._id); setShowDatePicker(true); }} disabled={meetingLoading === "propose"} className="rounded-lg border border-yellow-400 bg-white px-3 py-1.5 text-xs font-bold text-yellow-700 hover:bg-yellow-50 disabled:opacity-50">
                  Proponer otra hora
                </button>
                <button type="button" onClick={() => handleCancelMeeting(meeting._id)} disabled={meetingLoading === "cancel"} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Rechazar
                </button>
              </div>
            )}
            {meeting.confirmedByWorker && meeting.confirmedByClient && (
              <p className="text-xs italic text-emerald-600">Ambos confirmaron</p>
            )}
            {meeting.confirmedByClient && !meeting.confirmedByWorker && (
              <p className="text-xs italic text-yellow-600">Esperando confirmación del trabajador</p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">Cargando solicitud...</p>
      </CardContent></Card>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard/my-requests")}><ArrowLeftIcon className="size-4" /> Volver</Button>
        <Card><CardContent className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{error}</p>
          <Button onClick={() => navigate("/dashboard/my-requests")}>Volver a Mis Solicitudes</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/dashboard/my-requests")}><ArrowLeftIcon className="size-4" /> Volver</Button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">{serviceRequest.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[serviceRequest.status] || "bg-gray-100 text-gray-600"}`}>
              <span className="size-1.5 rounded-full bg-current" />{serviceRequest.status}
            </span>
            {(serviceRequest.categoryId?.name || serviceRequest.customCategory) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium">
                {serviceRequest.categoryId?.name || serviceRequest.customCategory}
              </span>
            )}
          </div>
        </div>
        {isCompleted && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setReviewFlowOpen(true)}>Dejar reseña</Button>
            {acceptedWorkerId && <Button variant="outline" size="sm" onClick={() => setReportTarget(acceptedWorkerId)}>Reportar</Button>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {serviceRequest.serviceImage?.url && (
            <Card><img src={serviceRequest.serviceImage.url} alt={serviceRequest.title} className="w-full h-48 object-cover rounded-xl" /></Card>
          )}
          <Card><CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Descripción</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{serviceRequest.description}</p>
          </CardContent></Card>

          {serviceRequest.latitude && serviceRequest.longitude && (
            <Card><CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Ubicación</h2>
              <MapPicker lat={serviceRequest.latitude} lng={serviceRequest.longitude} onLocationChange={() => {}} readOnly />
            </CardContent></Card>
          )}
        </div>

        <div className="space-y-6">
          <Card><CardContent className="p-6 space-y-4">
            <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Presupuesto</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Q{serviceRequest.budgetMin} - Q{serviceRequest.budgetMax}</p></div>
            <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dirección</p>
              <p className="text-gray-700 dark:text-gray-300">{serviceRequest.address || "No especificada"}</p></div>
            <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Creada</p>
              <p className="text-gray-700 dark:text-gray-300">{formatRelativeDate(serviceRequest.createdAt)}</p></div>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Ofertas recibidas</h2>

            {isAccepted && acceptedProposal ? (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-400 font-medium mb-2">Oferta aceptada</p>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {acceptedProposal.workerId?.firstName} {acceptedProposal.workerId?.lastName}
                  </p>
                  <StarRating rating={acceptedProposal.workerId?.ratingAverage} />
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">Q{acceptedProposal.price}</p>
                  {acceptedProposal.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{acceptedProposal.message}"</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button size="sm" onClick={() => handleChatWithWorker(acceptedWorkerId)} disabled={messaging}>
                      <ChatBubbleLeftIcon className="size-4" /> {messaging ? "Abriendo..." : "Chatear"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/worker/${acceptedWorkerId}`)}>
                      Ver perfil
                    </Button>
                  </div>
                  {srMeeting && renderMeetingSection(srMeeting)}
                </div>
              </div>
            ) : serviceRequest.status === "OPEN" && pendingProposals.length > 0 ? (
              <div className="space-y-4">
                {pendingProposals.map((proposal) => {
                  const wid = proposal.workerId?._id || proposal.workerId;
                  const stats = workerStats[wid];
                  const reviews = workerReviews[wid];
                  const proposalMeeting = meetingsByProposal[proposal._id];
                  return (
                    <div key={proposal._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <button type="button" onClick={() => navigate(`/dashboard/worker/${wid}`)} className="font-medium text-gray-900 dark:text-gray-100 hover:text-yellow-600 text-left">
                            {proposal.workerId?.firstName} {proposal.workerId?.lastName}
                          </button>
                          <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={proposal.workerId?.ratingAverage} />
                            {stats && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({stats.ratingCount || 0}) {stats.completionRate != null ? `· ${Math.round(stats.completionRate * 100)}% completados` : ""}
                              </span>
                            )}
                          </div>
                          {reviews && reviews.length > 0 && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {reviews.length} reseña{reviews.length !== 1 ? "s" : ""} recibida{reviews.length !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 shrink-0 ml-3">Q{proposal.price}</p>
                      </div>
                      {proposal.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-3">"{proposal.message}"</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => handleAccept(proposal._id)} disabled={actionLoading === proposal._id}>
                          {actionLoading === proposal._id ? "..." : "Aceptar"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRejectTarget(proposal._id)} disabled={actionLoading === proposal._id}>
                          Rechazar
                        </Button>
                        {!proposalMeeting && (
                          <Button size="sm" variant="outline" onClick={() => setPickerTarget({ proposalId: proposal._id })} disabled={meetingLoading === proposal._id}>
                            {meetingLoading === proposal._id ? "..." : "Entrevista"}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/worker/${wid}`)}>
                          Ver perfil
                        </Button>
                      </div>
                      {renderMeetingSection(proposalMeeting)}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Todavía no has recibido ofertas para esta solicitud.</p>
            )}
          </CardContent></Card>
        </div>
      </div>

      <Modal open={!!pickerTarget} onClose={() => { setPickerTarget(null); setPickerDate(""); }} title="Solicitar entrevista" size="sm"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setPickerTarget(null); setPickerDate(""); }}>Cancelar</Button>
          <Button disabled={!pickerDate || meetingLoading === pickerTarget?.proposalId} onClick={handleRequestMeeting}>
            {meetingLoading === pickerTarget?.proposalId ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </div>}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Elegí la fecha y hora para la entrevista.</p>
        <input type="datetime-local" value={pickerDate} onChange={(e) => setPickerDate(e.target.value)} className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm" />
      </Modal>

      <Modal open={showDatePicker} onClose={() => { setShowDatePicker(false); setDatePickerMeetingId(null); setProposeDate(""); }} title="Proponer otro horario" size="sm"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setShowDatePicker(false); setDatePickerMeetingId(null); setProposeDate(""); }}>Cancelar</Button>
          <Button disabled={!proposeDate || meetingLoading === "propose"} onClick={handleProposeTime}>
            {meetingLoading === "propose" ? "..." : "Proponer"}
          </Button>
        </div>}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Elegí una nueva fecha y hora.</p>
        <input type="datetime-local" value={proposeDate} onChange={(e) => setProposeDate(e.target.value)} className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm" />
      </Modal>

      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason(""); }} title="Rechazar propuesta" size="sm"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>Cancelar</Button>
          <Button variant="destructive" disabled={rejectReason.trim().length < 5 || actionLoading === rejectTarget} onClick={() => handleReject(rejectTarget, rejectReason.trim())}>
            {actionLoading === rejectTarget ? "Rechazando..." : "Rechazar"}
          </Button>
        </div>}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Contale al trabajador por qué no vas a aceptar esta propuesta.</p>
        <textarea className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900" rows={4} maxLength={300}
          placeholder="Ej: Encontré a alguien con mejor disponibilidad..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        <p className="text-xs text-gray-400 text-right mt-1">{rejectReason.length}/300</p>
      </Modal>

      <PostServiceReviewFlow open={reviewFlowOpen} onClose={() => setReviewFlowOpen(false)}
        serviceId={serviceRequest?._id} revieweredId={acceptedWorkerId}
        revieweredName={acceptedProposal?.workerId ? `${acceptedProposal.workerId.firstName} ${acceptedProposal.workerId.lastName}` : ""}
        onSuccess={() => setReviewFlowOpen(false)} />

      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)}
        reporteredId={reportTarget} reporteredName="" onSuccess={() => setReportTarget(null)} />
    </div>
  );
};
