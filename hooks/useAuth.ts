import { useAuthStore } from "@store/authStore";

export function useAuth() {
  const store = useAuthStore();
  return {
    isAuthenticated: !!store.session,
    isLoading: store.isLoading,
    user: store.user,
    profile: store.profile,
    session: store.session,
    logout: store.logout,
  };
}
