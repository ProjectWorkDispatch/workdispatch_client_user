import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhotoIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../shared/components/ui/Button";
import { Modal } from "../../shared/components/ui/Modal";

const getCategoryName = (request) => {
  const category = request?.categoryId || request?.category;
  if (!category) return "Sin categoria";
  if (typeof category === "string") return "Categoria asignada";
  return category.name || category.nombre || "Categoria asignada";
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
    month: "long",
    year: "numeric",
  }).format(date);
};

const getImageUrl = (job) => {
  return job?.serviceImage?.url || job?.image?.url || job?.photo?.url || "";
};

const getClientName = (job) => {
  const client = job?.clientId || job?.client;
  if (!client || typeof client === "string") return "Cliente";

  return `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Cliente";
};

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-3">
    <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
      <Icon className="size-4" />
      {label}
    </div>
    <p className="text-sm font-bold text-gray-900">{value}</p>
  </div>
);

export const WorkerRequestDetailsModal = ({
  open,
  onClose,
  job,
  alreadyOffered,
  onOffer,
}) => {
  const imageUrl = getImageUrl(job);

  return (
    <Modal open={open} onClose={onClose} title="Informacion de la solicitud" size="xl">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={job?.title || "Imagen de la solicitud"}
              className="h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-44 flex-col items-center justify-center gap-2 text-gray-400">
              <PhotoIcon className="size-10" />
              <span className="text-sm font-semibold">Sin imagen adjunta</span>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-yellow-500 px-2 py-0.5 text-xs font-bold text-gray-900">
              {getCategoryName(job)}
            </span>
            {alreadyOffered && (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                Ya ofertaste
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-gray-900">{job?.title || "Solicitud abierta"}</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
            {job?.description || "El cliente aun no agrego una descripcion detallada."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem icon={CurrencyDollarIcon} label="Presupuesto" value={formatBudget(job)} />
          <DetailItem icon={CalendarDaysIcon} label="Publicado" value={formatDate(job?.createdAt)} />
          <DetailItem icon={MapPinIcon} label="Ubicacion" value={job?.address || "Ubicacion por confirmar"} />
          <DetailItem icon={UserCircleIcon} label="Cliente" value={getClientName(job)} />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" onClick={onOffer} disabled={alreadyOffered}>
            {alreadyOffered ? "Ya ofertaste" : "Enviar oferta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
