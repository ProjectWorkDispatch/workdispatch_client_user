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

// ================= SERVICE REQUESTS =================
export const getOpenServiceRequests = async (categoryId) => {
  const params = categoryId ? { categoryId } : undefined;
  return axiosUser.get("/serviceRequest/open", { params });
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

export const createProposal = async (payload) => {
  return axiosUser.post("/Proposal", payload);
};

export const acceptProposal = async (proposalId) => {
  return axiosUser.patch(`/Proposal/accept/${proposalId}`);
};

export const rejectProposal = async (proposalId, reason) => {
  return axiosUser.patch(`/Proposal/reject/${proposalId}`, { reason });
};

export const getProposalById = async (proposalId) => {
  return axiosUser.get(`/Proposal/${proposalId}`);
};

export const getWorkerProposals = async (workerId) => {
  return axiosUser.get(`/Proposal/worker/${workerId}`);
};

export const getAiEstimate = async (payload) => {
  return axiosUser.post("/ai/estimate", payload);
};

// ================= CATEGORIES =================
export const getCategories = async () => {
  return axiosUser.get("/categories");
};

// ================= USERS / WORKERS =================
export const getWorkers = async (params) =>
  axiosUser.get('/users', { params });

export const getWorkerById = async (id) =>
  axiosUser.get(`/users/${id}`);

export const updateProfile = async (id, formData) =>
  axiosUser.put(`/users/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getWorkerTrustStats = async (workerId) => {
  return axiosUser.get(`/users/${workerId}/trust-stats`);
};

export const getClientTrustStats = async (clientId) => {
  return axiosUser.get(`/users/${clientId}/client-trust-stats`);
};

// ================= VERIFICATIONS =================
export const createVerification = async (formData) =>
  axiosUser.post('/verifications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getVerificationById = async (id) =>
  axiosUser.get(`/verifications/${id}`);

// ================= PORTFOLIO =================
export const getMyPortfolio = async (workerId) =>
  axiosUser.get(`/PortFolio/my/${workerId}`);

export const getPortfolioByWorker = async (id) =>
  axiosUser.get(`/PortFolio/${id}`);

export const addPortfolioRecord = async (formData) =>
  axiosUser.post('/PortFolio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updatePortfolioRecord = async (id, data) =>
  axiosUser.put(`/PortFolio/${id}`, data);

export const changePortfolioStatus = async (id) =>
  axiosUser.patch(`/PortFolio/status/${id}`);

// ================= SKILLS =================
export const getWorkerSkills = async (workerId) => {
  return axiosUser.get(`/userSkill/worker/${workerId}`);
};

export const getMySkills = async (id) =>
  axiosUser.get(`/userSkill/${id}`);

export const addUserSkill = async (data) =>
  axiosUser.post('/userSkill', data);

export const getSkillsCatalog = async () =>
  axiosUser.get('/skill');

// ================= SERVICES =================
export const getWorkerServices = async (workerId) => {
  return axiosUser.get(`/Service/worker/${workerId}`);
};

export const getClientServices = async (clientId) => {
  return axiosUser.get(`/Service/client/${clientId}`);
};

export const getServiceById = async (serviceId) => {
  return axiosUser.get(`/Service/${serviceId}`);
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

export const setupPlan = async (serviceId, payload) =>
  axiosUser.patch(`/Service/setup-plan/${serviceId}`, payload);

export const addWorkLog = async (serviceId, payload) =>
  axiosUser.post(`/Service/work-log/${serviceId}`, payload);

export const editWorkLog = async (serviceId, dayNumber, payload) =>
  axiosUser.patch(`/Service/work-log/${serviceId}/${dayNumber}`, payload);

export const completeWorkDay = async (serviceId, dayNumber) =>
  axiosUser.patch(`/Service/complete-day/${serviceId}/${dayNumber}`);

export const verifyWorkDay = async (serviceId, dayNumber, { verified, clientNote }) => {
  return axiosUser.patch(`/Service/verify-day/${serviceId}/${dayNumber}`, { verified, clientNote });
};

// ================= MEETINGS =================
export const requestMeeting = async (proposalId, startTime) =>
  axiosUser.post('/meetings/request', { proposalId, startTime });

export const workerRequestMeeting = async (payload) =>
  axiosUser.post('/meetings/worker-request', payload);

export const confirmMeeting = async (meetingId) =>
  axiosUser.patch(`/meetings/confirm/${meetingId}`);

export const proposeAlternativeTime = async (meetingId, startTime) =>
  axiosUser.patch(`/meetings/propose-time/${meetingId}`, { startTime });

export const cancelMeeting = async (meetingId) =>
  axiosUser.patch(`/meetings/cancel/${meetingId}`);

export const getPendingMeetings = async (userId) =>
  axiosUser.get(`/meetings/pending/${userId}`);

export const getProposalMeeting = async (proposalId) =>
  axiosUser.get(`/meetings/proposal/${proposalId}`);

export const getServiceRequestMeeting = async (serviceRequestId) =>
  axiosUser.get(`/meetings/service-request/${serviceRequestId}`);

export const getMeetingsByUser = async (userId) =>
  axiosUser.get(`/meetings/user/${userId}`);

export const getMeetingById = async (meetingId) =>
  axiosUser.get(`/meetings/${meetingId}`);

// ================= REVIEWS (extra) =================
export const getReviewsByReviewer = async (reviewerId) => {
  return axiosUser.get(`/reviews/client/${reviewerId}`);
};

export const getWorkerReviews = async (workerId) =>
  axiosUser.get(`/reviews/worker/${workerId}`);

// ================= FAVORITES =================
export const addFavorite = async (clientId, workerId) =>
  axiosUser.post('/Favorite', { clientId, workerId });

export const removeFavorite = async (clientId, workerId) =>
  axiosUser.delete(`/Favorite/${clientId}/${workerId}`);

export const getMyFavorites = async (clientId) =>
  axiosUser.get(`/Favorite/client/${clientId}`);