export const MessageBubble = ({ message, currentUserId }) => {
    const isMine = (message.senderId?._id || message.senderId) === currentUserId;

    const time = message.createdAt
        ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "";

    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-md px-4 py-3 rounded-2xl text-sm shadow-sm ${
                    isMine
                        ? "bg-yellow-500 text-gray-900 rounded-br-md"
                        : "bg-white text-gray-700 rounded-bl-md border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                }`}
            >
                <p className="leading-relaxed">{message.content}</p>
                <span className={`block mt-2 text-[11px] ${isMine ? "text-gray-800/70" : "text-gray-400 dark:text-gray-500"}`}>
                    {time}
                </span>
            </div>
        </div>
    );
};