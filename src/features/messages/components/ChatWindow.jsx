import { useEffect, useRef } from "react";
import { ArrowLeftIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { MessageInput } from "./MessageInput.jsx";
import { MessageBubble } from "./Messagebubble.jsx";

export const ChatWindow = ({
    conversation,
    messages,
    currentUserId,
    onSendMessage,
    onBack,
    onReport
}) => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!conversation) {
        return (
            <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center rounded-2xl border border-gray-200">
                <p className="text-gray-400">Selecciona una conversación para empezar a chatear</p>
            </div>
        );
    }

    const otherUser = conversation.user1Id?._id === currentUserId
        ? conversation.user2Id
        : conversation.user1Id;

    return (
        <div className="flex-1 flex flex-col bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden h-full">

            {/* Header del Chat */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-semibold text-gray-900 capitalize">
                            {otherUser?.firstName} {otherUser?.lastName}
                        </h2>
                        <p className="text-xs text-gray-500">
                            Cliente
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => onReport(otherUser)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                    title="Reportar usuario"
                >
                    <ExclamationTriangleIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Lista de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages && messages.length > 0 ? (
                    messages.map((msg) => (
                        <MessageBubble // <-- B mayúscula aquí
                            key={msg._id || msg.id}
                            message={msg}
                            currentUserId={currentUserId} // <-- Pásale el ID como lo espera tu componente
                        />
                    ))
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        No hay mensajes aún. ¡Escribe el primero!
                    </div>
                )}
                {/* Referencia invisible para el auto-scroll */}
                <div ref={messagesEndRef} />
            </div>

            {/* Input para enviar mensajes (Tu componente) */}
            <MessageInput
                conversationId={conversation._id}
                senderId={currentUserId}
                onSendMessage={onSendMessage}
            />
        </div>
    );
};