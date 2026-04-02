"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { generateDeviceFingerprint } from "@/lib/utils";
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
  const { coords, getLocation, geolocationMode } = useGeolocation();

  useEffect(() => {
    async function check() {
      try {
        const deviceId = getOrCreateDeviceId();
        const deviceFingerprint = generateDeviceFingerprint(deviceId);
        document.cookie = `device_id=${deviceId}; path=/; samesite=lax`;

        let latitude: number | undefined;
        let longitude: number | undefined;

        // Get geolocation if in automatic mode
        if (geolocationMode === "automatic") {
          if (!coords) {
            // Try to get location
            getLocation();
            // Wait a moment for location to be fetched
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
          
          // Get location data
          if (coords) {
            latitude = coords.latitude;
            longitude = coords.longitude;
          } else {
            // If still no location after attempt, deny access
            toast.error("Lokasi otomatis diperlukan. Mohon refresh halaman dan izinkan akses lokasi.");
            await signOut({ callbackUrl: "/login" });
            return;
          }
        }

        const res = await fetch("/api/auth/device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            deviceId, 
            deviceFingerprint,
            latitude: latitude || null,
            longitude: longitude || null
          }),
          credentials: "include",
        });

        if (res.status === 403) {
          const body = await res.json().catch(() => null);
          toast.error(
            body?.error ?? 
            "Akun terkunci di perangkat lain. Hubungi guru untuk mereset perangkat ini."
          );
          await signOut({ callbackUrl: "/login" });
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const errorMsg = body?.error ?? "Verifikasi perangkat gagal";
          toast.error(`${errorMsg}. Silakan login ulang.`);
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
  }, [coords, getLocation, geolocationMode]);

  if (!checked) return null;
  return null;
}
