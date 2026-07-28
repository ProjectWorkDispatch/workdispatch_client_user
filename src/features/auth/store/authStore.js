import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

import { login as loginRequest, register as registerRequest, registerUserProfile, getWorkerById } from "../../../shared/api";
const ALLOWED_ROLES = ["CLIENT", "WORKER"];

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
                const user = get().user;
                const role = (user?.role || "").toString().toUpperCase();

                set({ loading: false, error: null, isLoadingAuth: false });

                if (token && !ALLOWED_ROLES.includes(role)) {
                    get().logout();
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        expiresAt: null,
                        isAuthenticated: false,
                        isLoadingAuth: false,
                        error: "No tienes permiso para acceder a esta sección"
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
                    const user = data?.user || data?.userDetails || data;
                    const role = (user?.role || user?.roleName || "").toString().toUpperCase();
                    const accessToken = data?.accessToken || data?.token;
                    const refreshToken = data?.refreshToken || data?.refresh_token;
                    const expiresAt = data?.expiresIn || data?.expiresAt || data?.expiration;

                    if (!ALLOWED_ROLES.includes(role)) {
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

                    // NUEVO: crea el perfil también en workdispatch_user
                    try {
                        await registerUserProfile(formData);
                    } catch (profileError) {
                        console.error("Error creando perfil en user-service:", profileError);
                    }

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