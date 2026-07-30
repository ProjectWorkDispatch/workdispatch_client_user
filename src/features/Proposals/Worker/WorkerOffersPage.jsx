import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardContent,
} from "../../../shared/components/layout/DashboardContainer";
import { Button } from "../../../shared/components/ui/Button";
import { DateTimePickerModal } from "../../../shared/components/ui/DateTimePickerModal";
import {
  getWorkerProposals,
  getProposalMeeting,
  confirmMeeting,
  proposeAlternativeTime,
  cancelMeeting,
} from "../../../shared/api/user";
import { useAuthStore } from "../../auth/store/authStore";

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
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
};

const getStatusLabel = (status) => {
  const labels = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptada",
    REJECTED: "Rechazada",
    CANCELLED: "Cancelada",
  };

  return labels[status] || status || "Pendiente";
};

const statusClass = (status) => {
  const styles = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700",
    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
    REJECTED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-700",
  };

  return styles[status] || "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-700";
};

const getRequestTitle = (proposal) => {
  const request = proposal?.serviceRequestId;
  if (!request || typeof request === "string") return "Solicitud asociada";
  return request.title || "Solicitud asociada";
};

const getRequestDescription = (proposal) => {
  const request = proposal?.serviceRequestId;
  if (!request || typeof request === "string") return "Sin descripcion disponible.";
  return request.description || "Sin descripcion disponible.";
};

const FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "ACCEPTED", label: "Aceptadas" },
  { value: "REJECTED", label: "Rechazadas" },
  { value: "CANCELLED", label: "Canceladas" },
];

export const WorkerOffersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const workerId = getUserId(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proposals, setProposals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // --- Meeting (entrevista) state, one per proposal id ---
  const [meetingsByProposal, setMeetingsByProposal] = useState({});
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // { meetingId, proposalId }

  const loadOffers = useCallback(async () => {
    if (!workerId) return;
    setLoading(true);
    setError("");

    try {
      const response = await getWorkerProposals(workerId);
      setProposals(getArrayFromResponse(response, ["proposals"]));
    } catch (loadError) {
      setError(loadError?.response?.data?.message || "No se pudieron cargar tus ofertas.");
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // Fetch meeting info for every loaded proposal (mirrors mobile behaviour)
  useEffect(() => {
    if (!proposals.length) return;
    let cancelled = false;

    const loadMeetings = async () => {
      for (const proposal of proposals) {
        try {
          const res = await getProposalMeeting(proposal._id);
          if (!cancelled && res?.data?.data) {
            setMeetingsByProposal((prev) => ({ ...prev, [proposal._id]: res.data.data }));
          }
        } catch {
          // no meeting for this proposal yet — ignore
        }
      }
    };

    loadMeetings();
    return () => {
      cancelled = true;
    };
  }, [proposals]);

  const handleConfirmMeeting = async (meetingId, proposalId, e) => {
    e.stopPropagation();
    setMeetingLoading(true);
    try {
      const res = await confirmMeeting(meetingId);
      toast.success("Asistencia confirmada");
      setMeetingsByProposal((prev) => ({ ...prev, [proposalId]: res.data.data }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al confirmar asistencia");
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleProposeTime = async (isoDate) => {
    if (!pickerTarget) return;
    const { meetingId, proposalId } = pickerTarget;
    setPickerTarget(null);
    setMeetingLoading(true);
    try {
      const res = await proposeAlternativeTime(meetingId, isoDate);
      toast.success("Nuevo horario propuesto");
      setMeetingsByProposal((prev) => ({ ...prev, [proposalId]: res.data.data }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al proponer horario");
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleCancelMeeting = async (meetingId, e) => {
    e.stopPropagation();
    setMeetingLoading(true);
    try {
      await cancelMeeting(meetingId);
      toast.success("Entrevista cancelada");
      setMeetingsByProposal((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key]._id === meetingId) {
            next[key] = { ...next[key], status: "CANCELLED" };
          }
        }
        return next;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al cancelar entrevista");
    } finally {
      setMeetingLoading(false);
    }
  };

  const counts = useMemo(() => {
    return proposals.reduce(
      (acc, proposal) => {
        const status = proposal?.status || "PENDING";
        acc.ALL += 1;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { ALL: 0, PENDING: 0, ACCEPTED: 0, REJECTED: 0, CANCELLED: 0 }
    );
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    if (statusFilter === "ALL") return proposals;
    return proposals.filter((proposal) => proposal?.status === statusFilter);
  }, [proposals, statusFilter]);

  const renderMeeting = (proposal) => {
    const meeting = meetingsByProposal[proposal._id];
    if (!meeting || meeting.status === "CANCELLED") return null;

    const formattedTime = formatDateTime(meeting.startTime);
    const workerConfirmed = meeting.confirmedByWorker;
    const clientConfirmed = meeting.confirmedByClient;

    if (meeting.status === "CONFIRMED") {
      return (
        <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <CheckCircleIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Entrevista confirmada</span>
          </div>
          {formattedTime && <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{formattedTime}</p>}
          {meeting.meetLink && (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate">Enlace: {meeting.meetLink}</p>
          )}
        </div>
      );
    }

    const iProposed = meeting.lastProposedBy === "WORKER";

    return (
      <div className="mt-3 rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <ClockIcon className="size-4 text-yellow-700 dark:text-yellow-400" />
          <span className="text-xs font-bold text-yellow-800 dark:text-yellow-400">Entrevista solicitada</span>
        </div>
        {formattedTime && (
          <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-400">
            {iProposed ? "Propusiste: " : "Proponen: "}{formattedTime}
          </p>
        )}
        {clientConfirmed && workerConfirmed ? null : workerConfirmed ? (
          <p className="text-xs italic text-yellow-700 dark:text-yellow-500">Esperando confirmación del cliente</p>
        ) : (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1 !py-1.5 !text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={meetingLoading}
                onClick={(e) => handleConfirmMeeting(meeting._id, proposal._id, e)}
              >
                {meetingLoading ? "..." : "Aceptar horario"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 !py-1.5 !text-xs"
                disabled={meetingLoading}
                onClick={(e) => handleCancelMeeting(meeting._id, e)}
              >
                Rechazar
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full !py-1.5 !text-xs border-yellow-500 text-yellow-800 dark:text-yellow-400"
              disabled={meetingLoading}
              onClick={(e) => {
                e.stopPropagation();
                setPickerTarget({ meetingId: meeting._id, proposalId: proposal._id });
              }}
            >
              Proponer hora
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Mis Ofertas</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Revisa las propuestas que has enviado y su estado actual.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
          <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              <FunnelIcon className="size-5 text-gray-400 dark:text-gray-500" />
              Filtrar por estado
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const active = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                      active
                        ? "border-yellow-400 bg-yellow-400 text-gray-900"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-yellow-300 hover:bg-yellow-50"
                    }`}
                  >
                    {filter.label} ({counts[filter.value] || 0})
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Cargando ofertas...</p>
          ) : filteredProposals.length ? (
            <div className="space-y-3">
              {filteredProposals.map((proposal) => (
                <button
                  key={proposal._id || proposal.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/my-offers/${proposal._id}`)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left transition hover:border-yellow-300 hover:bg-yellow-50/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold ${statusClass(proposal?.status)}`}>
                          {getStatusLabel(proposal?.status)}
                        </span>
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{formatDate(proposal?.createdAt)}</span>
                      </div>
                      {proposal?.status === "REJECTED" && proposal?.rejectionReason && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">Motivo: {proposal.rejectionReason}</p>
                      )}
                      <h2 className="truncate text-base font-black text-gray-900 dark:text-gray-100">{getRequestTitle(proposal)}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{getRequestDescription(proposal)}</p>

                      {renderMeeting(proposal)}
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-sm font-black text-gray-900 dark:text-gray-100">{formatMoney(proposal?.price)}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-400 dark:text-gray-500">Ver detalle</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <ClipboardDocumentListIcon className="mx-auto mb-4 size-12 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-bold text-gray-500 dark:text-gray-400">No hay ofertas en este filtro</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Cuando envies propuestas apareceran aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DateTimePickerModal
        open={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        onConfirm={handleProposeTime}
        title="Proponé otro horario para la entrevista"
      />
    </div>
  );
};