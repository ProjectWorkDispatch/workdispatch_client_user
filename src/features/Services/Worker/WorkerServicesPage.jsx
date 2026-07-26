import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MapPinIcon,
  StarIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardContent,
} from "../../../shared/components/layout/DashboardContainer";
import { Button } from "../../../shared/components/ui/Button";
import {
  getReviewsByReviewer,
  getWorkerServices,
} from "../../../shared/api/user";
import { useAuthStore } from "../../auth/store/authStore";
import { WorkerReviewModal } from "./WorkerReviewModal";

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

const getUserId = (user) => user?.id || user?._id || user?.userId || user?.Id || "";

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

const getRequest = (service) => {
  const request = service?.requestId || service?.serviceRequestId;
  return request && typeof request === "object" ? request : null;
};

const getClientName = (service) => {
  const client = service?.clientId;
  if (!client || typeof client === "string") return "Cliente";
  return `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Cliente";
};

const getCategoryName = (service) => {
  const category = getRequest(service)?.categoryId;
  if (!category) return "Sin categoria";
  if (typeof category === "string") return "Categoria asignada";
  return category.name || category.nombre || "Categoria asignada";
};

const getStatusLabel = (status) => {
  const labels = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En curso",
    COMPLETED: "Finalizado",
    CANCELLED: "Cancelado",
  };

  return labels[status] || status || "En curso";
};

const statusClass = (status) => {
  const styles = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    IN_PROGRESS: "bg-sky-50 text-sky-700 border-sky-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
  };

  return styles[status] || "bg-gray-100 text-gray-600 border-gray-200";
};

const getImageUrl = (service) => {
  const request = getRequest(service);
  return request?.serviceImage?.url || request?.image?.url || request?.photo?.url || "";
};

const FILTERS = [
  { value: "ALL", label: "Todos" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "COMPLETED", label: "Finalizados" },
  { value: "CANCELLED", label: "Cancelados" },
];

export const WorkerServicesPage = () => {
  const { user } = useAuthStore();
  const workerId = getUserId(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    if (!workerId) return;

    let mounted = true;

    const loadServices = async () => {
      setLoading(true);
      setError("");

      try {
        const [servicesResponse, reviewsResponse] = await Promise.all([
          getWorkerServices(workerId),
          getReviewsByReviewer(workerId),
        ]);

        if (!mounted) return;
        setServices(getArrayFromResponse(servicesResponse, ["services"]));
        setReviews(getArrayFromResponse(reviewsResponse, ["reviews"]));
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError?.response?.data?.message || "No se pudieron cargar tus servicios.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, [workerId]);

  const reviewedServiceIds = useMemo(() => {
    return new Set(reviews.map((review) => getId(review?.serviceId)).filter(Boolean));
  }, [reviews]);

  const counts = useMemo(() => {
    return services.reduce(
      (acc, service) => {
        const status = service?.status || "IN_PROGRESS";
        acc.ALL += 1;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { ALL: 0, PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 }
    );
  }, [services]);

  const filteredServices = useMemo(() => {
    if (statusFilter === "ALL") return services;
    return services.filter((service) => service?.status === statusFilter);
  }, [services, statusFilter]);

  const handleReviewCreated = (review) => {
    if (!review) return;
    setReviews((current) => [review, ...current]);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Mis Servicios</h1>
        <p className="mt-1 text-gray-600">Revisa tus trabajos activos, finalizados y cancelados.</p>
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
            <p className="py-10 text-center text-sm font-semibold text-gray-500">Cargando servicios...</p>
          ) : filteredServices.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredServices.map((service) => {
                const request = getRequest(service);
                const imageUrl = getImageUrl(service);
                const serviceId = getId(service);
                const isCompleted = service?.status === "COMPLETED";
                const alreadyReviewed = reviewedServiceIds.has(serviceId);

                return (
                  <article key={serviceId} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="flex min-h-full flex-col">
                      <div className="flex gap-4 p-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={request?.title || "Imagen del servicio"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <BriefcaseIcon className="size-8" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${statusClass(service?.status)}`}>
                              {getStatusLabel(service?.status)}
                            </span>
                            <span className="rounded-md bg-yellow-50 px-2 py-0.5 text-xs font-bold text-yellow-700">
                              {getCategoryName(service)}
                            </span>
                          </div>
                          <h2 className="truncate text-base font-black text-gray-900">
                            {request?.title || service?.serviceCode || "Servicio asignado"}
                          </h2>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">
                            {request?.description || "Sin descripcion disponible."}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 border-t border-gray-100 px-4 py-3 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <UserCircleIcon className="size-4 text-gray-400" />
                          <span className="truncate">{getClientName(service)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPinIcon className="size-4 text-gray-400" />
                          <span className="truncate">{request?.address || "Ubicacion por confirmar"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarDaysIcon className="size-4 text-gray-400" />
                          <span>Inicio: {formatDate(service?.startDate || service?.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CheckCircleIcon className="size-4 text-gray-400" />
                          <span>Fin: {formatDate(service?.endDate)}</span>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-400">Precio final</p>
                          <p className="text-lg font-black text-gray-900">{formatMoney(service?.finalPrice)}</p>
                        </div>

                        {isCompleted ? (
                          alreadyReviewed ? (
                            <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                              <StarIcon className="size-4" />
                              Resena enviada
                            </span>
                          ) : (
                            <Button type="button" onClick={() => setSelectedService(service)}>
                              Dejar resena
                            </Button>
                          )
                        ) : (
                          <span className="text-sm font-semibold text-gray-400">
                            {service?.status === "IN_PROGRESS" ? "Trabajo en seguimiento" : "Sin accion disponible"}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <BriefcaseIcon className="mx-auto mb-4 size-12 text-gray-400" />
              <p className="text-lg font-bold text-gray-500">No hay servicios en este filtro</p>
              <p className="mt-1 text-sm text-gray-400">Cuando acepten una oferta, el servicio aparecera aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <WorkerReviewModal
        open={!!selectedService}
        onClose={() => setSelectedService(null)}
        service={selectedService}
        workerId={workerId}
        onCreated={handleReviewCreated}
      />
    </div>
  );
};
