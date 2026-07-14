import { axiosAuth } from "./api";

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
    return await postAuth("login", data);
};

export const register = async (data) => {
    return await postAuth("register", data);
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
