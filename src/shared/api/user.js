import { axiosUser } from "./api";

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

export const getReviewsByReviewer = async (reviewerId) => {
  return axiosUser.get(`/reviews/client/${reviewerId}`);
};

export const createReview = async (payload) => {
  return axiosUser.post("/reviews", payload);
};
