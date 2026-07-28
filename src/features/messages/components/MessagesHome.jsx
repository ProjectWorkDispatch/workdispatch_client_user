import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useAuthStore } from "../../auth/store/authStore";
import { useMessagesStore } from "../../../shared/store/userStore.js";
import { ConversationItem } from "./ConversationItem";
import { ChatWindow } from "./ChatWindow.jsx";
import { NewChatModal } from "./NewChatModal.jsx";
import { ReportModal } from "../../reports/components/ReportModal";

export const MessagesHome = () => {
    const { user } = useAuthStore();
    const currentUserId = user?._id || user?.id;
    const location = useLocation();
    const navigate = useNavigate();

    const {
        conversations,
        selectedConversation,
        messages,
        loading,
        getConversations,
        selectConversation,
        startConversation,
        sendMessage,
    } = useMessagesStore();

    const [search, setSearch] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [startingId, setStartingId] = useState(null);

    useEffect(() => {
        if (currentUserId) getConversations(currentUserId);
    }, [currentUserId]);

    // Si llegamos aquí desde "Mensaje" en un perfil, desde una solicitud,
    // o desde una notificación, abrimos directamente la conversación indicada.
    useEffect(() => {
        const target = location.state?.conversation;
        const targetId = location.state?.conversationId;
        if (target) {
            selectConversation(target);
            setShowChat(true);
            navigate(location.pathname, { replace: true, state: {} });
        } else if (targetId && conversations.length > 0) {
            const found = conversations.find((c) => c._id === targetId);
            if (found) {
                selectConversation(found);
                setShowChat(true);
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, conversations]);

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

    const handleStartChat = async (otherUser) => {
        setStartingId(otherUser._id);
        try {
            await startConversation(currentUserId, otherUser._id);
            setShowNewChatModal(false);
            setShowChat(true);
        } catch {
            toast.error("No se pudo iniciar la conversación");
        } finally {
            setStartingId(null);
        }
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
                        <div className="p-4 border-b border-gray-100 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar conversación..."
                                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 outline-none text-sm text-gray-600 placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                                />
                                <button
                                    onClick={() => setShowNewChatModal(true)}
                                    title="Nuevo chat"
                                    className="shrink-0 size-9 flex items-center justify-center rounded-xl bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition"
                                >
                                    <PlusIcon className="size-5" />
                                </button>
                            </div>
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

            <NewChatModal
                open={showNewChatModal}
                onClose={() => setShowNewChatModal(false)}
                currentUser={user}
                conversations={conversations}
                onStartChat={handleStartChat}
                startingId={startingId}
            />

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