import { create } from "zustand";
import { supabase, getUserProfile, type UserProfile } from "@services/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isOnboarded: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setOnboarded: (value: boolean) => void;
  loadProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isOnboarded: false,

  setSession: (session) => {
    set({ session, user: session?.user ?? null, isLoading: false });
  },

  setProfile: (profile) => set({ profile }),

  setOnboarded: (value) => set({ isOnboarded: value }),

  loadProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profile = await getUserProfile(user.id);
      set({ profile });
    } catch {
      // Profile might not exist yet — ignore
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
