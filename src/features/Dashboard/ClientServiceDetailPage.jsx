import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, ChatBubbleLeftIcon, CheckCircleIcon, XCircleIcon, ClockIcon, FlagIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { Button } from "../../shared/components/ui/Button";
import { Card, CardContent } from "../../shared/components/layout/DashboardContainer";
import { Modal } from "../../shared/components/ui/Modal";
import { getServiceById, getServiceRequestById, getWorkerTrustStats, getReceivedReviews, getGivenReviews, verifyWorkDay } from "../../shared/api/user";
import { formatRelativeDate } from "../../shared/utils/statusBadge";
import { useAuthStore } from "../auth/store/authStore";
import { useMessagesStore } from "../../shared/store/userStore.js";
import { PostServiceReviewFlow } from "../reviews/components/PostServiceReviewFlow";
import { ReportModal } from "../reports/components/ReportModal";

const SERVICE_STATUS_BADGE = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

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

export const ClientServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const startConversation = useMessagesStore((s) => s.startConversation);
  const currentUserId = user?._id || user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [service, setService] = useState(null);
  const [acceptedProposal, setAcceptedProposal] = useState(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showWorkPlan, setShowWorkPlan] = useState(false);

  const [verifyTarget, setVerifyTarget] = useState(null);
  const [clientNote, setClientNote] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [messaging, setMessaging] = useState(false);
  const [workerStats, setWorkerStats] = useState(null);
  const [workerReviewsCount, setWorkerReviewsCount] = useState(0);
  const [loadingWorkerStats, setLoadingWorkerStats] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewFlowOpen, setReviewFlowOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const workerId = useMemo(() => {
    if (!service?.workerId) return null;
    return typeof service.workerId === "string" ? service.workerId : service.workerId._id;
  }, [service]);

  const workerName = useMemo(() => {
    if (!service?.workerId) return "";
    const w = service.workerId;
    return `${w.firstName || ""} ${w.lastName || ""}`.trim();
  }, [service]);

  const requestId = useMemo(() => {
    if (!service?.requestId) return null;
    return typeof service.requestId === "string" ? service.requestId : service.requestId._id;
  }, [service]);

  const canChat = service && workerId && service.status !== "CANCELLED";
  const canReview = service && (service.status === "COMPLETED" || service.status === "CANCELLED");
  const statusBadge = SERVICE_STATUS_BADGE[service?.status] || SERVICE_STATUS_BADGE.PENDING;

  const fetchService = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getServiceById(id);
      const data = res.data?.data || res.data;
      setService(data);
    } catch {
      setError("Error al cargar el servicio");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchService(); }, [fetchService]);

  useEffect(() => {
    if (!requestId) return;
    setProposalLoading(true);
    getServiceRequestById(requestId)
      .then((res) => {
        const sr = res.data?.data || res.data;
        if (sr?.proposals) {
          const acc = sr.proposals.find((p) => p.status === "ACCEPTED");
          if (acc) setAcceptedProposal(acc);
        }
      })
      .catch(() => {})
      .finally(() => setProposalLoading(false));
  }, [requestId]);

  useEffect(() => {
    if (!workerId) return;
    let mounted = true;
    setLoadingWorkerStats(true);
    const load = async () => {
      try {
        const [statsRes, reviewsRes] = await Promise.all([
          getWorkerTrustStats(workerId),
          getReceivedReviews(workerId),
        ]);
        if (!mounted) return;
        if (statsRes?.data?.success) setWorkerStats(statsRes.data.data);
        const reviews = reviewsRes?.data?.reviews || [];
        setWorkerReviewsCount(reviews.length);
      } catch {} finally {
        if (mounted) setLoadingWorkerStats(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [workerId]);

  useEffect(() => {
    if (!canReview || !currentUserId || !service?._id) return;
    let cancelled = false;
    getGivenReviews(currentUserId)
      .then((res) => {
        if (cancelled) return;
        const reviews = res.data?.reviews || [];
        const already = reviews.some((r) => {
          const sid = typeof r.serviceId === "string" ? r.serviceId : r.serviceId?._id;
          return sid === service._id;
        });
        setHasReviewed(already);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canReview, currentUserId, service?._id]);

  const handleChat = async () => {
    if (!currentUserId || !workerId) return;
    setMessaging(true);
    try {
      const conversation = await startConversation(currentUserId, workerId);
      if (conversation) navigate("/dashboard/messages", { state: { conversation } });
    } catch { toast.error("No se pudo iniciar la conversación"); }
    finally { setMessaging(false); }
  };

  const handleVerify = async () => {
    if (!verifyTarget || !service) return;
    setVerifyLoading(true);
    try {
      await verifyWorkDay(service._id, verifyTarget.dayNumber, {
        verified: verifyTarget.verified,
        clientNote: verifyTarget.verified ? undefined : clientNote.trim() || undefined,
      });
      toast.success(verifyTarget.verified ? "Día verificado correctamente" : "Día disputado");
      setVerifyTarget(null);
      setClientNote("");
      fetchService();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al verificar el día");
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">Cargando servicio...</p>
      </CardContent></Card>
    );
  }

  if (error || !service) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}><ArrowLeftIcon className="size-4" /> Volver</Button>
        <Card><CardContent className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{error || "Servicio no encontrado"}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Puede que el servicio no exista o no tengas permiso para verlo.</p>
          <Button onClick={() => navigate("/dashboard")}>Volver al inicio</Button>
        </CardContent></Card>
      </div>
    );
  }

  const requestTitle = service.requestId?.title || service.serviceCode || "Servicio asignado";
  const requestImage = service.requestId?.serviceImage?.url || "";
  const categoryName = service.requestId?.categoryId?.name || "Sin categoría";
  const address = service.requestId?.address || "No especificada";

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/dashboard")}><ArrowLeftIcon className="size-4" /> Volver</Button>

      {requestImage && <img src={requestImage} alt={requestTitle} className="w-full h-48 object-cover rounded-xl" />}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadge}`}>
            <span className="size-1.5 rounded-full bg-current" />
            {service.status === "PENDING" ? "Pendiente" :
             service.status === "IN_PROGRESS" ? "En Progreso" :
             service.status === "COMPLETED" ? "Finalizado" : "Cancelado"}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium">
            {categoryName}
          </span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">{requestTitle}</h1>
      </div>

      {service.requestId?.description && (
        <Card><CardContent className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Descripción</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{service.requestId.description}</p>
        </CardContent></Card>
      )}

      <Card><CardContent className="p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Información del servicio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Precio final</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Q{service.finalPrice}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dirección</p>
            <p className="text-gray-700 dark:text-gray-300">{address}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Creado</p>
            <p className="text-gray-700 dark:text-gray-300">{formatRelativeDate(service.createdAt)}</p></div>
        </div>
      </CardContent></Card>

      {workerName && (
        <Card><CardContent className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Trabajador</h2>
          {loadingWorkerStats ? (
            <p className="text-sm text-gray-400 italic">Cargando información del trabajador...</p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-500">{workerName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <button type="button" onClick={() => navigate(`/dashboard/worker/${workerId}`)} className="font-bold text-gray-900 dark:text-gray-100 hover:text-yellow-600 text-left">
                  {workerName}
                </button>
                {workerStats && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={workerStats.ratingAverage} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({workerStats.ratingCount || 0}) {workerStats.completionRate != null ? `· ${Math.round(workerStats.completionRate * 100)}% completados` : ""}
                    </span>
                  </div>
                )}
                {workerReviewsCount > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {workerReviewsCount} reseña{workerReviewsCount !== 1 ? "s" : ""} recibida{workerReviewsCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent></Card>
      )}

      <Card><button type="button" onClick={() => setShowProposal(!showProposal)} className="w-full flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Propuesta ganadora</span>
        </div>
        {showProposal ? <ChevronUpIcon className="size-5 text-gray-400" /> : <ChevronDownIcon className="size-5 text-gray-400" />}
      </button>
      {showProposal && (
        <CardContent className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-3">
          {proposalLoading ? (
            <p className="text-sm text-gray-400 italic">Cargando propuesta...</p>
          ) : acceptedProposal ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Precio ofertado</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Q{acceptedProposal.price}</span>
              </div>
              {acceptedProposal.message && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Mensaje</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-1">&ldquo;{acceptedProposal.message}&rdquo;</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">No se encontró la propuesta original.</p>
          )}
        </CardContent>
      )}
      </Card>

      <Card><button type="button" onClick={() => setShowWorkPlan(!showWorkPlan)} className="w-full flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Plan de trabajo</span>
          {Array.isArray(service.workPlan) && service.workPlan.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded">
              {service.workPlan.filter((d) => d.status === "VERIFIED").length}/{service.workPlan.length}
            </span>
          )}
        </div>
        {showWorkPlan ? <ChevronUpIcon className="size-5 text-gray-400" /> : <ChevronDownIcon className="size-5 text-gray-400" />}
      </button>
      {showWorkPlan && (
        <CardContent className="border-t border-gray-100 dark:border-gray-700 p-6 space-y-4">
          {service.estimatedStartDate && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 uppercase tracking-wide text-xs">Inicio:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {new Date(service.estimatedStartDate).toLocaleDateString("es-GT", { day: "numeric", month: "short" })}
              </span>
              {service.estimatedEndDate && (
                <>
                  <span className="text-gray-300">→</span>
                  <span className="text-gray-500 uppercase tracking-wide text-xs">Fin:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(service.estimatedEndDate).toLocaleDateString("es-GT", { day: "numeric", month: "short" })}
                  </span>
                </>
              )}
            </div>
          )}
          {service.generalPlan && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Plan general</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{service.generalPlan}</p>
            </div>
          )}
          {Array.isArray(service.workPlan) && service.workPlan.length > 0 ? (
            <div className="space-y-3">
              {[...service.workPlan].sort((a, b) => a.dayNumber - b.dayNumber).map((day) => {
                const isPending = day.status === "PENDING";
                const isDone = day.status === "DONE";
                const isVerified = day.status === "VERIFIED";
                const isDisputed = day.status === "DISPUTED";
                return (
                  <div key={day.dayNumber} className={`flex gap-3 p-4 rounded-xl border ${
                    isVerified ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200" :
                    isDisputed ? "bg-red-50 dark:bg-red-900/10 border-red-200" :
                    isDone ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200" :
                    "bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-700"
                  }`}>
                    <div className="shrink-0 mt-0.5">
                      {isVerified ? <CheckCircleSolid className="size-5 text-blue-600" /> :
                       isDisputed ? <XCircleIcon className="size-5 text-red-600" /> :
                       isDone ? <ClockIcon className="size-5 text-amber-600" /> :
                       <div className="size-5 rounded-full border-2 border-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-500 uppercase">Día {day.dayNumber}</span>
                        {day.date && (
                          <span className="text-xs text-gray-400">
                            {new Date(day.date).toLocaleDateString("es-GT", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                        {isVerified && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-1.5 py-0.5 rounded">Verificado</span>}
                        {isDisputed && <span className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded">Disputado</span>}
                        {isDone && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded">Completado</span>}
                        {isPending && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 px-1.5 py-0.5 rounded">Pendiente</span>}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{day.description}</p>
                      {isDone && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => setVerifyTarget({ dayNumber: day.dayNumber, verified: true })} disabled={verifyLoading}>
                            <CheckCircleIcon className="size-4" /> Verificar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setVerifyTarget({ dayNumber: day.dayNumber, verified: false }); setClientNote(""); }} disabled={verifyLoading}>
                            <XCircleIcon className="size-4" /> Disputar
                          </Button>
                        </div>
                      )}
                      {isDisputed && day.clientNote && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mt-2 border border-red-100 dark:border-red-800/30">
                          <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">Tu nota:</p>
                          <p className="text-xs text-red-800 dark:text-red-300">{day.clientNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">El trabajador aún no ha agregado días al plan.</p>
          )}
        </CardContent>
      )}
      </Card>

      {(canChat || canReview) && (
        <Card><CardContent className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Acciones</h2>
          <div className="flex flex-wrap gap-3">
            {canChat && (
              <Button variant="outline" onClick={handleChat} disabled={messaging}>
                <ChatBubbleLeftIcon className="size-4" /> {messaging ? "Abriendo..." : "Chatear con el trabajador"}
              </Button>
            )}
            {canReview && !hasReviewed && (
              <Button onClick={() => setReviewFlowOpen(true)}>
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                Dejar reseña
              </Button>
            )}
            {canReview && hasReviewed && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircleSolid className="size-5" />
                <span className="text-sm font-medium">Ya dejaste una reseña</span>
              </div>
            )}
            {canReview && (
              <Button variant="destructive" onClick={() => setReportOpen(true)}>
                <FlagIcon className="size-4" /> Reportar
              </Button>
            )}
          </div>
        </CardContent></Card>
      )}

      <PostServiceReviewFlow open={reviewFlowOpen} onClose={() => setReviewFlowOpen(false)}
        serviceId={service._id} revieweredId={workerId || ""}
        revieweredName={workerName}
        onSuccess={() => { setHasReviewed(true); setReviewFlowOpen(false); }} />

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)}
        reporteredId={workerId || ""} reporteredName={workerName}
        onSuccess={() => { setReportOpen(false); toast.success("Reporte enviado"); }} />

      <Modal open={!!verifyTarget} onClose={() => { setVerifyTarget(null); setClientNote(""); }}
        title={verifyTarget?.verified ? "Verificar día" : "Disputar día"} size="sm"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setVerifyTarget(null); setClientNote(""); }}>Cancelar</Button>
          <Button disabled={verifyLoading} onClick={handleVerify}>
            {verifyLoading ? "..." : verifyTarget?.verified ? "Sí, verificar" : "Sí, disputar"}
          </Button>
        </div>}
      >
        {verifyTarget?.verified ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Vas a confirmar que el trabajador completó el día {verifyTarget.dayNumber} correctamente.</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Vas a disputar el día {verifyTarget?.dayNumber}. Esto afectará la reputación del trabajador.</p>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">Motivo (opcional)</label>
            <textarea className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-900" rows={3} maxLength={300}
              placeholder="Describí por qué estás disputando este día..." value={clientNote} onChange={(e) => setClientNote(e.target.value)} />
          </>
        )}
      </Modal>
    </div>
  );
};
