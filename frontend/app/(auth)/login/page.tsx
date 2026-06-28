"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { UserPrivate } from "@/types";

type Step = "username" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/login", { username });
      setStep("otp");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "User not found";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<{ access_token: string }>("/auth/verify-otp", {
        username,
        otp,
      });
      const { data: user } = await api.get<UserPrivate>("/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      setAuth(user, data.access_token);
      router.push("/");
    } catch {
      setError("Invalid OTP. Use 123456.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🔒</div>
        <h1 className="text-2xl font-semibold text-signal-text-primary">Signal</h1>
        <p className="text-signal-text-secondary text-sm mt-1">
          {step === "username" ? "Enter your username" : "Enter the OTP"}
        </p>
      </div>

      {step === "username" ? (
        <form onSubmit={handleUsernameSubmit} className="space-y-4">
          <input
            className="w-full bg-signal-input border border-signal-divider rounded-lg px-4 py-3 text-signal-text-primary placeholder-signal-text-secondary focus:outline-none focus:border-signal-accent"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal-accent hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? "Sending…" : "Continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <p className="text-signal-text-secondary text-sm text-center">
            Code sent to <span className="text-signal-text-primary">{username}</span>
            <br />
            <span className="text-signal-accent">(dev: use 123456)</span>
          </p>
          <input
            className="w-full bg-signal-input border border-signal-divider rounded-lg px-4 py-3 text-signal-text-primary placeholder-signal-text-secondary text-center text-2xl tracking-widest focus:outline-none focus:border-signal-accent"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
            autoFocus
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal-accent hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
          <button
            type="button"
            onClick={() => setStep("username")}
            className="w-full text-signal-text-secondary text-sm hover:text-signal-text-primary transition-colors"
          >
            ← Back
          </button>
        </form>
      )}

      <p className="text-center text-signal-text-secondary text-sm">
        No account?{" "}
        <a href="/register" className="text-signal-accent hover:underline">
          Register
        </a>
      </p>
    </div>
  );
}
