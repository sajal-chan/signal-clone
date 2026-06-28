import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPrivate } from "@/types";

interface AuthState {
  user: UserPrivate | null;
  token: string | null;
  setAuth: (user: UserPrivate, token: string) => void;
  logout: () => void;
}

function setTokenCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    // dev-only: token in JS-readable cookie for proxy auth check
    document.cookie = `signal_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = "signal_token=; path=/; max-age=0";
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        setTokenCookie(token);
        set({ user, token });
      },
      logout: () => {
        setTokenCookie(null);
        set({ user: null, token: null });
      },
    }),
    { name: "signal_auth" }
  )
);
