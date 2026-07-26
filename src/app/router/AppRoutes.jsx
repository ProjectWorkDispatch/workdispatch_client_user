import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore.js";
import { AuthPage } from "../../features/auth/pages/AuthPage.jsx";
import { VerifyEmailPage } from "../../features/auth/pages/VerifyEmailPage.jsx";
import { DashboardContainer } from "../../shared/components/layout/DashboardContainer.jsx";
import { DashboardHome } from "../../features/Dashboard/DashboardHome.jsx";
import { WorkerOffersPage } from "../../features/Proposals/Worker/WorkerOffersPage.jsx";
import { WorkerServicesPage } from "../../features/Services/Worker/WorkerServicesPage.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuthStore();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardContainer />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="my-offers" element={<WorkerOffersPage />} />
        <Route path="my-services" element={<WorkerServicesPage />} />

      </Route>

      <Route path="*" element={<h1>Página no encontrada</h1>} />
    </Routes>
  );
};
