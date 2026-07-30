import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";
import { axiosUser } from "../../shared/api/api";

export const VerificationGate = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [asyncStatus, setAsyncStatus] = useState("loading");

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!userId) return;
    if (user?.verificationStatus === true) return;
    axiosUser
      .get(`/verifications/${userId}`)
      .then((res) => {
        const v = res.data?.data || res.data;
        if (v?.status === "APPROVED") {
          setAsyncStatus("approved");
        } else if (v?.status === "PENDING") {
          setAsyncStatus("pending");
        } else {
          setAsyncStatus("rejected");
        }
      })
      .catch(() => setAsyncStatus("rejected"));
  }, [userId, user?.verificationStatus]);

  let effectiveStatus;
  if (!userId) {
    effectiveStatus = "skip";
  } else if (user?.verificationStatus === true) {
    effectiveStatus = "approved";
  } else {
    effectiveStatus = asyncStatus;
  }

  if (effectiveStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (effectiveStatus === "approved") return children;
  if (location.pathname === "/dashboard/verification") return children;
  return <Navigate to="/dashboard/verification" replace />;
};
