import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPrivate } from "@/types";

interface AuthState {
  user: UserPrivate | null;
  token: string | null;
  setAuth: (user: UserPrivate, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "signal_auth" }
  )
);
