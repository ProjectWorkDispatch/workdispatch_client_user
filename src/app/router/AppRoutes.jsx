// client-user/src/app/router/AppRoutes.jsx  (ARCHIVO MODIFICADO)
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore.js";
import { AuthPage } from "../../features/auth/pages/AuthPage.jsx";
import { VerifyEmailPage } from "../../features/auth/pages/VerifyEmailPage.jsx";
import { DashboardContainer } from "../../shared/components/layout/DashboardContainer.jsx";
import { MyRequestsPage } from "../../features/Dashboard/MyRequestsPage.jsx";
import { ServiceRequestDetailPage } from "../../features/Dashboard/ServiceRequestDetailPage.jsx";
import { ClientServiceDetailPage } from "../../features/Dashboard/ClientServiceDetailPage.jsx";
import { WorkerMyJobsPage } from "../../features/Dashboard/Worker/WorkerMyJobsPage.jsx";
import { WorkerFindJobsPage } from "../../features/Dashboard/Worker/WorkerFindJobsPage.jsx";
import { WorkerOffersPage } from "../../features/Proposals/Worker/WorkerOffersPage.jsx";
import { WorkerProposalDetailPage } from "../../features/Proposals/Worker/WorkerProposalDetailPage.jsx";
import { WorkerServiceDetailPage } from "../../features/Services/Worker/WorkerServiceDetailPage.jsx";
import { WorkerServicesPage } from "../../features/Services/Worker/WorkerServicesPage.jsx";
import { DashboardHome } from "../../features/Dashboard/DashboardHome.jsx";
import { FindWorkers } from "../../features/workers/components/FindWorkers.jsx";
import { WorkerPublicProfile } from "../../features/workers/components/WorkerPublicProfile.jsx";
import { ClientPublicProfile } from "../../features/workers/components/ClientPublicProfile.jsx";
import { VerificationView } from "../../features/verification/components/VerificationView.jsx";
import { VerificationGate } from "./VerificationGate.jsx";
import { MyProfile } from "../../features/profile/components/MyProfile.jsx";
import { MessagesHome } from "../../features/messages/components/MessagesHome.jsx";
import { NotificationsHome } from "../../features/notifications/components/NotificationsHome.jsx";
import { ReviewsHome } from "../../features/reviews/components/ReviewsHome.jsx";
import { ReportsHome } from "../../features/reports/components/ReportsHome.jsx";

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
            <VerificationGate>
              <DashboardContainer />
            </VerificationGate>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="my-requests" element={<MyRequestsPage />} />
        <Route path="my-requests/:id" element={<ServiceRequestDetailPage />} />
        <Route path="my-services/:id" element={<ClientServiceDetailPage />} />
        <Route path="my-jobs" element={<WorkerMyJobsPage />} />
        <Route path="find-jobs" element={<WorkerFindJobsPage />} />

        <Route path="my-offers" element={<WorkerOffersPage />} />
        <Route path="my-offers/:id" element={<WorkerProposalDetailPage />} />
        <Route path="worker-service" element={<WorkerServicesPage />} />
        <Route path="worker-service/:id" element={<WorkerServiceDetailPage />} />

        <Route path="find-workers" element={<FindWorkers />} />
        <Route path="worker/:id" element={<WorkerPublicProfile />} />
        <Route path="client/:id" element={<ClientPublicProfile />} />
        <Route path="verification" element={<VerificationView />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="messages" element={<MessagesHome />} />
        <Route path="notifications" element={<NotificationsHome />} />
        <Route path="reviews" element={<ReviewsHome />} />
        <Route path="reports" element={<ReportsHome />} />
      </Route>

      <Route path="*" element={<h1>Página no encontrada</h1>} />
    </Routes>
  );
};
