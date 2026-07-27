import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore.js";
import { AuthPage } from "../../features/auth/pages/AuthPage.jsx";
import { VerifyEmailPage } from "../../features/auth/pages/VerifyEmailPage.jsx";
import { DashboardContainer } from "../../shared/components/layout/DashboardContainer.jsx";
import { MyRequestsPage } from "../../features/Dashboard/MyRequestsPage.jsx";
import { ServiceRequestDetailPage } from "../../features/Dashboard/ServiceRequestDetailPage.jsx";
import { WorkerOffersPage } from "../../features/Proposals/Worker/WorkerOffersPage.jsx";
import { WorkerServicesPage } from "../../features/Services/Worker/WorkerServicesPage.jsx";
import { DashboardHome } from "../../features/dashboard/components/DashboardHome.jsx";
import { FindWorkers } from "../../features/workers/components/FindWorkers.jsx";
import { WorkerPublicProfile } from "../../features/workers/components/WorkerPublicProfile.jsx";
import { VerificationView } from "../../features/verification/components/VerificationView.jsx";
import { MyProfile } from "../../features/profile/components/MyProfile.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuthStore();
  if (isLoadingAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <p className="text-gray-400">Cargando...</p>
    </div>
  );
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
        <Route path="my-requests" element={<MyRequestsPage />} />
        <Route path="my-requests/:id" element={<ServiceRequestDetailPage />} />
        <Route path="my-offers" element={<WorkerOffersPage />} />
        <Route path="my-services" element={<WorkerServicesPage />} />

        <Route path="find-workers" element={<FindWorkers />} />
        <Route path="worker/:id" element={<WorkerPublicProfile />} />
        <Route path="verification" element={<VerificationView />} />
        <Route path="profile" element={<MyProfile />} />
      </Route>

      <Route path="*" element={<h1>Página no encontrada</h1>} />
    </Routes>
  );
};
