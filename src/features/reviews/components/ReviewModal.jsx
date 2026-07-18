// client-user/src/features/reviews/components/ReviewModal.jsx  (ARCHIVO NUEVO)
import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../../shared/components/ui/Modal";
import { Button } from "../../../shared/components/ui/Button";
import { StarRating } from "./StarRating";
import { useAuthStore } from "../../auth/store/authStore";
import { useReviewsStore } from "../../../shared/store/userStore";

export const ReviewModal = ({ open, onClose, serviceId, revieweredId, revieweredName, onSuccess }) => {
    const { user } = useAuthStore();
    const currentUserId = user?._id || user?.id;
    const { createReview, loading } = useReviewsStore();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const reset = () => {
        setRating(0);
        setComment("");
    };

    const handleClose = () => {
        reset();
        onClose?.();
    };

    const handleSubmit = async () => {
        if (!rating) {
            toast.error("Selecciona una calificación");
            return;
        }
        if (!comment.trim()) {
            toast.error("Escribe un comentario");
            return;
        }

        const result = await createReview({
            serviceId,
            reviewerId: currentUserId,
            revieweredId,
            Rating: rating,
            Comment: comment.trim(),
        });

        if (result.success) {
            toast.success("Reseña enviada correctamente");
            reset();
            onSuccess?.(result.data);
        } else {
            toast.error(result.error);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Calificar servicio"
            footer={
                <>
                    <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} loading={loading}>Enviar reseña</Button>
                </>
            }
        >
            <div className="space-y-5">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Estás calificando a</p>
                    <p className="font-bold text-gray-900">{revieweredName || "Usuario"}</p>
                </div>

                <div className="flex flex-col items-center gap-2 py-2">
                    <StarRating value={rating} onChange={setRating} />
                    <span className="text-sm text-gray-400">
                        {rating > 0 ? `${rating} de 5 estrellas` : "Selecciona una calificación"}
                    </span>
                </div>

                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Comentario</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        placeholder="Cuéntanos cómo fue tu experiencia..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm text-gray-700 placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 resize-none"
                    />
                </div>
            </div>
        </Modal>
    );
};