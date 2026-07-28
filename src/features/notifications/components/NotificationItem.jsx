import { useNavigate } from "react-router-dom";

const TYPE_STYLES = {
    NEW_MESSAGE: { color: "bg-blue-500", label: "Mensaje" },
    NEW_REVIEW: { color: "bg-yellow-500", label: "Reseña" },
    ACCOUNT_REPORTED: { color: "bg-red-500", label: "Reporte" },
    NEW_REPORT: { color: "bg-red-500", label: "Reporte" },
    NEW_PROPOSAL: { color: "bg-purple-500", label: "Propuesta" },
    PROPOSAL_ACCEPTED: { color: "bg-green-500", label: "Propuesta aceptada" },
    PROPOSAL_REJECTED: { color: "bg-red-400", label: "Propuesta rechazada" },
    SERVICE_COMPLETED: { color: "bg-green-600", label: "Servicio completado" },
    SERVICE_CANCELLED: { color: "bg-gray-500", label: "Servicio cancelado" },
    NEW_VERIFICATION: { color: "bg-indigo-500", label: "Verificación" },
};

const formatRelativeTime = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Hace un momento";
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} día(s)`;
};

export const NotificationItem = ({ notification, onRead }) => {
    const navigate = useNavigate();
    const style = TYPE_STYLES[notification.Type] || { color: "bg-gray-400", label: notification.Type };
    const isUnread = !notification.isRead;

    const handleClick = () => {
        onRead(notification._id);
        if (notification.Type === "NEW_MESSAGE" && notification.relatedId) {
            navigate("/dashboard/messages", {
                state: { conversationId: notification.relatedId },
            });
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`w-full text-left px-4 py-4 border-b border-gray-100 transition flex items-start gap-3 ${
                isUnread ? "bg-yellow-50 hover:bg-yellow-100" : "bg-white hover:bg-gray-50"
            }`}
        >
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${style.color}`} />
            <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wide">
                    {style.label}
                </span>
                <p className={`text-sm mt-0.5 ${isUnread ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                    {notification.Message}
                </p>
                <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
            </div>
            {isUnread && <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mt-1 shrink-0" />}
        </button>
    );
};
