"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import Avatar from "@/components/ui/Avatar";
import type { UserPrivate } from "@/types";

export default function SettingsPage() {
  const { user, setAuth, token } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [statusMessage, setStatusMessage] = useState(user?.status_message ?? "");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !user) return;
    setSaving(true);
    try {
      const { data } = await api.patch<UserPrivate>("/users/me", {
        display_name: displayName || undefined,
        status_message: statusMessage || undefined,
      });
      setAuth(data, token);
      addToast("Profile updated", "success");
    } catch {
      // error toast shown by interceptor
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto py-10 px-6 space-y-8">
      <h1 className="text-2xl font-semibold text-signal-text-primary">Settings</h1>

      {/* Profile section */}
      <section className="space-y-6">
        <h2 className="text-sm font-medium text-signal-text-secondary uppercase tracking-wide">Profile</h2>
        <div className="flex items-center gap-4">
          <Avatar name={user.display_name} size="lg" />
          <div>
            <p className="font-semibold text-signal-text-primary">{user.display_name}</p>
            <p className="text-sm text-signal-text-secondary">@{user.username}</p>
          </div>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm text-signal-text-secondary mb-1">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-signal-input border border-signal-divider rounded-lg px-4 py-2.5 text-signal-text-primary focus:outline-none focus:border-signal-accent"
            />
          </div>
          <div>
            <label className="block text-sm text-signal-text-secondary mb-1">About</label>
            <input
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="What's your status?"
              className="w-full bg-signal-input border border-signal-divider rounded-lg px-4 py-2.5 text-signal-text-primary placeholder-signal-text-secondary focus:outline-none focus:border-signal-accent"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-signal-accent hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Coming soon sections */}
      {[
        { label: "Privacy", desc: "Screen lock, read receipts, typing indicators" },
        { label: "Notifications", desc: "Message alerts, sounds, vibration" },
        { label: "Appearance", desc: "Theme, font size, chat wallpaper" },
        { label: "Linked Devices", desc: "Use Signal on other devices" },
        { label: "Stories", desc: "Share updates with your contacts" },
      ].map((section) => (
        <section key={section.label} className="border border-signal-divider rounded-xl p-4 opacity-50 cursor-not-allowed">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-signal-text-primary">{section.label}</p>
              <p className="text-sm text-signal-text-secondary mt-0.5">{section.desc}</p>
            </div>
            <span className="text-xs bg-signal-divider text-signal-text-secondary px-2 py-1 rounded-full">
              Coming soon
            </span>
          </div>
        </section>
      ))}

      {/* Encryption note */}
      <div className="flex items-center gap-3 p-4 bg-signal-sidebar rounded-xl border border-signal-divider">
        <span className="text-2xl">🔒</span>
        <p className="text-sm text-signal-text-secondary">
          Messages are <span className="text-signal-text-primary">mock-encrypted</span>. This is a demo — no real end-to-end encryption.
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={() => { useAuthStore.getState().logout(); window.location.href = "/login"; }}
        className="w-full py-3 rounded-xl border border-red-600 text-red-400 hover:bg-red-600/10 font-medium transition-colors"
      >
        Log Out
      </button>
    </div>
  );
}
