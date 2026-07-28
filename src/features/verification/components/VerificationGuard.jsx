import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/components/ui/Button";
import { Card, CardContent } from "../../../shared/components/layout/DashboardContainer";
import { useAuthStore } from "../../auth/store/authStore";

export const VerificationGuard = ({ children, actionLabel = "realizar esta acción" }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isVerified = user?.verificationStatus === true;

  if (isVerified) return children;

  return (
    <Card className="border-2 border-yellow-200 bg-yellow-50">
      <CardContent className="p-6 text-center">
        <ShieldCheckIcon className="size-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Verificación requerida
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Debes verificar tu identidad para {actionLabel}.
          Sube tu documento y espera la aprobación de nuestro equipo.
        </p>
        <Button onClick={() => navigate("/dashboard/verification")}>
          <ShieldCheckIcon className="size-4" />
          Ir a Verificación
        </Button>
      </CardContent>
    </Card>
  );
};
