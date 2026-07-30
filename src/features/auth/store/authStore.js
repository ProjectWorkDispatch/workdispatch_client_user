import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

import { login as loginRequest, register as registerRequest, getWorkerById } from "../../../shared/api";
const ALLOWED_ROLES = ["CLIENT", "WORKER"];

function toAbsoluteExpiresAt(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value < 1e12 ? Date.now() + value * 1000 : value;
}

function normalizeUser(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const role = (raw.role || raw.roleName || '').toString().toUpperCase();
  if (!ALLOWED_ROLES.includes(role)) return null;
  return { ...raw, role };
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      loading: false,
      error: null,
      isLoadingAuth: true,
      isAuthenticated: false,

      checkAuth: () => {
        const token = get().token;
        const rawUser = get().user;
        const expiresAt = get().expiresAt;
        const user = normalizeUser(rawUser);

        // Check token expiration
        if (token && expiresAt && expiresAt < Date.now()) {
          set({ loading: false, error: null, isLoadingAuth: false });
          get().logout();
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoadingAuth: false,
            error: 'La sesión ha expirado. Inicia sesión nuevamente.',
          });
          return;
        }

        // Re-normalize persisted user on rehydration
        if (rawUser && !user) {
          set({ loading: false, error: null, isLoadingAuth: false });
          get().logout();
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoadingAuth: false,
            error: "No tienes permiso para acceder a esta sección",
          });
          return;
        }

        if (rawUser && user && JSON.stringify(rawUser) !== JSON.stringify(user)) {
          set({ user });
        }

        set({ loading: false, error: null, isLoadingAuth: false });

        if (token && !user) {
          get().logout();
          set({
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoadingAuth: false,
            error: "No tienes permiso para acceder a esta sección",
          });
        }
      },

      refreshUser: async () => {
        try {
          const currentUser = get().user;
          if (!currentUser?._id && !currentUser?.id) return;
          const { data } = await getWorkerById(currentUser._id || currentUser.id);
          const updatedUser = data?.data || data;
          if (updatedUser) {
            set({ user: updatedUser });
          }
        } catch (error) {
          console.error('Error refreshing user:', error);
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },

      login: async ({ email, password }) => {
        try {
          set({ loading: true, error: null });

          const { data } = await loginRequest({ email, password });
          const rawUser = data?.user || data?.userDetails || data;
          const user = normalizeUser(rawUser);
          const accessToken = data?.accessToken || data?.token;
          const refreshToken = data?.refreshToken || data?.refresh_token;
          const expiresAt = toAbsoluteExpiresAt(data?.expiresIn || data?.expiresAt || data?.expiration);

          if (!user) {
            const message = "No tienes permisos para acceder a esta sección";
            set({
              user: null,
              token: null,
              refreshToken: null,
              expiresAt: null,
              isAuthenticated: false,
              loading: false,
              error: message,
            });
            toast.error(message);
            return { success: false, error: message };
          }

          set({
            user,
            token: accessToken,
            refreshToken,
            expiresAt,
            isAuthenticated: !!accessToken,
            loading: false,
          });

          return { success: true };

        } catch (error) {
          let errorMessage = "Credenciales inválidas o error de conexión";

          if (error.response?.status === 401) {
            errorMessage = "Credenciales inválidas";
          }

          set({ error: errorMessage, loading: false });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },

      register: async (formData) => {
        try {
          set({ loading: true, error: null });

          const { data } = await registerRequest(formData);

          set({ loading: false });

          if (data?.emailVerificationRequired) {
            toast.success(data?.message || "Cuenta creada. Revisa tu correo para verificar tu cuenta.");
          } else {
            toast.success(data?.message || "Cuenta creada exitosamente.");
          }

          return { success: true, data };

        } catch (error) {
          let errorMessage = "Error al crear la cuenta";

          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status === 409) {
            errorMessage = "Este correo ya está registrado";
          }

          set({ error: errorMessage, loading: false });
          toast.error(errorMessage);
          return { success: false, error: errorMessage };
        }
      },
    }),

    {
      name: "auth-store-user",
      onRehydrateStorage: () => (state) => {
        state?.checkAuth();
      },
    }
  )
);

export const useIsClient = () => useAuthStore((s) => s.user?.role === 'CLIENT');
