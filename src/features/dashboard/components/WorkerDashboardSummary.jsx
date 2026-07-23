import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BriefcaseIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import {
  Badge,
  Card,
  CardContent,
} from "../../../shared/components/layout/DashboardContainer";
import {
  getCategories,
  getOpenServiceRequests,
  getWorkerProposals,
  getWorkerServices,
  getWorkerSkills,
} from "../../../shared/api/user";
import { DashboardStats } from "./DashboardStats";
import { WorkerOfferModal } from "./WorkerOfferModal";
import { WorkerRequestDetailsModal } from "./WorkerRequestDetailsModal";

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
const JOBS_PER_PAGE = 5;

const getImageUrl = (job) => {
  return job?.serviceImage?.url || job?.image?.url || job?.photo?.url || "";
};

const getCategoryName = (request) => {
  const category = request?.categoryId || request?.category;
  if (!category) return "Sin categoria";
  if (typeof category === "string") return "Categoria asignada";
  return category.name || category.nombre || "Categoria asignada";
};

const getSearchText = (job) => {
  return [
    job?.title,
    job?.description,
    job?.address,
    getCategoryName(job),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

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
    month: "short",
  }).format(date);
};

const getStatusLabel = (status) => {
  const labels = {
    PENDING: "Pendiente",
    ACCEPTED: "Aceptada",
    REJECTED: "Rechazada",
    CANCELLED: "Cancelada",
    IN_PROGRESS: "En curso",
    COMPLETED: "Completada",
  };

  return labels[status] || status || "Pendiente";
};

const statusClass = (status) => {
  const styles = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return styles[status] || "bg-gray-100 text-gray-600 border-gray-200";
};

export const WorkerDashboardSummary = ({ user }) => {
  const workerId = getUserId(user);
  const [loadingWorkerData, setLoadingWorkerData] = useState(false);
  const [workerError, setWorkerError] = useState("");
  const [openJobs, setOpenJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [jobsPage, setJobsPage] = useState(1);
  const [skills, setSkills] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedOfferJob, setSelectedOfferJob] = useState(null);
  const [selectedDetailsJob, setSelectedDetailsJob] = useState(null);

  useEffect(() => {
    if (!workerId) return;

    let mounted = true;

    const loadWorkerDashboard = async () => {
      setLoadingWorkerData(true);
      setWorkerError("");

      try {
        const [jobsResponse, categoriesResponse, skillsResponse, proposalsResponse, servicesResponse] = await Promise.all([
          getOpenServiceRequests(),
          getCategories(),
          getWorkerSkills(workerId),
          getWorkerProposals(workerId),
          getWorkerServices(workerId),
        ]);

        if (!mounted) return;

        setOpenJobs(getArrayFromResponse(jobsResponse, ["requests", "serviceRequests"]));
        setCategories(getArrayFromResponse(categoriesResponse, ["categories"]));
        setSkills(getArrayFromResponse(skillsResponse, ["skills"]));
        setProposals(getArrayFromResponse(proposalsResponse, ["proposals"]));
        setServices(getArrayFromResponse(servicesResponse, ["services", "service"]));
      } catch (error) {
        if (!mounted) return;
        setWorkerError(error?.response?.data?.message || "No se pudo cargar el resumen del trabajador.");
      } finally {
        if (mounted) setLoadingWorkerData(false);
      }
    };

    loadWorkerDashboard();

    return () => {
      mounted = false;
    };
  }, [workerId]);

  const skillCategoryIds = useMemo(() => {
    return new Set(
      skills
        .map((skill) => getId(skill?.skillId?.categoryId || skill?.categoryId))
        .filter(Boolean)
    );
  }, [skills]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = jobSearch.trim().toLowerCase();

    return openJobs.filter((job) => {
      const categoryId = getId(job?.categoryId || job?.category);
      const matchesCategory = !selectedCategoryId || categoryId === selectedCategoryId;
      const matchesSearch = !normalizedSearch || getSearchText(job).includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [jobSearch, openJobs, selectedCategoryId]);

  useEffect(() => {
    setJobsPage(1);
  }, [jobSearch, selectedCategoryId]);

  const totalJobPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const safePage = Math.min(jobsPage, totalJobPages);
    const start = (safePage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(start, start + JOBS_PER_PAGE);
  }, [filteredJobs, jobsPage, totalJobPages]);

  useEffect(() => {
    if (jobsPage > totalJobPages) setJobsPage(totalJobPages);
  }, [jobsPage, totalJobPages]);

  const pendingProposals = proposals.filter((proposal) => proposal?.status === "PENDING");
  const activeServices = services.filter((service) => service?.status === "IN_PROGRESS");
  const proposedRequestIds = useMemo(() => {
    return new Set(
      proposals
        .map((proposal) => getId(proposal?.serviceRequestId))
        .filter(Boolean)
    );
  }, [proposals]);

  const handleOpenOfferModal = (job) => {
    if (proposedRequestIds.has(getId(job))) {
      toast.error("Ya enviaste una oferta para esta solicitud.");
      return;
    }

    setSelectedOfferJob(job);
  };

  const handleOfferFromDetails = () => {
    const job = selectedDetailsJob;
    if (!job) return;

    setSelectedDetailsJob(null);
    handleOpenOfferModal(job);
  };

  const handleProposalCreated = (proposal) => {
    if (!proposal) return;
    setProposals((current) => [proposal, ...current]);
  };

  const stats = [
    { label: "Trabajos Disponibles", value: filteredJobs.length, icon: BriefcaseIcon, bg: "bg-yellow-50", border: "border-yellow-200", color: "text-yellow-600" },
    { label: "Mis Ofertas", value: pendingProposals.length, icon: ClipboardDocumentListIcon, bg: "bg-gray-100", border: "border-gray-300", color: "text-gray-700" },
    { label: "En Curso", value: activeServices.length, icon: CheckCircleIcon, bg: "bg-gray-200", border: "border-gray-400", color: "text-gray-900" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Dashboard de Trabajador</h1>
          <p className="text-gray-600 mt-1">Revisa trabajos disponibles, ofertas enviadas y trabajos en curso</p>
        </div>
      </div>

      {workerError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0" />
          <p>{workerError}</p>
        </div>
      )}

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Buscar trabajos disponibles</h2>
              <p className="text-sm text-gray-500">
                Filtra solicitudes abiertas por categoria y texto.
              </p>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={jobSearch}
                  onChange={(event) => setJobSearch(event.target.value)}
                  placeholder="Buscar por titulo, descripcion o ubicacion"
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
              </div>
              <select
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              >
                <option value="">Todas las categorias</option>
                {categories.map((category) => (
                  <option key={category._id || category.id} value={getId(category)}>
                    {category.name || category.nombre || "Categoria"}
                  </option>
                ))}
              </select>
            </div>

            {loadingWorkerData ? (
              <p className="py-10 text-center text-sm font-semibold text-gray-500">Cargando trabajos disponibles...</p>
            ) : filteredJobs.length ? (
              <div className="space-y-4">
                {paginatedJobs.map((job) => {
                  const matchesWorkerProfile = skillCategoryIds.has(getId(job?.categoryId || job?.category));
                  const alreadyOffered = proposedRequestIds.has(getId(job));
                  const imageUrl = getImageUrl(job);
                  return (
                  <div key={job._id || job.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex gap-3">
                      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {imageUrl ? (
                          <img src={imageUrl} alt={job.title || "Solicitud"} className="size-full object-cover" />
                        ) : (
                          <PhotoIcon className="size-8 text-gray-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge className="bg-yellow-500 text-gray-900">{getCategoryName(job)}</Badge>
                          {matchesWorkerProfile && <Badge variant="outline">Coincide con tu perfil</Badge>}
                        </div>
                        <h3 className="truncate text-base font-bold text-gray-900">{job.title || "Trabajo disponible"}</h3>
                        <p className="mt-1 text-sm font-black text-gray-900">{formatBudget(job)}</p>
                        <p className="mt-1 text-xs text-gray-500">{formatDate(job.createdAt)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailsJob(job)}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400 px-4 text-sm font-bold text-gray-900 transition hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                      >
                        Ver detalles
                      </button>
                      {alreadyOffered && (
                        <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
                          Ya ofertaste
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
                {totalJobPages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-500">
                      Pagina {jobsPage} de {totalJobPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setJobsPage((page) => Math.max(1, page - 1))}
                        disabled={jobsPage === 1}
                        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 transition hover:border-yellow-400 hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setJobsPage((page) => Math.min(totalJobPages, page + 1))}
                        disabled={jobsPage === totalJobPages}
                        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 transition hover:border-yellow-400 hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center">
                <BriefcaseIcon className="size-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No hay trabajos con esos filtros</p>
                <p className="text-gray-400 text-sm">Prueba otra categoria o cambia la busqueda.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Estado de tus ofertas</h2>
              <p className="text-sm text-gray-500 mb-4">Seguimiento rapido de propuestas enviadas.</p>

              {proposals.length ? (
                <div className="space-y-3">
                  {proposals.slice(0, 4).map((proposal) => (
                    <div key={proposal._id || proposal.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {proposal?.serviceRequestId?.title || "Oferta enviada"}
                          </p>
                          <p className="text-xs text-gray-500">{formatMoney(proposal?.price)}</p>
                        </div>
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${statusClass(proposal?.status)}`}>
                          {getStatusLabel(proposal?.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aun no hay ofertas registradas.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Trabajos en curso</h2>
              <p className="text-sm text-gray-500 mb-4">Servicios activos que necesitan seguimiento.</p>

              {activeServices.length ? (
                <div className="space-y-3">
                  {activeServices.slice(0, 4).map((service) => (
                    <div key={service._id || service.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {service?.requestId?.title || service?.serviceCode || "Trabajo en curso"}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-500">{formatMoney(service?.finalPrice)}</p>
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold ${statusClass(service?.status)}`}>
                          {getStatusLabel(service?.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No tienes trabajos en curso.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <WorkerOfferModal
        open={!!selectedOfferJob}
        onClose={() => setSelectedOfferJob(null)}
        job={selectedOfferJob}
        workerId={workerId}
        hasExistingProposal={selectedOfferJob ? proposedRequestIds.has(getId(selectedOfferJob)) : false}
        onCreated={handleProposalCreated}
      />
      <WorkerRequestDetailsModal
        open={!!selectedDetailsJob}
        onClose={() => setSelectedDetailsJob(null)}
        job={selectedDetailsJob}
        alreadyOffered={selectedDetailsJob ? proposedRequestIds.has(getId(selectedDetailsJob)) : false}
        onOffer={handleOfferFromDetails}
      />
    </div>
  );
};
