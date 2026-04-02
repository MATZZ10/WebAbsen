"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, MapPin, Save } from "lucide-react";

type SchoolSettings = {
  id: string;
  name: string;
  geolocation_latitude: number;
  geolocation_longitude: number;
  geolocation_radius_meters: number;
  attendance_enabled: boolean;
  attendance_start_time: string | null;
  attendance_end_time: string | null;
  allow_late_checkin: boolean;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Gagal memuat settings");
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat pengaturan sekolah");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        credentials: "include"
      });

      if (!res.ok) throw new Error("Gagal menyimpan settings");
      
      toast.success("Pengaturan sekolah berhasil diperbarui!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">⚙️ Pengaturan Sekolah</h1>

        <div className="space-y-8">
          {/* Geolocation Settings */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="text-blue-400" size={24} />
              <h2 className="text-2xl font-semibold">Lokasi Sekolah</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nama Sekolah
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) =>
                    setSettings({ ...settings, name: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Radius Lokasi (meter)
                </label>
                <input
                  type="number"
                  value={settings.geolocation_radius_meters}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      geolocation_radius_meters: parseInt(e.target.value)
                    })
                  }
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.geolocation_latitude}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      geolocation_latitude: parseFloat(e.target.value)
                    })
                  }
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.geolocation_longitude}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      geolocation_longitude: parseFloat(e.target.value)
                    })
                  }
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
              📍 Pastikan koordinat lokasi sudah benar. Siswa hanya bisa absen jika berada dalam radius yang ditentukan.
            </div>
          </div>

          {/* Attendance Time Gate */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="text-cyan-400" size={24} />
              <h2 className="text-2xl font-semibold">Sistem Absensi</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/50">
                <input
                  type="checkbox"
                  checked={settings.attendance_enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      attendance_enabled: e.target.checked
                    })
                  }
                  className="w-5 h-5 rounded cursor-pointer accent-cyan-500"
                />
                <label className="font-medium cursor-pointer flex-1">
                  Aktifkan Sistem Absensi
                </label>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  settings.attendance_enabled
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                }`}>
                  {settings.attendance_enabled ? "AKTIF" : "NONAKTIF"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Jam Mulai Absensi
                  </label>
                  <input
                    type="time"
                    value={settings.attendance_start_time || "07:00"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        attendance_start_time: e.target.value
                      })
                    }
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Siswa bisa mulai absen dari jam ini
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Jam Akhir Absensi
                  </label>
                  <input
                    type="time"
                    value={settings.attendance_end_time || "14:00"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        attendance_end_time: e.target.value
                      })
                    }
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Sistem absensi ditutup setelah jam ini
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/50">
                <input
                  type="checkbox"
                  checked={settings.allow_late_checkin}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      allow_late_checkin: e.target.checked
                    })
                  }
                  className="w-5 h-5 rounded cursor-pointer accent-cyan-500"
                />
                <label className="font-medium cursor-pointer flex-1">
                  Izinkan Absensi Terlambat
                </label>
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 text-sm text-cyan-200">
                ⏰ Atur waktu buka dan tutup sistem absensi. Pastikan siswa tidak datang terlalu pagi hanya untuk absen.
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 font-semibold transition"
            >
              <Save size={20} />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
            <button
              onClick={fetchSettings}
              className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 font-semibold transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
