export const ConversationItem = ({ conversation, active, currentUserId, onClick }) => {
    const other =
        conversation.user1Id?._id === currentUserId ? conversation.user2Id : conversation.user1Id;
    const fullName = `${other?.firstName || ""} ${other?.lastName || ""}`.trim() || "Usuario";

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 border-b border-gray-100 transition ${
                active ? "bg-yellow-50" : "hover:bg-gray-50"
            }`}
        >
            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-900 text-yellow-400 flex items-center justify-center font-semibold text-sm shrink-0">
                    {fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{fullName}</h3>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                            {conversation.lastMessageAt
                                ? new Date(conversation.lastMessageAt).toLocaleDateString()
                                : ""}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                        {conversation.lastMessage || "Sin mensajes"}
                    </p>
                </div>
            </div>
        </button>
    );
};