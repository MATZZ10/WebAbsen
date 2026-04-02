"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

const STORAGE_KEY = "user-device-id";

function getOrCreateDeviceId() {
  let deviceId = window.localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

export default function DeviceLockGate() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const deviceId = getOrCreateDeviceId();
        document.cookie = `device_id=${deviceId}; path=/; samesite=lax`;

        const res = await fetch("/api/auth/device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
          credentials: "include",
        });

        if (res.status === 403) {
          const body = await res.json().catch(() => null);
          toast.error(body?.message ?? "Akun terkunci di perangkat lain.");
          await signOut({ callbackUrl: "/login" });
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          toast.error(`Verifikasi perangkat gagal: ${text}`);
          await signOut({ callbackUrl: "/login" });
          return;
        }

        toast.success("Perangkat terverifikasi.");
      } catch (error) {
        console.error(error);
        toast.error("Tidak dapat verifikasi perangkat. Silakan coba lagi.");
        await signOut({ callbackUrl: "/login" });
      } finally {
        setChecked(true);
      }
    }

    check();
  }, []);

  if (!checked) return null;
  return null;
}
