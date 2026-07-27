export * from './auth';
export { axiosAuth, axiosUser, handleRefreshToken } from './api';

// ===== USERS / WORKERS =====
export const getWorkers = async (params) =>
  (await import('./api')).axiosUser.get('/users', { params });

export const getWorkerById = async (id) =>
  (await import('./api')).axiosUser.get(`/users/${id}`);

export const updateProfile = async (id, formData) =>
  (await import('./api')).axiosUser.put(`/users/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ===== CATEGORIES =====
export const getCategories = async () =>
  (await import('./api')).axiosUser.get('/categories');

// ===== VERIFICATIONS =====
export const createVerification = async (formData) =>
  (await import('./api')).axiosUser.post('/verifications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getVerificationById = async (id) =>
  (await import('./api')).axiosUser.get(`/verifications/${id}`);

// ===== PORTFOLIO =====
export const getMyPortfolio = async (workerId) =>
  (await import('./api')).axiosUser.get(`/PortFolio/my/${workerId}`);

export const getPortfolioByWorker = async (id) =>
  (await import('./api')).axiosUser.get(`/PortFolio/${id}`);

export const addPortfolioRecord = async (formData) =>
  (await import('./api')).axiosUser.post('/PortFolio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updatePortfolioRecord = async (id, data) =>
  (await import('./api')).axiosUser.put(`/PortFolio/${id}`, data);

export const changePortfolioStatus = async (id) =>
  (await import('./api')).axiosUser.patch(`/PortFolio/status/${id}`);

// ===== REVIEWS =====
export const getWorkerReviews = async (workerId) =>
  (await import('./api')).axiosUser.get(`/reviews/worker/${workerId}`);

// ===== SKILLS =====
export const getWorkerSkills = async (userId) =>
  (await import('./api')).axiosUser.get(`/userSkill/worker/${userId}`);

export const getMySkills = async (id) =>
  (await import('./api')).axiosUser.get(`/userSkill/${id}`);

export const addUserSkill = async (data) =>
  (await import('./api')).axiosUser.post('/userSkill', data);

export const getSkills = async () =>
  (await import('./api')).axiosUser.get('/skill');
// export * from './user';
// export { axiosAuth, axiosUser, handleRefreshToken } from './api';
