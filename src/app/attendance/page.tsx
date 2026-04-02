"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useAttendance } from "@/hooks/use-attendance";
import { useFaceApi, captureFaceImage, detectFace } from "@/hooks/use-face-api";
import { useQrScanner } from "@/hooks/use-qr-scanner";
import { getDistanceMeters } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, AlertCircle, CheckCircle2, QrCode, Camera } from "lucide-react";

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
  const session = useSession();
  const { videoRef, start, error: cameraError } = useCamera();
  const { loading: locationLoading, coords, error: locationError, getLocation } = useGeolocation();
  const { loading, submit, result } = useAttendance();
  const { ready: faceReady, loading: faceLoading, error: faceError } = useFaceApi();
  const { videoRef: qrVideoRef, scanning: qrScanning, startScanning: startQrScanning, stopScanning: stopQrScanning, qrCode, error: qrError } = useQrScanner();
  
  const [attendanceMethod, setAttendanceMethod] = useState<"face" | "qr">("face");
  const [faceStatus, setFaceStatus] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [qrProcessing, setQrProcessing] = useState(false);

  useEffect(() => {
    start();
    getLocation();
    checkAttendanceStatus();
    
    const interval = setInterval(checkAttendanceStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (qrCode && !qrProcessing) {
      processQrCode(qrCode);
    }
  }, [qrCode]);

  async function processQrCode(code: string) {
    if (!coords) {
      setQrStatus("Menunggu data lokasi...");
      return;
    }

    setQrProcessing(true);
    setQrStatus("Memproses QR code...");

    try {
      const res = await fetch("/api/attendance/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode: code,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQrStatus(`✓ ${data.message}`);
        stopQrScanning();
      } else {
        setQrStatus(`✗ ${data.error || "Gagal memproses QR code"}`);
      }
    } catch (error) {
      console.error(error);
      setQrStatus("✗ Error memproses QR code");
    } finally {
      setQrProcessing(false);
    }
  }

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Sistem Absensi Siswa</h1>
          <p className="text-slate-400 mt-2">Pilih metode absensi dan ikuti instruksi</p>
        </div>

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

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setAttendanceMethod("face")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              attendanceMethod === "face"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <Camera size={20} />
            Absen Wajah
          </button>
          <button
            onClick={() => setAttendanceMethod("qr")}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              attendanceMethod === "qr"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <QrCode size={20} />
            Scan QR Code
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {attendanceMethod === "face" ? "Absensi Wajah" : "Scan QR Code"}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {attendanceMethod === "face"
                      ? "Arahkan wajah ke kamera, lalu tekan tombol absen"
                      : "Arahkan kamera ke QR code yang diberikan guru"}
                  </p>
                </div>
                <Badge className="border-white/10 bg-white/10">
                  {attendanceMethod === "face" ? "📹 Live" : "📱 QR"}
                </Badge>
              </div>

              {attendanceMethod === "face" ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black mb-4">
                  <video ref={videoRef} autoPlay playsInline className="h-[400px] w-full object-cover" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black mb-4">
                  {qrScanning ? (
                    <video ref={qrVideoRef} autoPlay playsInline className="h-[400px] w-full object-cover" />
                  ) : (
                    <div className="h-[400px] w-full bg-slate-900 flex flex-col items-center justify-center gap-4">
                      <QrCode size={64} className="text-slate-500" />
                      <p className="text-slate-400">Tekan "Mulai Scan" untuk memulai scanner QR</p>
                    </div>
                  )}
                </div>
              )}

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

              <div className="space-y-3">
                {attendanceMethod === "face" ? (
                  <Button
                    onClick={async () => {
                      setFaceStatus(null);

                      if (!canAttend) {
                        setFaceStatus("Sistem absensi belum dibuka. Tunggu waktu absensi dimulai.");
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
                      studentId: session.data?.user?.id || "",
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
              ) : (
                <>
                  <Button
                    onClick={() => {
                      if (qrScanning) {
                        stopQrScanning();
                      } else {
                        setQrStatus(null);
                        startQrScanning();
                      }
                    }}
                    disabled={!canAttend}
                    className={`w-full h-12 rounded-lg font-semibold transition ${
                      !canAttend
                        ? "bg-slate-700 cursor-not-allowed text-slate-500"
                        : qrScanning
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    }`}
                  >
                    {qrScanning ? "Hentikan Scan" : "Mulai Scan QR"}
                  </Button>
                  {!canAttend && (
                    <p className="text-xs text-slate-400 text-center">
                      Sistem absensi belum dibuka
                    </p>
                  )}
                </>
              )}
              </div>

              {attendanceMethod === "face" ? (
                <>
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
                </>
              ) : (
                <>
                  {qrStatus && (
                    <div className={`mt-4 p-3 rounded-lg border ${ 
                      qrStatus.startsWith("✓")
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-slate-800/50 border-slate-700"
                    }`}>
                      <p className={`text-sm ${qrStatus.startsWith("✓") ? "text-green-300" : "text-slate-300"}`}>
                        {qrStatus}
                      </p>
                    </div>
                  )}
                  {qrError && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-300">{qrError}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
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

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-lg">📋 Panduan</h3>
                <ol className="text-xs text-slate-300 space-y-2">
                  <li><span className="font-bold">1.</span> Pastikan Anda berada di area sekolah</li>
                  <li><span className="font-bold">2.</span> Izinkan akses kamera dan lokasi</li>
                  <li><span className="font-bold">3.</span> Arahkan wajah ke kamera dengan jelas</li>
                  <li><span className="font-bold">4.</span> Klik tombol "Absen Sekarang"</li>
                  <li><span className="font-bold">5.</span> Tunggu konfirmasi berhasil</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
