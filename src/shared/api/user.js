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

export const markNotificationAsRead = async (id) =>
    await axiosUser.patch(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = async (userId) =>
    await axiosUser.patch(`/notifications/${userId}/read-all`);

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

export const getOpenServiceRequests = async (categoryId) => {
  const params = categoryId ? { categoryId } : undefined;
  return axiosUser.get("/serviceRequest/open", { params });
};

export const getCategories = async () => {
  return axiosUser.get("/categories");
};

export const getWorkerSkills = async (workerId) => {
  return axiosUser.get(`/userSkill/worker/${workerId}`);
};

export const getWorkerProposals = async (workerId) => {
  return axiosUser.get(`/Proposal/worker/${workerId}`);
};

export const createProposal = async (payload) => {
  return axiosUser.post("/Proposal", payload);
};

export const getWorkerServices = async (workerId) => {
  return axiosUser.get(`/Service/worker/${workerId}`);
};

export const getClientServices = async (clientId) => {
  return axiosUser.get(`/Service/client/${clientId}`);
};

export const getWorkerTrustStats = async (workerId) => {
  return axiosUser.get(`/users/${workerId}/trust-stats`);
};

export const completeService = async (serviceId) => {
  return axiosUser.patch(`/Service/complete/${serviceId}`);
};

export const cancelService = async (serviceId, cancelReason, role) => {
  return axiosUser.patch(`/Service/cancel/${serviceId}`, { cancelReason, role });
};

export const scheduleService = async (serviceId, scheduledDate, estimatedDurationDays, workPlan) => {
  return axiosUser.patch(`/Service/schedule/${serviceId}`, { scheduledDate, estimatedDurationDays, workPlan });
};

export const toggleWorkPlanDay = async (serviceId, dayNumber) => {
  return axiosUser.patch(`/Service/work-plan/${serviceId}/${dayNumber}`);
};

export const getReviewsByReviewer = async (reviewerId) => {
  return axiosUser.get(`/reviews/client/${reviewerId}`);
};


export const getMyServiceRequests = async (status) => {
  const params = status ? { status } : undefined;
  return axiosUser.get("/serviceRequest/mine", { params });
};

export const getServiceRequestById = async (id) => {
  return axiosUser.get(`/serviceRequest/${id}`);
};

export const createServiceRequest = async (formData) => {
  return axiosUser.post("/serviceRequest", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getProposalsForRequest = async (serviceRequestId) => {
  return axiosUser.get(`/Proposal/requests/${serviceRequestId}`);
};

export const acceptProposal = async (proposalId) => {
  return axiosUser.patch(`/Proposal/accept/${proposalId}`);
};

export const rejectProposal = async (proposalId, reason) => {
  return axiosUser.patch(`/Proposal/reject/${proposalId}`, { reason });
};

export const getAiEstimate = async (payload) => {
  return axiosUser.post("/ai/estimate", payload);
};

// ================= FAVORITES =================
export const addFavorite = async (clientId, workerId) =>
  axiosUser.post('/Favorite', { clientId, workerId });

export const removeFavorite = async (clientId, workerId) =>
  axiosUser.delete(`/Favorite/${clientId}/${workerId}`);

export const getMyFavorites = async (clientId) =>
  axiosUser.get(`/Favorite/client/${clientId}`);