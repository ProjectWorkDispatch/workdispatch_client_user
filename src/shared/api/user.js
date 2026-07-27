import { axiosUser } from './api.js';

// ================= CONVERSATIONS =================
export const getUserConversations = async (userId) =>
    await axiosUser.get(`/conversations/user/${userId}`);

export const createConversation = async (user1Id, user2Id) =>
    await axiosUser.post('/conversations', { user1Id, user2Id });

// ================= MESSAGES =================
export const getMessagesByConversation = async (conversationId) =>
    await axiosUser.get(`/messages/conversation/${conversationId}`);

export const sendMessage = async ({ conversationId, senderId, content }) =>
    await axiosUser.post('/messages', { conversationId, senderId, content });

// ================= NOTIFICATIONS =================
export const getUserNotifications = async (userId) =>
    await axiosUser.get(`/notifications/${userId}`);

// ================= REVIEWS =================
export const createReview = async (data) =>
    await axiosUser.post('/reviews', data);

export const getGivenReviews = async (userId) =>
    await axiosUser.get(`/reviews/client/${userId}`);

export const getReceivedReviews = async (userId) =>
    await axiosUser.get(`/reviews/worker/${userId}`);

export const editReview = async (id, data) =>
    await axiosUser.put(`/reviews/${id}`, data);

// ================= REPORTS=================
export const createReport = async (data) =>
    await axiosUser.post('/reports', data);

export const getCreatedReports = async (userId) =>
    await axiosUser.get(`/reports/created/${userId}`);

export const getReceivedReports = async (userId) =>
    await axiosUser.get(`/reports/received/${userId}`);
