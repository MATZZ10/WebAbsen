"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const STORAGE_KEY = "user-device-id";

function ensureDeviceId() {
  let deviceId = window.localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const deviceId = ensureDeviceId();
    document.cookie = `device_id=${deviceId}; path=/; samesite=lax`;

    await signIn("google", { callbackUrl: "/admin/recap" });
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
        <p className="mt-2 text-sm text-slate-300">Masuk untuk mengakses dashboard absensi. Akses akan terkunci di perangkat pertama dan hanya bisa di-reset oleh admin.</p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-white px-4 py-3 font-medium text-slate-950 hover:bg-slate-200 disabled:opacity-50"
        >
          {loading ? "Memproses…" : "Masuk dengan Google"}
        </button>
      </div>
    </div>
  );
}
