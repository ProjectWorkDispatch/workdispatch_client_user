import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  StarIcon as StarOutline,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import {
  Card,
  CardContent,
} from "../../../shared/components/layout/DashboardContainer";
import {
  getProposalById,
  getProposalMeeting,
  confirmMeeting,
  proposeAlternativeTime,
  cancelMeeting,
  workerRequestMeeting,
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

export const WorkerProposalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [clientStats, setClientStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [showRequestPicker, setShowRequestPicker] = useState(false);
  const [requestDate, setRequestDate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [proposalRes, meetingRes] = await Promise.all([
        getProposalById(id),
        getProposalMeeting(id).catch(() => null),
      ]);
      setProposal(proposalRes.data.proposal || proposalRes.data.data || null);
      if (meetingRes?.data?.data) setMeeting(meetingRes.data.data);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        setError(err.response?.data?.message || "Propuesta no encontrada");
      } else {
        setError("Error al cargar los datos");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const request = proposal ? (proposal.serviceRequestId || {}) : {};
  const clientInfo = request.clientId || {};
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
      setShowDatePicker(false);
      setNewDate("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al proponer horario");
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleCancelMeeting = async () => {
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

  const handleRequestMeeting = async () => {
    if (!requestDate) return;
    const srId = proposal?.serviceRequestId?._id || proposal?.serviceRequestId;
    if (!srId) {
      toast.error("No se encontro la solicitud asociada");
      return;
    }
    setMeetingLoading(true);
    try {
      const res = await workerRequestMeeting({ serviceRequestId: srId, startTime: requestDate });
      if (res?.data?.success && res.data.data) {
        setMeeting(res.data.data);
      } else {
        const meetingRes = await getProposalMeeting(id);
        if (meetingRes?.data?.data) setMeeting(meetingRes.data.data);
      }
      toast.success("Solicitud de entrevista enviada");
      setShowRequestPicker(false);
      setRequestDate("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al solicitar entrevista");
    } finally {
      setMeetingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm font-semibold text-gray-500">Cargando propuesta...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-semibold text-gray-700">{error || "Propuesta no encontrada"}</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/my-offers")}
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-gray-900"
        >
          Volver
        </button>
      </div>
    );
  }

  const imageUrl = request.serviceImage?.url || "";
  const formattedTime = formatDateTime(meeting?.startTime);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/my-offers")}
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="size-4" />
        Volver
      </button>

      <div>
        <h1 className="text-2xl font-black text-gray-900">{request.title || "Solicitud"}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700">
            {proposal.status === "PENDING" ? "Pendiente" : proposal.status === "ACCEPTED" ? "Aceptada" : proposal.status === "REJECTED" ? "Rechazada" : proposal.status}
          </span>
          <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
            {getCategoryName(request)}
          </span>
        </div>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt={request.title || "Solicitud"}
          className="w-full rounded-xl object-cover"
          style={{ maxHeight: 240 }}
        />
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-2 text-base font-bold text-gray-900">Descripcion</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{request.description || "Sin descripcion"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-2 text-base font-bold text-gray-900">Tu oferta</h2>
          <p className="text-2xl font-black text-yellow-600">{formatMoney(proposal.price)}</p>
          {proposal.message && (
            <p className="mt-2 text-sm italic text-gray-500">"{proposal.message}"</p>
          )}
        </CardContent>
      </Card>

      {request.latitude && request.longitude && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">Ubicacion</h2>
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <MapPinIcon className="size-5" />
              <span>{request.address || "Ubicacion en el mapa"}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-2 text-base font-bold text-gray-900">Informacion</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Presupuesto</p>
              <p className="text-sm font-bold text-gray-900">
                {formatMoney(request.budgetMin)} - {formatMoney(request.budgetMax)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Direccion</p>
              <p className="text-sm font-bold text-gray-900">{request.address || "No especificada"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {clientInfo.firstName && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">Cliente</h2>
            {loadingStats ? (
              <p className="text-sm text-gray-500">Cargando informacion del cliente...</p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-lg font-bold text-gray-500">
                    {clientInfo.firstName?.charAt(0)}{clientInfo.lastName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{clientInfo.firstName} {clientInfo.lastName}</p>
                  {clientStats && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">{renderStars(clientStats.ratingAverage)}</div>
                      <span className="text-xs text-gray-500">
                        ({clientStats.ratingCount || 0})
                        {clientStats.completionRate != null && ` · ${Math.round(clientStats.completionRate * 100)}% completados`}
                      </span>
                    </div>
                  )}
                  {reviews.length > 0 && (
                    <p className="mt-0.5 text-xs text-gray-400">{reviews.length} reseña{reviews.length !== 1 ? "s" : ""} recibida{reviews.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {meeting && meeting.status !== "CANCELLED" ? (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">Entrevista</h2>
            {meeting.status === "CONFIRMED" ? (
              <div className="rounded-lg bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="size-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">Entrevista confirmada</span>
                </div>
                {formattedTime && <p className="mt-1 text-sm text-emerald-600">{formattedTime}</p>}
                {meeting.meetLink && (
                  <a
                    href={meeting.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-bold text-blue-600 underline"
                  >
                    Abrir Google Meet
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-4 text-yellow-600" />
                  <span className="text-sm font-bold text-yellow-700">Entrevista solicitada</span>
                </div>
                {formattedTime && (
                  <p className="mt-1 text-sm text-yellow-600">
                    {meeting.lastProposedBy === "WORKER" ? "Propusiste: " : "Proponen: "}{formattedTime}
                  </p>
                )}

                {meeting.confirmedByWorker && meeting.confirmedByClient ? null : meeting.confirmedByWorker ? (
                  <p className="mt-1 text-sm italic text-yellow-600">Esperando confirmacion del cliente</p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={meetingLoading}
                        className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {meetingLoading ? "..." : "Aceptar horario"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelMeeting}
                        disabled={meetingLoading}
                        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(true)}
                      disabled={meetingLoading}
                      className="rounded-lg border border-yellow-400 bg-white px-3 py-2 text-sm font-bold text-yellow-700 transition hover:bg-yellow-50 disabled:opacity-50"
                    >
                      Proponer hora
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-2 text-base font-bold text-gray-900">Entrevista</h2>
            <p className="mb-3 text-sm text-gray-500">Aun no se ha solicitado una entrevista. Solicitala para coordinar con el cliente.</p>
            <button
              type="button"
              onClick={() => setShowRequestPicker(true)}
              disabled={meetingLoading}
              className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-500 disabled:opacity-50"
            >
              {meetingLoading ? "..." : "Solicitar entrevista"}
            </button>
          </CardContent>
        </Card>
      )}

      {showDatePicker && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-bold text-gray-900">Proponer nuevo horario</h2>
            <input
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mb-3 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleProposeTime}
                disabled={!newDate || meetingLoading}
                className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-500 disabled:opacity-50"
              >
                {meetingLoading ? "..." : "Proponer"}
              </button>
              <button
                type="button"
                onClick={() => { setShowDatePicker(false); setNewDate(""); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {showRequestPicker && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-base font-bold text-gray-900">Solicitar entrevista</h2>
            <p className="mb-3 text-sm text-gray-500">Elegi la fecha y hora para la entrevista</p>
            <input
              type="datetime-local"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="mb-3 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRequestMeeting}
                disabled={!requestDate || meetingLoading}
                className="flex-1 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-500 disabled:opacity-50"
              >
                {meetingLoading ? "..." : "Enviar solicitud"}
              </button>
              <button
                type="button"
                onClick={() => { setShowRequestPicker(false); setRequestDate(""); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-3 text-base font-bold text-gray-900">Acciones</h2>
          {clientId && (
            <button
              type="button"
              onClick={() => navigate(`/dashboard/client/${clientId}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Ver Perfil del Cliente
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
