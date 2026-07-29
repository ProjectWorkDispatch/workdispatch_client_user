import { useState, useEffect, useMemo } from "react";
import { MagnifyingGlassIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { Modal } from "../../../shared/components/ui/Modal";
import { Button } from "../../../shared/components/ui/Button";
import { getWorkers } from "../../../shared/api";

export const NewChatModal = ({ open, onClose, currentUser, conversations, onStartChat, startingId }) => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const currentUserId = currentUser?._id || currentUser?.id;
    const currentRole = (currentUser?.role || "").toUpperCase();
    const targetRole = currentRole === "WORKER" ? "CLIENT" : "WORKER";

    useEffect(() => {
        if (!open) return;

        const fetchCandidates = async () => {
            setLoading(true);
            try {
                const res = await getWorkers();
                const allUsers = res.data?.data || res.data || [];

                // IDs de usuarios con los que YA existe una conversación
                const existingIds = new Set(
                    conversations
                        .map((c) => {
                            const other = c.user1Id?._id === currentUserId ? c.user2Id : c.user1Id;
                            return other?._id;
                        })
                        .filter(Boolean)
                );

                const filtered = allUsers.filter(
                    (u) =>
                        u._id !== currentUserId &&
                        (u.role || "").toUpperCase() === targetRole &&
                        !existingIds.has(u._id)
                );

                setCandidates(filtered);
            } catch {
                setCandidates([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, [open, conversations, currentUserId, targetRole]);

    const filteredCandidates = useMemo(() => {
        const text = search.toLowerCase().trim();
        if (!text) return candidates;
        return candidates.filter((u) =>
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(text)
        );
    }, [candidates, search]);

    return (
        <Modal open={open} onClose={onClose} title="Nuevo chat" size="md">
            <div className="space-y-4">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={targetRole === "WORKER" ? "Buscar trabajador..." : "Buscar cliente..."}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 dark:border-gray-700"
                    />
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                    {loading && (
                        <div className="flex justify-center py-6">
                            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && filteredCandidates.length === 0 && (
                        <div className="py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2 dark:text-gray-500">
                            <UserCircleIcon className="size-8" />
                            {candidates.length === 0
                                ? "Ya tienes chats con todos los disponibles"
                                : "No se encontraron resultados"}
                        </div>
                    )}

                    {!loading &&
                        filteredCandidates.map((u) => {
                            const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase();
                            return (
                                <div key={u._id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-10 rounded-full bg-yellow-500 text-gray-900 font-black flex items-center justify-center shrink-0 dark:text-gray-100">
                                            {initials || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900 truncate dark:text-gray-100">
                                                {u.firstName} {u.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate dark:text-gray-400">{u.email}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => onStartChat(u)} disabled={startingId === u._id}>
                                        {startingId === u._id ? "..." : "Chatear"}
                                    </Button>
                                </div>
                            );
                        })}
                </div>
            </div>
        </Modal>
    );
};