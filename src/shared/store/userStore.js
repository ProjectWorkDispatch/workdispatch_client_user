import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '../api/user.js';

// ================= MESSAGES STORE =================
export const useMessagesStore = create((set, get) => ({
    conversations: [],
    selectedConversation: null,
    messages: [],
    loading: false,
    error: null,

    getConversations: async (userId) => {
        try {
            set({ loading: true, error: null });
            const res = await api.getUserConversations(userId);
            set({ conversations: res.data?.data || [], loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Error al obtener conversaciones', loading: false });
        }
    },

    startConversation: async (user1Id, user2Id) => {
        try {
            set({ loading: true, error: null });
            const res = await api.createConversation(user1Id, user2Id);
            const conversation = res.data?.data;
            if (!conversation) { set({ loading: false }); return null; }

            const exists = get().conversations.some((c) => c._id === conversation._id);
            set({
                conversations: exists ? get().conversations : [conversation, ...get().conversations],
                loading: false,
            });

            await get().selectConversation(conversation);
            return conversation;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Error al iniciar conversación', loading: false });
            throw error;
        }
    },

    selectConversation: async (conversation) => {
        set({ selectedConversation: conversation, messages: [] });
        try {
            const res = await api.getMessagesByConversation(conversation._id);
            set({ messages: res.data?.data || [] });
        } catch {
            set({ messages: [] });
        }
    },

    sendMessage: async (conversationId, senderId, content) => {
        try {
            const res = await api.sendMessage({ conversationId, senderId, content });
            const newMsg = res.data?.newMessage; // backend-user devuelve "newMessage", no "message"
            if (newMsg) set({ messages: [...get().messages, newMsg] });

            set({
                conversations: get().conversations.map((c) =>
                    c._id === conversationId
                        ? { ...c, lastMessage: content, lastMessageAt: new Date() }
                        : c
                ),
            });
        } catch (error) {
            console.error('Error enviando mensaje:', error.response?.data || error.message);
            throw error;
        }
    },

    setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
    clearError: () => set({ error: null }),
}));

// ================= NOTIFICATIONS STORE =================
export const useNotificationsStore = create(
    persist(
        (set, get) => ({
            notifications: [],
            readIds: [],
            loading: false,
            error: null,

            getNotifications: async (userId) => {
                try {
                    set({ loading: true, error: null });
                    const res = await api.getUserNotifications(userId);
                    set({ notifications: res.data?.notifications || [], loading: false });
                } catch (error) {
                    set({ error: error.response?.data?.message || 'Error al obtener notificaciones', loading: false });
                }
            },

            markAsRead: (id) => {
                if (get().readIds.includes(id)) return;
                set({ readIds: [...get().readIds, id] });
            },

            markAllAsRead: () => {
                const allIds = get().notifications.map((n) => n._id);
                set({ readIds: Array.from(new Set([...get().readIds, ...allIds])) });
            },

            clearError: () => set({ error: null }),
        }),
        { name: 'notifications-read-store' }
    )
);

// ================= REVIEWS STORE =================
export const useReviewsStore = create((set, get) => ({
    given: [],
    received: [],
    loading: false,
    error: null,

    getGivenReviews: async (userId) => {
        try {
            set({ loading: true, error: null });
            const res = await api.getGivenReviews(userId);
            set({ given: res.data?.reviews || [], loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Error al obtener tus reseñas', loading: false });
        }
    },

    getReceivedReviews: async (userId) => {
        try {
            set({ loading: true, error: null });
            const res = await api.getReceivedReviews(userId);
            set({ received: res.data?.reviews || [], loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Error al obtener tus reseñas recibidas', loading: false });
        }
    },

    createReview: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await api.createReview(data);
            set({ given: [res.data.review, ...get().given], loading: false });
            return { success: true, data: res.data.review };
        } catch (error) {
            const message = error.response?.data?.message || 'Error al crear la reseña';
            set({ error: message, loading: false });
            return { success: false, error: message };
        }
    },

    clearError: () => set({ error: null }),
}));

// ================= REPORTS STORE =================
export const useReportsStore = create((set, get) => ({
    createdReports: [],
    loading: false,
    error: null,

    getMyReports: async (userId) => {
        try {
            set({ loading: true, error: null });
            const res = await api.getCreatedReports(userId);
            set({ createdReports: res.data?.reports || [], loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Error al obtener tus reportes', loading: false });
        }
    },

    createReport: async (data) => {
        try {
            set({ loading: true, error: null });
            const res = await api.createReport(data);
            set({ createdReports: [res.data.report, ...get().createdReports], loading: false });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Error al enviar el reporte';
            set({ error: message, loading: false });
            return { success: false, error: message };
        }
    },

    clearError: () => set({ error: null }),
}));