// client-user/src/features/reports/components/ReportsHome.jsx  (ARCHIVO NUEVO — historial de reportes creados)
import { useEffect } from "react";
import { FlagIcon } from "@heroicons/react/24/outline";
import { useAuthStore } from "../../auth/store/authStore";
import { useReportsStore } from "../../../shared/store/userStore";
import { Card, CardContent } from "../../../shared/components/layout/DashboardContainer";

export const ReportsHome = () => {
    const { user } = useAuthStore();
    const currentUserId = user?._id || user?.id;
    const { createdReports, loading, getMyReports } = useReportsStore();

    useEffect(() => {
        if (currentUserId) getMyReports(currentUserId);
    }, [currentUserId]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900">Mis Reportes</h1>
                <p className="text-gray-600 mt-1">Reportes que has enviado y su estado</p>
            </div>

            {loading && (
                <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!loading && createdReports.length === 0 && (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                    <FlagIcon className="size-10" />
                    No has enviado reportes
                </div>
            )}

            <div className="space-y-3">
                {createdReports.map((report) => {
                    const person = report.reporteredId;
                    const fullName = `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "Usuario";
                    return (
                        <Card key={report._id}>
                            <CardContent className="p-5 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-semibold">{report.Reason}</p>
                                    <h3 className="font-bold text-gray-900">Reportado: {fullName}</h3>
                                    <p className="text-sm text-gray-600 mt-2">{report.Description}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                                        report.Status
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-green-100 text-green-700"
                                    }`}
                                >
                                    {report.Status ? "Pendiente" : "Resuelto"}
                                </span>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};