import { useEffect, useMemo, useState } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useAuthStore } from "../../auth/store/authStore";
import { useMessagesStore } from "../../../shared/store/userStore.js";
import { ConversationItem } from "./ConversationItem";
import { ChatWindow } from "./ChatWindow.jsx";
//import { ReportModal } from "../../reports/components/ReportModal";

export const MessagesHome = () => {
    const { user } = useAuthStore();
    const currentUserId = user?._id || user?.id;

    const {
        conversations,
        selectedConversation,
        messages,
        loading,
        getConversations,
        selectConversation,
        sendMessage,
    } = useMessagesStore();

    const [search, setSearch] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);

    useEffect(() => {
        if (currentUserId) getConversations(currentUserId);
    }, [currentUserId]);

    const filtered = useMemo(() => {
        const text = search.toLowerCase().trim();
        if (!text) return conversations;
        return conversations.filter((c) => {
            const other = c.user1Id?._id === currentUserId ? c.user2Id : c.user1Id;
            return (
                `${other?.firstName} ${other?.lastName}`.toLowerCase().includes(text) ||
                c.lastMessage?.toLowerCase().includes(text)
            );
        });
    }, [search, conversations, currentUserId]);

    const handleSelect = (conversation) => {
        selectConversation(conversation);
        setShowChat(true);
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900">Mensajes</h1>
                <p className="text-gray-600 mt-1">Tus conversaciones sobre solicitudes y servicios</p>
            </div>

            <div className="h-[calc(100vh-230px)] flex gap-4">
                <div className={`${showChat ? "hidden" : "flex"} md:flex w-full md:max-w-xs flex-col`}>
                    <aside className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b border-gray-100">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar conversación..."
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm text-gray-600 placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loading && (
                                <div className="flex justify-center py-6">
                                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {!loading && filtered.length === 0 && (
                                <div className="px-5 py-10 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                                    <ChatBubbleLeftRightIcon className="size-8" />
                                    No tienes conversaciones aún
                                </div>
                            )}
                            {filtered.map((conversation) => (
                                <ConversationItem
                                    key={conversation._id}
                                    conversation={conversation}
                                    currentUserId={currentUserId}
                                    active={selectedConversation?._id === conversation._id}
                                    onClick={() => handleSelect(conversation)}
                                />
                            ))}
                        </div>
                    </aside>
                </div>

                <div className={`${showChat ? "flex" : "hidden"} md:flex flex-1 flex-col`}>
                    <ChatWindow
                        conversation={selectedConversation}
                        messages={messages}
                        currentUserId={currentUserId}
                        onSendMessage={sendMessage}
                        onBack={() => setShowChat(false)}
                        onReport={(otherUser) => setReportTarget(otherUser)}
                    />
                </div>
            </div>

            <ReportModal
                open={!!reportTarget}
                onClose={() => setReportTarget(null)}
                reporteredId={reportTarget?._id}
                reporteredName={`${reportTarget?.firstName || ""} ${reportTarget?.lastName || ""}`.trim()}
                onSuccess={() => setReportTarget(null)}
            />
        </div>
    );
};