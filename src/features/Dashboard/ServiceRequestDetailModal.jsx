import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "../../shared/components/ui/Button";
import { Modal } from "../../shared/components/ui/Modal";
import { MapPicker } from "../../shared/components/ui/MapPicker";
import {
  getServiceRequestById,
  getProposalsForRequest,
  acceptProposal,
  rejectProposal,
  getGivenReviews,
} from "../../shared/api/user";
import { STATUS_BADGE, formatRelativeDate } from "../../shared/utils/statusBadge";
import { useAuthStore } from "../auth/store/authStore";
import { useMessagesStore } from "../../shared/store/userStore.js";
import { useRequireVerification } from "../verification/hooks/useRequireVerification";
import { useAcceptedProposal } from "./hooks/useAcceptedProposal";
import { PostServiceReviewFlow } from "../reviews/components/PostServiceReviewFlow";
import { ReportModal } from "../reports/components/ReportModal";

const StarRating = ({ rating }) => {
  if (!rating) return <span className="text-sm text-gray-400">Sin calificación</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`size-4 ${star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
};

export const ServiceRequestDetailModal = ({
  open,
  onClose,
  serviceRequestId,
  service,
  onActionTaken,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { requireVerification } = useRequireVerification();
  const startConversation = useMessagesStore((s) => s.startConversation);
  const currentUserId = user?._id || user?.id;

  const isServiceMode = !!service;
  const serviceRequestFromService = isServiceMode ? service.requestId : null;
  const serviceRequestIdForProposal = isServiceMode
    ? (typeof service.requestId === "string" ? service.requestId : service.requestId?._id)
    : serviceRequestId;

  const { proposal: acceptedProposal, loading: proposalLoading } = useAcceptedProposal(
    isServiceMode ? serviceRequestIdForProposal : null
  );

  const [showProposalContext, setShowProposalContext] = useState(false);
  const [showWorkPlan, setShowWorkPlan] = useState(false);

  const [serviceRequest, setServiceRequest] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [messaging, setMessaging] = useState(false);

  const fetchData = async () => {
    if (!serviceRequestId) return;
    setLoading(true);
    setError(null);
    try {
      const [requestRes, proposalsRes] = await Promise.all([
        getServiceRequestById(serviceRequestId),
        getProposalsForRequest(serviceRequestId),
      ]);
      setServiceRequest(requestRes.data.data || requestRes.data);
      setProposals(proposalsRes.data.proposals || []);
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
  };

  useEffect(() => {
    if (open && serviceRequestId && !isServiceMode) {
      fetchData();
    } else if (!isServiceMode) {
      setServiceRequest(null);
      setProposals([]);
      setError(null);
    }
  }, [open, serviceRequestId, isServiceMode]);

  const handleAccept = async (proposalId) => {
    if (!requireVerification("aceptar una propuesta")) return;
    setActionLoading(proposalId);
    try {
      await acceptProposal(proposalId);
      toast.success("Propuesta aceptada");
      await fetchData();
      onActionTaken?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al aceptar propuesta");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (proposalId, reason) => {
    if (!requireVerification("rechazar una propuesta")) return;
    setActionLoading(proposalId);
    try {
      await rejectProposal(proposalId, reason);
      toast.success("Propuesta rechazada");
      setRejectTarget(null);
      setRejectReason("");
      const proposalsRes = await getProposalsForRequest(serviceRequestId);
      setProposals(proposalsRes.data.proposals || []);
      onActionTaken?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al rechazar propuesta");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChatWithWorker = async (workerId) => {
    if (!currentUserId || !workerId) return;
    setMessaging(true);
    try {
      const conversation = await startConversation(currentUserId, workerId);
      if (conversation) {
        onClose();
        navigate("/dashboard/messages", { state: { conversation } });
      }
    } catch {
      toast.error("No se pudo iniciar la conversación con el trabajador");
    } finally {
      setMessaging(false);
    }
  };

  const pendingProposals = proposals.filter((p) => p.status === "PENDING");
  const acceptedProposalInList = proposals.find((p) => p.status === "ACCEPTED");

  const activeRequest = isServiceMode ? serviceRequestFromService : serviceRequest;

  const canReview = isServiceMode && (service?.status === "COMPLETED" || service?.status === "CANCELLED");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewFlowOpen, setReviewFlowOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!canReview || !currentUserId) return;
    let cancelled = false;
    getGivenReviews(currentUserId)
      .then((res) => {
        if (cancelled) return;
        const reviews = res.data?.reviews || [];
        const alreadyReviewed = reviews.some((r) => {
          const rid = typeof r.serviceId === "string" ? r.serviceId : r.serviceId?._id;
          return rid === service._id;
        });
        setHasReviewed(alreadyReviewed);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canReview, currentUserId, service?._id]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isServiceMode ? "Detalle del servicio" : "Detalle de solicitud"}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {isServiceMode && service?.workerId && service?.status !== "CANCELLED" && (
              <Button
                variant="ghost"
                onClick={() => handleChatWithWorker(service.workerId?._id || service.workerId)}
                disabled={messaging}
              >
                {messaging ? "Abriendo..." : "Chatear con el trabajador"}
              </Button>
            )}
            {canReview && (
              hasReviewed ? (
                <span className="text-sm text-gray-500">Ya dejaste una reseña</span>
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
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {loading || (isServiceMode && proposalLoading) ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-gray-500 mb-2">{error}</p>
          <p className="text-gray-400 text-sm">
            Puede que la solicitud no exista o no tengas permiso para verla.
          </p>
        </div>
      ) : activeRequest ? (
        <div className="space-y-5">
          {activeRequest.serviceImage?.url && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <img
                src={activeRequest.serviceImage.url}
                alt={activeRequest.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 mb-2">
              {isServiceMode && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Servicio
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[isServiceMode ? service?.status : activeRequest.status] || "bg-gray-100 text-gray-600"}`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {isServiceMode ? service?.status : activeRequest.status}
              </span>
              {activeRequest.categoryId?.name || activeRequest.customCategory ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                  {activeRequest.categoryId?.name || activeRequest.customCategory}
                </span>
              ) : null}
            </div>
            <h3 className="text-xl font-black text-gray-900">{activeRequest.title}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              {activeRequest.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isServiceMode ? (
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Precio final</p>
                <p className="text-sm font-bold text-gray-900">Q{service.finalPrice}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Presupuesto</p>
                <p className="text-sm font-bold text-gray-900">
                  Q{activeRequest.budgetMin} - Q{activeRequest.budgetMax}
                </p>
              </div>
            )}
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Dirección</p>
              <p className="text-sm font-bold text-gray-900">
                {activeRequest.address || "No especificada"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Creada</p>
              <p className="text-sm font-bold text-gray-900">
                {formatRelativeDate(isServiceMode ? service?.createdAt : activeRequest.createdAt)}
              </p>
            </div>
            {isServiceMode && service.workerId && (
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trabajador</p>
                <p className="text-sm font-bold text-gray-900">
                  {service.workerId.firstName} {service.workerId.lastName}
                </p>
              </div>
            )}
            {activeRequest.latitude && activeRequest.longitude && (
              <div className="col-span-2 rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ubicación</p>
                <MapPicker
                  lat={activeRequest.latitude}
                  lng={activeRequest.longitude}
                  onLocationChange={() => {}}
                  readOnly
                />
              </div>
            )}
          </div>

          {isServiceMode && (
            <div className="rounded-lg border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setShowProposalContext(!showProposalContext)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-bold text-gray-900">Propuesta ganadora</span>
                {showProposalContext ? (
                  <ChevronUpIcon className="size-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="size-5 text-gray-400" />
                )}
              </button>
              {showProposalContext && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                  {acceptedProposal ? (
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

          {isServiceMode && Array.isArray(service.workPlan) && service.workPlan.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setShowWorkPlan(!showWorkPlan)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">Plan de trabajo</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {service.workPlan.filter((d) => d.status === "DONE").length}/{service.workPlan.length}
                  </span>
                </div>
                {showWorkPlan ? (
                  <ChevronUpIcon className="size-5 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="size-5 text-gray-400" />
                )}
              </button>
              {showWorkPlan && (
                <div className="border-t border-gray-100 p-4 space-y-2">
                  {service.scheduledDate && (
                    <p className="text-xs text-gray-500 mb-2">
                      Cita: {new Date(service.scheduledDate).toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                  {service.workPlan.map((day) => (
                    <div key={day.dayNumber} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <CheckCircleIcon
                        className={`size-5 shrink-0 mt-0.5 ${
                          day.status === "DONE" ? "text-emerald-500" : "text-gray-300"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">Día {day.dayNumber}</span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(day.date).toLocaleDateString("es-GT", { day: "2-digit", month: "short" })}
                          </span>
                          {day.status === "DONE" && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Completado</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isServiceMode && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Ofertas recibidas</h4>
              {activeRequest.status !== "OPEN" && acceptedProposalInList ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">Oferta aceptada</p>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">
                        {acceptedProposalInList.workerId?.firstName} {acceptedProposalInList.workerId?.lastName}
                      </span>
                    </p>
                    <StarRating rating={acceptedProposalInList.workerId?.ratingAverage} />
                    <p className="text-lg font-bold text-green-700">Q{acceptedProposalInList.price}</p>
                    {acceptedProposalInList.message && (
                      <p className="text-sm text-gray-600 italic">"{acceptedProposalInList.message}"</p>
                    )}
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleChatWithWorker(acceptedProposalInList.workerId?._id)}
                      disabled={messaging}
                    >
                      {messaging ? "Abriendo..." : "Chatear con el trabajador"}
                    </Button>
                  </div>
                </div>
              ) : activeRequest.status === "OPEN" && pendingProposals.length > 0 ? (
                <div className="space-y-3">
                  {pendingProposals.map((proposal) => (
                    <div key={proposal._id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {proposal.workerId?.firstName} {proposal.workerId?.lastName}
                          </p>
                          <StarRating rating={proposal.workerId?.ratingAverage} />
                        </div>
                        <p className="text-lg font-bold text-gray-900">Q{proposal.price}</p>
                      </div>
                      {proposal.message && (
                        <p className="text-sm text-gray-600 italic mb-3">"{proposal.message}"</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(proposal._id)}
                          disabled={actionLoading === proposal._id}
                        >
                          {actionLoading === proposal._id ? "Procesando..." : "Aceptar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectTarget(proposal._id)}
                          disabled={actionLoading === proposal._id}
                        >
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { onClose?.(); navigate(`/dashboard/worker/${proposal.workerId?._id}`); }}
                          disabled={!proposal.workerId?._id}
                        >
                          Ver perfil
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">
                  Todavía no has recibido ofertas para esta solicitud.
                </p>
              )}
            </div>
          )}
        </div>
      ) : null}

      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason(""); }}
        title="Rechazar propuesta"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={rejectReason.trim().length < 5 || actionLoading === rejectTarget}
              onClick={() => handleReject(rejectTarget, rejectReason.trim())}
            >
              {actionLoading === rejectTarget ? "Rechazando..." : "Rechazar"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 mb-3">
          Contale al trabajador por qué no vas a aceptar esta propuesta.
        </p>
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          rows={4}
          maxLength={300}
          placeholder="Ej: Encontré a alguien con mejor disponibilidad..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <p className="text-xs text-gray-400 text-right mt-1">{rejectReason.length}/300</p>
      </Modal>

      {isServiceMode && (
        <PostServiceReviewFlow
          open={reviewFlowOpen}
          onClose={() => setReviewFlowOpen(false)}
          serviceId={service._id}
          revieweredId={service.workerId?._id}
          revieweredName={service.workerId ? `${service.workerId.firstName} ${service.workerId.lastName}` : ""}
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
          reporteredId={service.workerId?._id}
          reporteredName={service.workerId ? `${service.workerId.firstName} ${service.workerId.lastName}` : ""}
        />
      )}
    </Modal>
  );
};
