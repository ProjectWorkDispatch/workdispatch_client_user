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

// --- Interceptores de request: marcar cliente y adjuntar Bearer token ---
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
  const isRefreshEndpoint =
    requestUrl.includes("/users/refresh") ||
    requestUrl.includes("/Auth/refresh") ||
    requestUrl.includes("/auth/refresh");

  const shouldAttemptRefresh =
    !isRefreshEndpoint &&
    (status === 401 ||
      (status === 403 && errorCode === "TOKEN_EXPIRED"));

  if (!shouldAttemptRefresh) {
    return Promise.reject(error);
  }

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
    window.location.href = '/';
    _isRefreshing = false;
    return Promise.reject(error);
  }

  // Snapshot the refreshToken before the async call
  const refreshTokenAtStart = refreshToken;

    try {
      let response;
      try {
        response = await axiosUser.post("/users/refresh", { refreshToken });
      } catch (refreshError) {
        if (refreshError.response?.status === 404) {
          response = await axiosAuth.post("/Auth/refresh", { refreshToken });
        } else {
          throw refreshError;
        }
      }

    // Guard: if the user logged out while the refresh was in-flight, discard the result
    const currentRefreshToken = useAuthStore.getState().refreshToken;
    if (currentRefreshToken !== refreshTokenAtStart) {
      _processQueue(error, null);
      return Promise.reject(error);
    }

    const { accessToken, refreshToken: newRefreshToken, expiresIn, userDetails } = response.data;
    const expiresAt = typeof expiresIn === 'number'
      ? (expiresIn < 1e12 ? Date.now() + expiresIn * 1000 : expiresIn)
      : null;
    useAuthStore.setState({
      token: accessToken,
      refreshToken: newRefreshToken,
      expiresAt,
      user: userDetails || useAuthStore.getState().user,
      isAuthenticated: true,
    });

    _processQueue(null, accessToken);
    _original.headers["Authorization"] = "Bearer " + accessToken;
    return retryClient(_original);
  } catch (err) {
    _processQueue(err, null);
    useAuthStore.getState().logout();
    window.location.href = '/';
    return Promise.reject(err);
  } finally {
    _isRefreshing = false;
  }
};

// Response interceptor: handle expired tokens on axiosUser (immediate logout)
axiosUser.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.error;
    if (status === 401 && (code === 'TOKEN_EXPIRED' || code === 'MISSING_TOKEN' || code === 'INVALID_TOKEN')) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// --- Un único interceptor de respuesta para ambos clientes (refresh token) ---
axiosAuth.interceptors.response.use((res) => res, handleRefreshToken);
axiosUser.interceptors.response.use((res) => res, handleRefreshToken);

export { axiosAuth, axiosUser };
export { handleRefreshToken };