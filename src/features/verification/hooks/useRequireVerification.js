import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../auth/store/authStore";

export const useRequireVerification = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isVerified = user?.verificationStatus === true;

  const requireVerification = useCallback(
    (actionLabel = "realizar esta acción") => {
      if (isVerified) return true;

      toast.error(
        `Debes verificar tu identidad para ${actionLabel}. Dirígete a la sección de Verificación.`,
        { duration: 5000 }
      );
      navigate("/dashboard/verification");
      return false;
    },
    [isVerified, navigate]
  );

  return { isVerified, requireVerification };
};
