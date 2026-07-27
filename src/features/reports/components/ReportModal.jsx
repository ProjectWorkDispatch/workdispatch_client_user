// client-user/src/features/reports/components/ReportModal.jsx  (ARCHIVO NUEVO)
import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../../shared/components/ui/Modal";
import { Button } from "../../../shared/components/ui/Button";
import { useAuthStore } from "../../auth/store/authStore";
import { useReportsStore } from "../../../shared/store/userStore";
const REASONS = [
    "Incumplimiento del servicio",
    "Comportamiento inapropiado",
    "Cobro indebido",
    "Suplantación de identidad",
    "Otro",
];

export const ReportModal = ({ open, onClose, reporteredId, reporteredName, onSuccess }) => {
    const { user } = useAuthStore();
    const currentUserId = user?._id || user?.id;
    const { createReport, loading } = useReportsStore();

    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");

    const reset = () => {
        setReason("");
        setDescription("");
    };

    const handleClose = () => {
        reset();
        onClose?.();
    };

    const handleSubmit = async () => {
        if (!reason) {
            toast.error("Selecciona un motivo");
            return;
        }
        if (!description.trim()) {
            toast.error("Describe el problema");
            return;
        }

        const result = await createReport({
            reporterId: currentUserId,
            reporteredId,
            Reason: reason,
            Description: description.trim(),
        });

        if (result.success) {
            toast.success("Reporte enviado. El equipo lo revisará pronto.");
            reset();
            onSuccess?.();
        } else {
            toast.error(result.error);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Reportar un problema"
            footer={
                <>
                    <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleSubmit} loading={loading}>
                        Enviar reporte
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Estás reportando a</p>
                    <p className="font-bold text-gray-900">{reporteredName || "Usuario"}</p>
                </div>

                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Motivo</label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm text-gray-700 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                    >
                        <option value="">Selecciona un motivo</option>
                        {REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Descripción</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Describe con detalle lo sucedido..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm text-gray-700 placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 resize-none"
                    />
                </div>
            </div>
        </Modal>
    );
};