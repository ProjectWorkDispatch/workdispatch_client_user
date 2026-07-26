import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";
import { createReview } from "../../../shared/api/user";

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.Id || "";
};

const getClientName = (service) => {
  const client = service?.clientId;
  if (!client || typeof client === "string") return "cliente";
  return `${client.firstName || ""} ${client.lastName || ""}`.trim() || "cliente";
};

export const WorkerReviewModal = ({
  open,
  onClose,
  service,
  workerId,
  onCreated,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRating(5);
    setComment("");
    setError("");
    setSubmitting(false);
  }, [open, service]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const serviceId = getId(service);
    const clientId = getId(service?.clientId);

    if (!serviceId || !workerId || !clientId) {
      setError("Faltan datos para crear la resena.");
      return;
    }

    if (!comment.trim()) {
      setError("Escribe un comentario para el cliente.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await createReview({
        serviceId,
        reviewerId: workerId,
        revieweredId: clientId,
        Rating: rating,
        Comment: comment.trim(),
      });
      onCreated?.(response?.data?.review);
      onClose?.();
    } catch (submitError) {
      setError(submitError?.response?.data?.message || "No se pudo enviar la resena.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Dejar resena al cliente" size="md">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-semibold text-gray-500">Cliente</p>
          <p className="mt-1 text-lg font-black text-gray-900">{getClientName(service)}</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">Calificacion</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-md p-1 transition hover:bg-yellow-50"
                aria-label={`${value} estrellas`}
              >
                <StarIcon
                  className={`size-8 ${value <= rating ? "text-yellow-400" : "text-gray-200"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700" htmlFor="worker-review-comment">
            Comentario
          </label>
          <textarea
            id="worker-review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            placeholder="Cuéntanos como fue trabajar con este cliente."
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            Enviar resena
          </Button>
        </div>
      </form>
    </Modal>
  );
};
