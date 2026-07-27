import { useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

export const MessageInput = ({ conversationId, senderId, onSendMessage }) => {
    const [content, setContent] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!content.trim() || !conversationId || !senderId || sending) return;
        try {
            setSending(true);
            await onSendMessage(conversationId, senderId, content.trim());
            setContent("");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-3 md:p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm text-gray-700 placeholder:text-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                />
                <button
                    onClick={handleSend}
                    disabled={!content.trim() || sending}
                    className="w-10 h-10 shrink-0 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-gray-900 flex items-center justify-center transition"
                >
                    <PaperAirplaneIcon className="size-4" />
                </button>
            </div>
        </div>
    );
};