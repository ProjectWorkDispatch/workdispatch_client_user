import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../../shared/components/ui/Modal";
import { Button } from "../../../shared/components/ui/Button";
import { StarRating } from "./StarRating";
import { useAuthStore } from "../../auth/store/authStore";
import { useReviewsStore } from "../../../shared/store/userStore";
import { ReportModal } from "../../reports/components/ReportModal";

const LOW_RATING_REASONS = [
  "El trabajo no se completó como se acordó",
  "Mala actitud o comportamiento inapropiado",
  "Llegó muy tarde o no se presentó",
  "Cobró más de lo pactado",
  "Dañó algo durante el trabajo",
  "Mala comunicación",
  "Otro",
];

export const PostServiceReviewFlow = ({
  open,
  onClose,
  serviceId,
  revieweredId,
  revieweredName,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const currentUserId = user?._id || user?.id;
  const { createReview, loading } = useReviewsStore();

  const [step, setStep] = useState("prompt");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);

  const reset = () => {
    setStep("prompt");
    setRating(0);
    setComment("");
    setSelectedReasons([]);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleRateSubmit = () => {
    if (!rating) {
      toast.error("Selecciona una calificación");
      return;
    }
    if (!comment.trim()) {
      toast.error("Escribe un comentario");
      return;
    }
    if (rating <= 2) {
      setStep("lowRatingSurvey");
    } else {
      submitReview([]);
    }
  };

  const submitReview = async (reasons) => {
    const result = await createReview({
      serviceId,
      reviewerId: currentUserId,
      revieweredId,
      Rating: rating,
      Comment: comment.trim(),
      LowRatingReasons: reasons.length > 0 ? reasons : undefined,
    });

    if (result.success) {
      toast.success("Reseña enviada correctamente");
      setStep("done");
      onSuccess?.(result.data);
    } else {
      toast.error(result.error);
    }
  };

  const handleLowRatingSubmit = () => {
    submitReview(selectedReasons);
  };

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={
          step === "prompt"
            ? "Reseña post-servicio"
            : step === "rate"
            ? "Calificar servicio"
            : step === "lowRatingSurvey"
            ? "Cuéntanos más"
            : "¡Gracias!"
        }
        footer={
          step === "done"
            ? (
                <Button onClick={handleClose}>Cerrar</Button>
              )
            : step === "prompt"
            ? (
                <>
                  <Button variant="ghost" onClick={handleClose}>Ahora no</Button>
                  <Button onClick={() => setStep("rate")}>Dejar reseña</Button>
                </>
              )
            : step === "rate"
            ? (
                <>
                  <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                  <Button onClick={handleRateSubmit}>Siguiente</Button>
                </>
              )
            : step === "lowRatingSurvey"
            ? (
                <>
                  <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                  <Button onClick={handleLowRatingSubmit} loading={loading}>Enviar reseña</Button>
                </>
              )
            : null
        }
      >
        {step === "prompt" && (
          <div className="py-4 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              ¿Qué tal estuvo el trabajo con{" "}
              <span className="font-bold text-gray-900 dark:text-gray-100">{revieweredName || "esta persona"}</span>?
            </p>
          </div>
        )}

        {step === "rate" && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estás calificando a</p>
              <p className="font-bold text-gray-900 dark:text-gray-100">{revieweredName || "Usuario"}</p>
            </div>
            <div className="flex flex-col items-center gap-2 py-2">
              <StarRating value={rating} onChange={setRating} />
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {rating > 0 ? `${rating} de 5 estrellas` : "Selecciona una calificación"}
              </span>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Comentario</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Cuéntanos cómo fue tu experiencia..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 outline-none text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 resize-none"
              />
            </div>
          </div>
        )}

        {step === "lowRatingSurvey" && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecciona los motivos que aplican (opcional):
            </p>
            <div className="space-y-2">
              {LOW_RATING_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-300 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(reason)}
                    onChange={() => toggleReason(reason)}
                    className="size-4 rounded border-gray-300 dark:border-gray-600 text-yellow-500 focus:ring-yellow-400"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
                </label>
              ))}
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-400 mb-2">
                ¿El servicio fue realmente grave? Puedes reportar a{" "}
                <span className="font-bold">{revieweredName}</span> para que el equipo lo revise.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReportOpen(true)}
              >
                Crear reporte
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">¡Gracias por tu reseña!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tu opinión ayuda a mejorar la comunidad.</p>
          </div>
        )}
      </Modal>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reporteredId={revieweredId}
        reporteredName={revieweredName}
      />
    </>
  );
};
