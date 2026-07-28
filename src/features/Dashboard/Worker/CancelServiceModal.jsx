import { useState } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { Modal } from "../../../shared/components/ui/Modal";

export const CancelServiceModal = ({
  open,
  onClose,
  onConfirm,
  loading,
}) => {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose?.();
  };

  const handleConfirm = () => {
    if (reason.trim().length < 5) return;
    onConfirm(reason.trim());
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Cancelar servicio"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Volver
          </Button>
          <Button
            variant="destructive"
            disabled={reason.trim().length < 5 || loading}
            onClick={handleConfirm}
          >
            {loading ? "Cancelando..." : "Cancelar servicio"}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-gray-600 mb-3">
        Contale al cliente por qué vas a cancelar este servicio.
      </p>
      <textarea
        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        rows={4}
        maxLength={300}
        placeholder="Ej: Tuve una emergencia y no puedo asistir..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <p className="text-xs text-gray-400 text-right mt-1">{reason.length}/300</p>
    </Modal>
  );
};
