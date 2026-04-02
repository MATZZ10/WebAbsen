"use client";
import { useEffect, useState } from "react";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useAttendance } from "@/hooks/use-attendance";
import { useFaceApi, captureFaceImage, detectFace } from "@/hooks/use-face-api";
import { getDistanceMeters } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

type AttendanceStatus = {
  open: boolean;
  reason: string;
  startTime?: string;
  endTime?: string;
  currentTime?: string;
  allowLateCheckin?: boolean;
  school?: any;
};

export default function AttendancePage() {
  const { videoRef, start, error: cameraError } = useCamera();
  const { loading: locationLoading, coords, error: locationError, getLocation } = useGeolocation();
  const { loading, submit, result } = useAttendance();
  const { ready: faceReady, loading: faceLoading, error: faceError } = useFaceApi();
  
  const [studentId, setStudentId] = useState("");
  const [faceStatus, setFaceStatus] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    start();
    getLocation();
    checkAttendanceStatus();
    
    // Check status every minute
    const interval = setInterval(checkAttendanceStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  async function checkAttendanceStatus() {
    try {
      const res = await fetch("/api/attendance/status");
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setAttendanceStatus(data);
    } catch (error) {
      console.error(error);
    } finally {
      setStatusLoading(false);
    }
  }

  const schoolSettings = attendanceStatus?.school;
  const canAttend = attendanceStatus?.open ?? false;

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Sistem Absensi Siswa</h1>
          <p className="text-slate-400 mt-2">Ikuti instruksi di bawah untuk melakukan absensi</p>
        </div>

        {/* Status Alert */}
        {statusLoading ? (
          <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/50 p-6 text-center">
            <p className="text-slate-400">Memuat status sistem...</p>
          </div>
        ) : attendanceStatus ? (
          <div className={`mb-6 rounded-2xl border p-6 ${
            canAttend
              ? "border-green-500/30 bg-green-500/10"
              : "border-red-500/30 bg-red-500/10"
          }`}>
            <div className="flex items-start gap-4">
              {canAttend ? (
                <CheckCircle2 className="text-green-400 flex-shrink-0 mt-1" size={24} />
              ) : (
                <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${canAttend ? "text-green-300" : "text-red-300"}`}>
                  {canAttend ? "✓ Sistem Absensi Terbuka" : "✗ Sistem Absensi Ditutup"}
                </h3>
                <p className={canAttend ? "text-green-200" : "text-red-200"}>
                  {attendanceStatus.reason}
                </p>
                {attendanceStatus.startTime && attendanceStatus.endTime && (
                  <p className="text-sm mt-2 opacity-80">
                    Jam absensi: {attendanceStatus.startTime} - {attendanceStatus.endTime}
                    {attendanceStatus.currentTime && ` (Sekarang: ${attendanceStatus.currentTime})`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Camera & Form */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Absensi Wajah</h2>
                  <p className="text-sm text-slate-400">Arahkan wajah ke kamera, lalu tekan tombol absen</p>
                </div>
                <Badge className="border-white/10 bg-white/10">📹 Live</Badge>
              </div>

              {/* Video Feed */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black mb-4">
                <video ref={videoRef} autoPlay playsInline className="h-[400px] w-full object-cover" />
              </div>

              {/* Location & Time Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={16} className="text-blue-400" />
                    <span className="text-xs font-semibold text-slate-300">LOKASI</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {locationLoading ? "Mencari..." : locationError ? "Error GPS" : coords ? "✓ Ada lokasi" : "Menunggu..."}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-300">JAM ABSENSI</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {canAttend ? "✓ Terbuka" : "✗ Ditutup"}
                  </p>
                </div>
              </div>

              {/* Input & Button */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Nomor Induk Siswa
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Masukkan NIS Anda"
                    className="w-full h-11 rounded-lg border border-slate-700 bg-slate-900/50 px-4 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <Button
                  onClick={async () => {
                    setFaceStatus(null);

                    if (!canAttend) {
                      setFaceStatus("Sistem absensi belum dibuka. Tunggu waktu absensi dimulai.");
                      return;
                    }

                    if (!studentId.trim()) {
                      setFaceStatus("Mohon masukkan nomor induk siswa");
                      return;
                    }

                    if (!coords) {
                      setFaceStatus("Tunggu data lokasi GPS atau izinkan akses lokasi.");
                      return;
                    }

                    if (schoolSettings && schoolSettings.geolocation_latitude && schoolSettings.geolocation_longitude) {
                      const distance = getDistanceMeters(
                        coords.latitude,
                        coords.longitude,
                        schoolSettings.geolocation_latitude,
                        schoolSettings.geolocation_longitude
                      );
                      
                      if (distance > schoolSettings.geolocation_radius_meters) {
                        setFaceStatus(
                          `Lokasi Anda di luar area sekolah. Jarak: ${(distance / 1000).toFixed(2)}km dari lokasi sekolah.`
                        );
                        return;
                      }
                    }

                    const video = videoRef.current;
                    if (!video) {
                      setFaceStatus("Kamera belum siap.");
                      return;
                    }

                    if (!faceReady) {
                      setFaceStatus(faceLoading ? "Memuat model face detection..." : "Face detection belum siap.");
                      return;
                    }

                    const detection = await detectFace(video);
                    if (!detection) {
                      setFaceStatus("Wajah tidak terdeteksi. Pastikan wajah terlihat jelas di kamera.");
                      return;
                    }

                    const faceImage = captureFaceImage(video);
                    setFaceStatus(`✓ Wajah terdeteksi. Mengirim data absensi...`);

                    await submit({
                      studentId,
                      status: "present",
                      confidence: detection.score,
                      faceImageUrl: faceImage,
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                    });
                  }}
                  disabled={loading || faceLoading || !canAttend}
                  className={`w-full h-12 rounded-lg font-semibold transition ${
                    !canAttend
                      ? "bg-slate-700 cursor-not-allowed text-slate-500"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  }`}
                >
                  {loading ? "Memproses..." : faceLoading ? "Memuat model..." : "Absen Sekarang"}
                </Button>
              </div>

              {/* Status Messages */}
              {faceStatus && (
                <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-300">{faceStatus}</p>
                </div>
              )}
              {faceError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-300">{faceError}</p>
                </div>
              )}
              {cameraError && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-300">{cameraError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Sidebar */}
          <div className="space-y-4">
            {/* School Info */}
            {schoolSettings && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-lg">📍 Lokasi Sekolah</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-400">Nama</p>
                      <p className="text-white font-medium">{schoolSettings.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Radius</p>
                      <p className="text-white font-medium">{(schoolSettings.geolocation_radius_meters / 1000).toFixed(1)} km</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Koordinat</p>
                      <p className="text-white font-mono text-xs break-all">
                        {schoolSettings.geolocation_latitude.toFixed(4)}, {schoolSettings.geolocation_longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Result Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-lg">📊 Hasil Absensi</h3>
                {result ? (
                  <div className="space-y-2">
                    {result.success ? (
                      <div className="text-green-400">
                        <p className="font-semibold">✓ Absensi Berhasil</p>
                        <p className="text-xs text-green-300 mt-1">{result.message}</p>
                      </div>
                    ) : (
                      <div className="text-red-400">
                        <p className="font-semibold">✗ Absensi Gagal</p>
                        <p className="text-xs text-red-300 mt-1">{result.message}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs">Belum ada hasil. Lakukan absensi untuk melihat hasilnya.</p>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-lg">📋 Panduan</h3>
                <ol className="text-xs text-slate-300 space-y-2">
                  <li><span className="font-bold">1.</span> Pastikan Anda berada di area sekolah</li>
                  <li><span className="font-bold">2.</span> Izinkan akses kamera dan lokasi</li>
                  <li><span className="font-bold">3.</span> Arahkan wajah ke kamera dengan jelas</li>
                  <li><span className="font-bold">4.</span> Masukkan nomor induk siswa</li>
                  <li><span className="font-bold">5.</span> Klik tombol "Absen Sekarang"</li>
                  <li><span className="font-bold">6.</span> Tunggu konfirmasi berhasil</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
