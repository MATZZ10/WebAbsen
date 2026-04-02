"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { generateDeviceFingerprint } from "@/lib/utils";
import { toast } from "sonner";

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
  const [verifyingDevice, setVerifyingDevice] = useState(false);
  const [manualLatitude, setManualLatitude] = useState("");
  const [manualLongitude, setManualLongitude] = useState("");
  
  const { 
    loading: geoLoading, 
    coords, 
    error: geoError, 
    getLocation,
    setManualLocation,
    geolocationMode
  } = useGeolocation();

  useEffect(() => {
    // Auto-get location if in automatic mode
    if (geolocationMode === "automatic" && !geoError) {
      getLocation();
    }
  }, []);

  async function verifyDevice(latitude?: number, longitude?: number) {
    setVerifyingDevice(true);
    try {
      const deviceId = ensureDeviceId();
      const deviceFingerprint = generateDeviceFingerprint(deviceId);
      document.cookie = `device_id=${deviceId}; path=/; samesite=lax`;

      const res = await fetch("/api/auth/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          deviceFingerprint,
          latitude: latitude || null,
          longitude: longitude || null
        }),
        credentials: "include"
      });

      if (res.status === 403) {
        const body = await res.json().catch(() => ({ error: "Perangkat terkunci" }));
        toast.error(body.error || "Akun terkunci di perangkat lain. Hubungi guru untuk reset.");
        setVerifyingDevice(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Verifikasi perangkat gagal" }));
        toast.error(body.error || "Verifikasi perangkat gagal");
        setVerifyingDevice(false);
        return;
      }

      toast.success("Perangkat terverifikasi. Melanjutkan...");
      setVerifyingDevice(false);
      
      // Redirect based on role (will be determined by callback)
      window.location.href = "/admin/recap";
      
    } catch (error) {
      console.error(error);
      toast.error("Gagal verifikasi perangkat");
      setVerifyingDevice(false);
    }
  }

  async function handleLogin() {
    setLoading(true);

    // Validate geolocation based on mode
    if (geolocationMode === "automatic") {
      if (!coords) {
        toast.error("Lokasi otomatis diperlukan untuk login. Mohon izinkan akses lokasi.");
        setLoading(false);
        return;
      }
      await verifyDevice(coords.latitude, coords.longitude);
    } else if (geolocationMode === "manual") {
      if (!manualLatitude || !manualLongitude) {
        toast.error("Mohon masukkan koordinat lokasi secara manual");
        setLoading(false);
        return;
      }

      const lat = parseFloat(manualLatitude);
      const lon = parseFloat(manualLongitude);

      if (isNaN(lat) || isNaN(lon)) {
        toast.error("Koordinat lokasi tidak valid");
        setLoading(false);
        return;
      }

      await verifyDevice(lat, lon);
    } else {
      await verifyDevice();
    }

    setLoading(false);
  }

  async function handleLoginWithGoogle() {
    setLoading(true);
    const deviceId = ensureDeviceId();
    document.cookie = `device_id=${deviceId}; path=/; samesite=lax`;

    await signIn("google", { callbackUrl: "/dashboard" });
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Login Siswa</h1>
        <p className="mt-2 text-sm text-slate-300">
          Sistem login yang ketat. 1 akun = 1 perangkat. Perangkat yang sama harus digunakan setiap kali login.
        </p>

        {/* Geolocation Section */}
        {geolocationMode === "automatic" && (
          <div className="mt-6 rounded-xl bg-blue-500/10 p-4 border border-blue-500/30">
            <p className="text-sm font-medium text-blue-300 mb-3">📍 Verifikasi Lokasi Otomatis</p>
            
            {!coords && !geoError && (
              <button
                onClick={getLocation}
                disabled={geoLoading}
                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {geoLoading ? "Mengambil lokasi..." : "Ambil Lokasi Saya"}
              </button>
            )}

            {coords && (
              <div className="space-y-1 text-xs text-slate-300">
                <p>✓ Latitude: {coords.latitude.toFixed(6)}</p>
                <p>✓ Longitude: {coords.longitude.toFixed(6)}</p>
              </div>
            )}

            {geoError && (
              <p className="text-xs text-red-400">{geoError}</p>
            )}
          </div>
        )}

        {geolocationMode === "manual" && (
          <div className="mt-6 rounded-xl bg-amber-500/10 p-4 border border-amber-500/30 space-y-3">
            <p className="text-sm font-medium text-amber-300">📍 Lokasi Manual</p>
            
            <div>
              <label className="text-xs text-slate-400">Latitude</label>
              <input
                type="number"
                placeholder="-6.1234"
                step="0.000001"
                value={manualLatitude}
                onChange={(e) => setManualLatitude(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Longitude</label>
              <input
                type="number"
                placeholder="106.7890"
                step="0.000001"
                value={manualLongitude}
                onChange={(e) => setManualLongitude(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 border border-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading || verifyingDevice || geoLoading || (geolocationMode === "automatic" && !coords)}
          className="mt-6 w-full rounded-2xl bg-white px-4 py-3 font-medium text-slate-950 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifyingDevice ? "Verifikasi Perangkat..." : loading ? "Memproses…" : "Masuk Sekarang"}
        </button>

        {/* Info Section */}
        <div className="mt-6 space-y-2 rounded-lg bg-slate-800/50 p-4 text-xs text-slate-400">
          <p>• Sistem ini menggunakan device locking yang ketat</p>
          <p>• Anda hanya bisa login dari satu perangkat</p>
          <p>• Jika perlu mengubah perangkat, hubungi guru untuk reset</p>
          <p>• Lokasi akan dicatat setiap login</p>
        </div>
      </div>
    </div>
  );
}
