import { useAuthStore } from "../../auth/store/authStore";
import { ClientDashboardSummary } from "./ClientDashboardSummary";
import { WorkerDashboardSummary } from "./WorkerDashboardSummary";

export const DashboardHome = () => {
  const { user } = useAuthStore();

  if (user?.role === "WORKER") {
    return <WorkerDashboardSummary user={user} />;
  }

  return <ClientDashboardSummary />;
};
