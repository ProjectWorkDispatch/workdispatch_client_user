import axios from 'axios';

import { useAuthStore } from '../../features/auth/store/authStore.js';

const DEFAULT_API_URL = "http://localhost:3002/workDispatch/v1";
const authBaseURL = import.meta.env.VITE_AUTH_URL || "http://localhost:5149";
const userBaseURL = import.meta.env.VITE_USER_URL || DEFAULT_API_URL;

if (!import.meta.env.VITE_AUTH_URL || !import.meta.env.VITE_USER_URL) {
  console.warn(
    "Vite env variables VITE_AUTH_URL or VITE_USER_URL are not defined. Using fallback:",
    { authBaseURL, userBaseURL }
  );
}

const axiosAuth = axios.create({
  baseURL: authBaseURL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  }
});

const axiosUser = axios.create({
  baseURL: userBaseURL,
  timeout: 80000,
  headers: {
    "Content-Type": "application/json",
  }
});

// --- Interceptor de respuesta para manejar tokens expirados en axiosUser ---
axiosUser.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.error;

    if (status === 401 && (code === 'TOKEN_EXPIRED' || code === 'MISSING_TOKEN' || code === 'INVALID_TOKEN')) {
      useAuthStore.getState().logout();
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

// --- Interceptores de request: adjuntar Bearer token ---
axiosAuth.interceptors.request.use((config) => {
  config._axiosClient = "auth";
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosUser.interceptors.request.use((config) => {
  config._axiosClient = "user";
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh token logic ---
let _isRefreshing = false;
let failedQueue = [];

function _processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
}

const handleRefreshToken = async function (error) {
  const _original = error.config;
  if (!_original || _original._retry) {
    return Promise.reject(error);
  }

  const status = error.response?.status;
  const errorCode = error.response?.data?.error;
  const requestUrl = _original.url || "";
  const isRefreshEndpoint = requestUrl.includes("/Auth/refresh") || requestUrl.includes("/auth/refresh");
  const shouldAttemptRefresh = !isRefreshEndpoint && status === 401;
  const shouldAttemptRefreshFrom403 = !isRefreshEndpoint && status === 403 && errorCode === "TOKEN_EXPIRED";

  if (shouldAttemptRefresh || shouldAttemptRefreshFrom403) {
    const retryClient = _original._axiosClient === "user" ? axiosUser : axiosAuth;

    if (_isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          _original.headers["Authorization"] = "Bearer " + token;
          return retryClient(_original);
        })
        .catch((err) => Promise.reject(err));
    }

    _original._retry = true;
    _isRefreshing = true;

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    try {
      let response;
      try {
        response = await axiosAuth.post("/Auth/refresh", { refreshToken });
      } catch (refreshError) {
        if (refreshError.response?.status === 404) {
          response = await axiosAuth.post("/auth/refresh", { refreshToken });
        } else {
          throw refreshError;
        }
      }

      const { accessToken, refreshToken: newRefreshToken, expiresIn, userDetails } = response.data;
      useAuthStore.setState({
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt: expiresIn,
        user: userDetails || useAuthStore.getState().user,
        isAuthenticated: true,
      });

      _processQueue(null, accessToken);
      _original.headers["Authorization"] = "Bearer " + accessToken;
      return retryClient(_original);
    } catch (err) {
      _processQueue(err, null);
      useAuthStore.getState().logout();
      return Promise.reject(err);
    } finally {
      _isRefreshing = false;
    }
  }

  return Promise.reject(error);
};

axiosAuth.interceptors.response.use((res) => res, handleRefreshToken);
axiosUser.interceptors.response.use((res) => res, handleRefreshToken);

export { axiosAuth, axiosUser };
export { handleRefreshToken };
