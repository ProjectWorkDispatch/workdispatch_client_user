import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Button } from "../../shared/components/ui/Button";
import { Card, CardContent } from "../../shared/components/layout/DashboardContainer";
import { Modal } from "../../shared/components/ui/Modal";
import { MapPicker } from "../../shared/components/ui/MapPicker";
import {
  getServiceRequestById,
  getProposalsForRequest,
  acceptProposal,
  rejectProposal,
} from "../../shared/api/user";
import { STATUS_BADGE, formatRelativeDate } from "../../shared/utils/statusBadge";
import { useAuthStore } from "../auth/store/authStore";
import { useMessagesStore } from "../../shared/store/userStore.js";
import { useRequireVerification } from "../verification/hooks/useRequireVerification";

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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestRes, proposalsRes] = await Promise.all([
        getServiceRequestById(id),
        getProposalsForRequest(id),
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
    fetchData();
  }, [id]);

  const handleAccept = async (proposalId) => {
    if (!requireVerification("aceptar una propuesta")) return;
    setActionLoading(proposalId);
    try {
      await acceptProposal(proposalId);
      toast.success("Propuesta aceptada");
      await fetchData();
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
      const proposalsRes = await getProposalsForRequest(id);
      setProposals(proposalsRes.data.proposals || []);
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
        navigate("/dashboard/messages", { state: { conversation } });
      }
    } catch {
      toast.error("No se pudo iniciar la conversación con el trabajador");
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500 text-lg">Cargando solicitud...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard/my-requests")}>
          <ArrowLeftIcon className="size-4" />
          Volver
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">{error}</p>
            <p className="text-gray-400 text-sm mb-4">
              Puede que la solicitud no exista o no tengas permiso para verla.
            </p>
            <Button onClick={() => navigate("/dashboard/my-requests")}>
              Volver a Mis Solicitudes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingProposals = proposals.filter((p) => p.status === "PENDING");
  const acceptedProposal = proposals.find((p) => p.status === "ACCEPTED");

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/dashboard/my-requests")}>
        <ArrowLeftIcon className="size-4" />
        Volver
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{serviceRequest.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[serviceRequest.status] || "bg-gray-100 text-gray-600"}`}>
              <span className="size-1.5 rounded-full bg-current" />
              {serviceRequest.status}
            </span>
            {serviceRequest.categoryId?.name || serviceRequest.customCategory ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                {serviceRequest.categoryId?.name || serviceRequest.customCategory}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Imagen */}
          {serviceRequest.serviceImage?.url && (
            <Card>
              <img
                src={serviceRequest.serviceImage.url}
                alt={serviceRequest.title}
                className="w-full h-48 object-cover rounded-xl"
              />
            </Card>
          )}

          {/* Descripción */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Descripción</h2>
              <p className="text-gray-600 leading-relaxed">{serviceRequest.description}</p>
            </CardContent>
          </Card>

          {/* Mapa */}
          {serviceRequest.latitude && serviceRequest.longitude && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Ubicación</h2>
                <MapPicker
                  lat={serviceRequest.latitude}
                  lng={serviceRequest.longitude}
                  onLocationChange={() => { }}
                  readOnly
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info rápida */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Presupuesto</p>
                <p className="text-lg font-bold text-gray-900">
                  Q{serviceRequest.budgetMin} - Q{serviceRequest.budgetMax}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dirección</p>
                <p className="text-gray-700">{serviceRequest.address || "No especificada"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Creada</p>
                <p className="text-gray-700">{formatRelativeDate(serviceRequest.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Ofertas recibidas */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Ofertas recibidas</h2>
              {serviceRequest.status !== "OPEN" && acceptedProposal ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">Oferta aceptada</p>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">{acceptedProposal.workerId?.firstName} {acceptedProposal.workerId?.lastName}</span>
                    </p>
                    <StarRating rating={acceptedProposal.workerId?.ratingAverage} />
                    <p className="text-lg font-bold text-green-700">Q{acceptedProposal.price}</p>
                    {acceptedProposal.message && (
                      <p className="text-sm text-gray-600 italic">"{acceptedProposal.message}"</p>
                    )}
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleChatWithWorker(acceptedProposal.workerId?._id)}
                      disabled={messaging}
                    >
                      {messaging ? "Abriendo..." : "Chatear con el trabajador"}
                    </Button>
                  </div>
                </div>
              ) : serviceRequest.status === "OPEN" && pendingProposals.length > 0 ? (
                <div className="space-y-4">
                  {pendingProposals.map((proposal) => (
                    <div key={proposal._id} className="border border-gray-200 rounded-lg p-4">
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
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Todavía no has recibido ofertas para esta solicitud.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
};
