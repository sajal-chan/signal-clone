"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { UserPrivate } from "@/types";

type Step = "details" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({ username: "", display_name: "", phone_number: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", {
        username: form.username,
        display_name: form.display_name,
        phone_number: form.phone_number || undefined,
      });
      setStep("otp");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<{ access_token: string }>("/auth/verify-otp", {
        username: form.username,
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
        <h1 className="text-2xl font-semibold text-signal-text-primary">Create Account</h1>
      </div>

      {step === "details" ? (
        <form onSubmit={handleRegister} className="space-y-3">
          {(["username", "display_name", "phone_number"] as const).map((field) => (
            <input
              key={field}
              className="w-full bg-signal-input border border-signal-divider rounded-lg px-4 py-3 text-signal-text-primary placeholder-signal-text-secondary focus:outline-none focus:border-signal-accent"
              placeholder={
                field === "display_name"
                  ? "Display Name"
                  : field === "phone_number"
                  ? "Phone (optional)"
                  : "Username"
              }
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              required={field !== "phone_number"}
            />
          ))}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-signal-accent hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? "Registering…" : "Register"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-signal-text-secondary text-sm text-center">
            <span className="text-signal-accent">(dev: use 123456)</span>
          </p>
          <input
            className="w-full bg-signal-input border border-signal-divider rounded-lg px-4 py-3 text-signal-text-primary text-center text-2xl tracking-widest focus:outline-none focus:border-signal-accent"
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
        </form>
      )}

      <p className="text-center text-signal-text-secondary text-sm">
        Have an account?{" "}
        <a href="/login" className="text-signal-accent hover:underline">
          Log in
        </a>
      </p>
    </div>
  );
}
