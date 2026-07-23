import { useEffect, useMemo, useState } from "react";
import {
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardContent,
} from "../../shared/components/layout/DashboardContainer";
import { getWorkerProposals } from "../../shared/api/user";
import { useAuthStore } from "../auth/store/authStore";
import { WorkerRequestDetailsModal } from "../Dashboard/WorkerRequestDetailsModal";

const getArrayFromResponse = (response, keys = []) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.Id || "";
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
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return styles[status] || "bg-gray-100 text-gray-600 border-gray-200";
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
  const { user } = useAuthStore();
  const workerId = getUserId(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proposals, setProposals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (!workerId) return;

    let mounted = true;

    const loadOffers = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getWorkerProposals(workerId);
        if (!mounted) return;
        setProposals(getArrayFromResponse(response, ["proposals"]));
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError?.response?.data?.message || "No se pudieron cargar tus ofertas.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOffers();

    return () => {
      mounted = false;
    };
  }, [workerId]);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Mis Ofertas</h1>
        <p className="mt-1 text-gray-600">Revisa las propuestas que has enviado y su estado actual.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <FunnelIcon className="size-5 text-gray-400" />
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
                        : "border-gray-200 bg-white text-gray-600 hover:border-yellow-300 hover:bg-yellow-50"
                    }`}
                  >
                    {filter.label} ({counts[filter.value] || 0})
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm font-semibold text-gray-500">Cargando ofertas...</p>
          ) : filteredProposals.length ? (
            <div className="space-y-3">
              {filteredProposals.map((proposal) => (
                <button
                  key={proposal._id || proposal.id}
                  type="button"
                  onClick={() => setSelectedRequest(proposal?.serviceRequestId || null)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-yellow-300 hover:bg-yellow-50/40"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold ${statusClass(proposal?.status)}`}>
                          {getStatusLabel(proposal?.status)}
                        </span>
                        <span className="text-xs font-semibold text-gray-400">{formatDate(proposal?.createdAt)}</span>
                      </div>
                      <h2 className="truncate text-base font-black text-gray-900">{getRequestTitle(proposal)}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{getRequestDescription(proposal)}</p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-sm font-black text-gray-900">{formatMoney(proposal?.price)}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-400">Ver detalle</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <ClipboardDocumentListIcon className="mx-auto mb-4 size-12 text-gray-400" />
              <p className="text-lg font-bold text-gray-500">No hay ofertas en este filtro</p>
              <p className="mt-1 text-sm text-gray-400">Cuando envies propuestas apareceran aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <WorkerRequestDetailsModal
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        job={selectedRequest}
        alreadyOffered
        onOffer={() => {}}
      />
    </div>
  );
};
