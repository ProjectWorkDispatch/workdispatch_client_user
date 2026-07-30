import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BriefcaseIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "../../auth/store/authStore";
import {
  Badge,
  Card,
  CardContent,
} from "../../../shared/components/layout/DashboardContainer";
import {
  getCategories,
  getOpenServiceRequests,
  getWorkerProposals,
  getWorkerSkills,
} from "../../../shared/api/user";
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

const JOBS_PER_PAGE = 10;

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
  return [job?.title, job?.description, job?.address, getCategoryName(job)]
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

export const WorkerFindJobsPage = () => {
  const { user } = useAuthStore();
  const workerId = user?.id || user?._id || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openJobs, setOpenJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [jobsPage, setJobsPage] = useState(1);
  const [skills, setSkills] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selectedOfferJob, setSelectedOfferJob] = useState(null);
  const [selectedDetailsJob, setSelectedDetailsJob] = useState(null);

  useEffect(() => {
    if (!workerId) return;
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [jobsResponse, categoriesResponse, skillsResponse, proposalsResponse] = await Promise.all([
          getOpenServiceRequests(),
          getCategories(),
          getWorkerSkills(workerId),
          getWorkerProposals(workerId),
        ]);
        if (!mounted) return;
        setOpenJobs(getArrayFromResponse(jobsResponse, ["requests", "serviceRequests"]));
        setCategories(getArrayFromResponse(categoriesResponse, ["categories"]));
        setSkills(getArrayFromResponse(skillsResponse, ["skills"]));
        setProposals(getArrayFromResponse(proposalsResponse, ["proposals"]));
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || "No se pudieron cargar los trabajos.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [workerId]);

  const proposedRequestIds = useMemo(() => {
    return new Set(
      proposals.map((proposal) => getId(proposal?.serviceRequestId)).filter(Boolean)
    );
  }, [proposals]);

  const skillCategoryIds = useMemo(() => {
    return new Set(
      skills.map((skill) => getId(skill?.skillId?.categoryId || skill?.categoryId)).filter(Boolean)
    );
  }, [skills]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = jobSearch.trim().toLowerCase();
    return openJobs.filter((job) => {
      const categoryId = getId(job?.categoryId || job?.category);
      const matchesCategory = !selectedCategoryId || categoryId === selectedCategoryId;
      const matchesSearch = !normalizedSearch || getSearchText(job).includes(normalizedSearch);
      const notProposed = !proposedRequestIds.has(getId(job));
      return matchesCategory && matchesSearch && notProposed;
    });
  }, [jobSearch, openJobs, selectedCategoryId, proposedRequestIds]);

  useEffect(() => { setJobsPage(1); }, [jobSearch, selectedCategoryId]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      const aMatches = skillCategoryIds.has(getId(a?.categoryId || a?.category));
      const bMatches = skillCategoryIds.has(getId(b?.categoryId || b?.category));
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredJobs, skillCategoryIds]);

  const totalJobPages = Math.max(1, Math.ceil(sortedJobs.length / JOBS_PER_PAGE));
  const paginatedJobs = useMemo(() => {
    const safePage = Math.min(jobsPage, totalJobPages);
    const start = (safePage - 1) * JOBS_PER_PAGE;
    return sortedJobs.slice(start, start + JOBS_PER_PAGE);
  }, [sortedJobs, jobsPage, totalJobPages]);

  useEffect(() => {
    if (jobsPage > totalJobPages) setJobsPage(totalJobPages);
  }, [jobsPage, totalJobPages]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Buscar Trabajos</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Encuentra solicitudes abiertas y envia tus ofertas
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-400">
          <span className="mt-0.5 size-5 shrink-0">⚠</span>
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="search"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Buscar por titulo, descripcion o ubicacion"
                className="h-11 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              />
            </div>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            >
              <option value="">Todas las categorias</option>
              {categories.map((category) => (
                <option key={category._id || category.id} value={getId(category)}>
                  {category.name || category.nombre || "Categoria"}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Cargando trabajos disponibles...</p>
          ) : paginatedJobs.length ? (
            <div className="space-y-4">
              {paginatedJobs.map((job) => {
                const matchesProfile = skillCategoryIds.has(getId(job?.categoryId || job?.category));
                const alreadyOffered = proposedRequestIds.has(getId(job));
                const imageUrl = getImageUrl(job);
                return (
                  <div key={job._id || job.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                    <div className="flex gap-3">
                      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                        {imageUrl ? (
                          <img src={imageUrl} alt={job.title || "Solicitud"} className="size-full object-cover" />
                        ) : (
                          <PhotoIcon className="size-8 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge className="bg-yellow-500 text-gray-900 dark:text-gray-100">{getCategoryName(job)}</Badge>
                          {matchesProfile && <Badge variant="outline">Coincide con tu perfil</Badge>}
                        </div>
                        <h3 className="truncate text-base font-bold text-gray-900 dark:text-gray-100">{job.title || "Trabajo disponible"}</h3>
                        <p className="mt-1 text-sm font-black text-gray-900 dark:text-gray-100">{formatBudget(job)}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{job?.address || "Ubicacion por confirmar"}</p>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{formatDate(job.createdAt)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailsJob(job)}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400 px-4 text-sm font-bold text-gray-900 dark:text-gray-100 transition hover:bg-yellow-500"
                      >
                        Ver detalles
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenOfferModal(job)}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-yellow-400 bg-white dark:bg-gray-800 px-4 text-sm font-bold text-gray-900 dark:text-gray-100 transition hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                      >
                        Enviar oferta
                      </button>
                      {alreadyOffered && (
                        <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-green-900/30 px-3 text-sm font-bold text-emerald-700 dark:text-green-400">
                          Ya ofertaste
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {totalJobPages > 1 && (
                <div className="flex flex-col gap-3 border-t border-gray-100 dark:border-gray-700 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Pagina {jobsPage} de {totalJobPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setJobsPage((p) => Math.max(1, p - 1))}
                      disabled={jobsPage === 1}
                      className="h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm font-bold text-gray-700 dark:text-gray-300 transition hover:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobsPage((p) => Math.min(totalJobPages, p + 1))}
                      disabled={jobsPage === totalJobPages}
                      className="h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm font-bold text-gray-700 dark:text-gray-300 transition hover:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center">
              <BriefcaseIcon className="mx-auto mb-4 size-12 text-gray-400 dark:text-gray-500" />
              <p className="mb-2 text-lg text-gray-500 dark:text-gray-400">No hay trabajos con esos filtros</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Prueba otra categoria o cambia la busqueda.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
