import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";
import { createProposal, getAiEstimate } from "../../../shared/api/user";
import { useRequireVerification } from "../../verification/hooks/useRequireVerification";
import { blockInvalidNumberKeys } from "../../../shared/utils/inputRestrictions.js";

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.Id || "";
};

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

const getSuggestedPrice = (job) => {
  const min = Number(job?.budgetMin);
  const max = Number(job?.budgetMax);

  if (Number.isFinite(min) && Number.isFinite(max)) {
    return Math.max(0, Math.round(((min + max) / 2) / 25) * 25);
  }

  if (Number.isFinite(max)) return Math.max(0, Math.round((max * 0.85) / 25) * 25);
  if (Number.isFinite(min)) return Math.max(0, Math.round((min * 1.15) / 25) * 25);
  return "";
};

const getSuggestedTime = (job) => {
  const textLength = `${job?.title || ""} ${job?.description || ""}`.trim().length;
  if (textLength > 220) return "5 a 7 dias";
  if (textLength > 110) return "3 a 5 dias";
  return "1 a 2 dias";
};

const buildAiMessage = (job, estimatedTime) => {
  const title = job?.title || "la solicitud";
  const category = getCategoryName(job).toLowerCase();
  const location = job?.address ? ` en ${job.address}` : "";
  const time = estimatedTime || getSuggestedTime(job);

  return `Hola, puedo ayudarte con ${title}${location}. Tengo experiencia en trabajos de ${category} y puedo completarlo en aproximadamente ${time}. Mi propuesta incluye revisar los detalles contigo antes de iniciar, realizar el trabajo con cuidado y mantenerte informado durante el proceso.`;
};

export const WorkerOfferModal = ({
  open,
  onClose,
  job,
  workerId,
  hasExistingProposal,
  onCreated,
}) => {
  const { requireVerification } = useRequireVerification();
  const [price, setPrice] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setPrice("");
    setEstimatedTime("");
    setMessage("");
    setError("");
    setSubmitting(false);
  }, [job, open]);

  const requestId = getId(job);
  const finalMessage = useMemo(() => {
    if (!estimatedTime.trim() || !message.trim()) return "";
    return `Tiempo estimado: ${estimatedTime.trim()}\n\n${message.trim()}`;
  }, [estimatedTime, message]);

  const handleAiSuggestion = async () => {
    setAiLoading(true);
    try {
      const res = await getAiEstimate({
        title: job?.title,
        description: job?.description,
        categoryName: getCategoryName(job),
        budgetMin: job?.budgetMin,
        budgetMax: job?.budgetMax,
      });
      const data = res.data.data;
      
      if (!price) setPrice(String(data.budgetMax ?? data.budgetMin ?? ""));
      if (!estimatedTime.trim()) setEstimatedTime(data.estimatedTime || "");
      setMessage(data.suggestedMessage || buildAiMessage(job, data.estimatedTime));
    } catch {
      toast.error("No se pudo generar el estimado con IA");
      const suggestedPrice = getSuggestedPrice(job);
      const suggestedTime = estimatedTime.trim() || getSuggestedTime(job);
      if (!price && suggestedPrice) setPrice(String(suggestedPrice));
      if (!estimatedTime.trim()) setEstimatedTime(suggestedTime);
      setMessage(buildAiMessage(job, suggestedTime));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!requireVerification("enviar una propuesta")) return;

    const numericPrice = Number(price);

    if (hasExistingProposal) {
      setError("Ya enviaste una oferta para esta solicitud.");
      return;
    }

    if (!requestId || !workerId) {
      setError("No se pudo identificar la solicitud o el trabajador.");
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError("Ingresa un monto valido mayor a 0.");
      return;
    }

    if (!estimatedTime.trim()) {
      setError("Ingresa el tiempo estimado para completar el trabajo.");
      return;
    }

    if (!message.trim()) {
      setError("Escribe un mensaje para explicar tu propuesta.");
      return;
    }

    if (finalMessage.length > 500) {
      setError("El mensaje junto con el tiempo estimado no puede exceder 500 caracteres.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createProposal({
        serviceRequestId: requestId,
        workerId,
        price: numericPrice,
        message: finalMessage,
      });

      toast.success("Oferta enviada correctamente.");
      onCreated?.(response?.data?.proposal);
      onClose?.();
    } catch (submitError) {
      const messageFromApi = submitError?.response?.data?.message || "No se pudo enviar la oferta.";
      setError(messageFromApi);
      toast.error(messageFromApi);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Hacer oferta" size="lg">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-4">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{job?.title || "Solicitud abierta"}</p>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
            {job?.description || "El cliente aun no agrego una descripcion detallada."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
            <span className="rounded-md bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 text-yellow-800 dark:text-yellow-400">{getCategoryName(job)}</span>
            <span className="rounded-md bg-white dark:bg-gray-800 px-2 py-1">{formatMoney(job?.budgetMin)} - {formatMoney(job?.budgetMax)}</span>
          </div>
        </div>

        {hasExistingProposal && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/30 p-3 text-sm font-semibold text-yellow-800 dark:text-yellow-400">
            Ya enviaste una oferta para esta solicitud. Solo se permite una por trabajador.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Monto a cobrar</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              onKeyDown={blockInvalidNumberKeys}
              placeholder="Ej. 350"
              className="h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              disabled={hasExistingProposal || submitting}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Tiempo estimado</span>
            <input
              type="text"
              value={estimatedTime}
              onChange={(event) => setEstimatedTime(event.target.value)}
              placeholder="Ej. 2 a 3 dias"
              className="h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
              disabled={hasExistingProposal || submitting}
            />
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Mensaje para el cliente</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            maxLength={430}
            placeholder="Explica por que eres una buena opcion para este trabajo."
            className="w-full resize-none rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 px-3 py-2 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            disabled={hasExistingProposal || submitting}
          />
          <span className="block text-right text-xs text-gray-400 dark:text-gray-500">{finalMessage.length || message.length}/500</span>
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleAiSuggestion}
            loading={aiLoading}
            disabled={hasExistingProposal || submitting || aiLoading}
          >
            <SparklesIcon className="size-4" />
            Sugerir con IA
          </Button>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} disabled={hasExistingProposal}>
              Enviar oferta
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
