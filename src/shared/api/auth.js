import { axiosAuth, axiosUser } from "./api";


const tryPostPaths = async (paths, data, config = {}) => {
    let lastError;
    for (const path of paths) {
        try {
            return await axiosAuth.post(path, data, config);
        } catch (error) {
            lastError = error;
            if (error.response?.status !== 404) {
                throw error;
            }
        }
    }
    throw lastError;
};

const AUTH_BASE_PATH = "/api/v1/Auth";

const postAuth = async (endpoint, data, config = {}) => {
    const paths = [
        `${AUTH_BASE_PATH}/${endpoint}`,
        `/api/v1/auth/${endpoint}`,
        `/api/Auth/${endpoint}`,
        `/Auth/${endpoint}`,
    ];
    return await tryPostPaths(paths, data, config);
};

export const login = async (data) => {
    return await axiosUser.post("/users/login", data);
};

export const register = async (data) => {
    return await axiosUser.post("/users/register", data);
};

export const forgotPassword = async (email) => {
    return await postAuth("forgot-password", { email });
};

export const resetPassword = async (token, newPassword) => {
    return await postAuth("reset-password", { token, newPassword });
};

export const verifyEmail = async (token) => {
    return await postAuth("verify-email", { token });
};

export const resendVerification = async (email) => {
    return await postAuth("resend-verification", { email });
};

export const registerUserProfile = async (data) => {
    const fd = new FormData();
    fd.append("firstName", data.firstName);
    fd.append("lastName", data.lastName);
    fd.append("email", data.email);
    fd.append("phone", data.phone);
    fd.append("role", data.role);
    fd.append("password", data.password);

    return await axiosUser.post("/users/register", fd);   // sin headers
};