// client-user/src/features/notifications/components/NotificationsHome.jsx  (ARCHIVO NUEVO)
import { useEffect } from "react";
import { BellIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useAuthStore } from "../../auth/store/authStore";
import { useNotificationsStore } from "../../../shared/store/userStore.js";
import { NotificationItem } from "./NotificationItem";
import { Card, CardContent } from "../../../shared/components/layout/DashboardContainer";
import { Button } from "../../../shared/components/ui/Button";

export const NotificationsHome = () => {
    const { user } = useAuthStore();
    const currentUserId = user?._id || user?.id;

    const { notifications, readIds, loading, getNotifications, markAsRead, markAllAsRead } =
        useNotificationsStore();

    useEffect(() => {
        if (currentUserId) getNotifications(currentUserId);
    }, [currentUserId]);

    const unreadCount = notifications.filter((n) => !readIds.includes(n._id)).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">Notificaciones</h1>
                    <p className="text-gray-600 mt-1">
                        {unreadCount > 0 ? `Tienes ${unreadCount} notificación(es) sin leer` : "Estás al día"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                        <CheckCircleIcon className="size-4" />
                        Marcar todas como leídas
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading && (
                        <div className="flex justify-center py-10">
                            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && notifications.length === 0 && (
                        <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                            <BellIcon className="size-10" />
                            No tienes notificaciones
                        </div>
                    )}

                    {!loading &&
                        notifications.map((n) => (
                            <NotificationItem
                                key={n._id}
                                notification={n}
                                read={readIds.includes(n._id)}
                                onRead={markAsRead}
                            />
                        ))}
                </CardContent>
            </Card>
        </div>
    );
};