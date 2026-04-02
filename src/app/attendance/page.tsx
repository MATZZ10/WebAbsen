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

export default function AttendancePage() {
  const { videoRef, start, error: cameraError } = useCamera();
  const { loading: locationLoading, coords, error: locationError, getLocation } = useGeolocation();
  const { loading, submit, result } = useAttendance();
  const { ready: faceReady, loading: faceLoading, error: faceError } = useFaceApi();
  const [studentId, setStudentId] = useState("");
  const [faceStatus, setFaceStatus] = useState<string | null>(null);

  const TARGET_LATITUDE = parseFloat(process.env.NEXT_PUBLIC_ATTENDANCE_LATITUDE ?? "");
  const TARGET_LONGITUDE = parseFloat(process.env.NEXT_PUBLIC_ATTENDANCE_LONGITUDE ?? "");
  const TARGET_RADIUS = parseFloat(process.env.NEXT_PUBLIC_ATTENDANCE_RADIUS ?? "10");
  const targetIsSet = Number.isFinite(TARGET_LATITUDE) && Number.isFinite(TARGET_LONGITUDE);

  useEffect(() => {
    start();
    getLocation();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white md:p-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.3fr_.9fr]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Absensi Wajah</h1>
                <p className="text-sm text-slate-400">Arahkan wajah ke kamera lalu tekan absen.</p>
              </div>
              <Badge className="border-white/10 bg-white/10">Live</Badge>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
              <video ref={videoRef} autoPlay playsInline className="h-[360px] w-full object-cover" />
            </div>

            <div className="mt-4 grid gap-3">
              <input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student ID" className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none" />
              <Button
                onClick={async () => {
                  setFaceStatus(null);

                  if (!targetIsSet) {
                    setFaceStatus("Target lokasi belum diset. Setel NEXT_PUBLIC_ATTENDANCE_LATITUDE dan NEXT_PUBLIC_ATTENDANCE_LONGITUDE di .env.");
                    return;
                  }

                  if (!coords) {
                    setFaceStatus("Tunggu lokasi GPS atau izinkan akses lokasi.");
                    return;
                  }

                  const distance = getDistanceMeters(coords.latitude, coords.longitude, TARGET_LATITUDE, TARGET_LONGITUDE);
                  if (distance > TARGET_RADIUS) {
                    setFaceStatus(`Jarak terlalu jauh: ${Math.round(distance)} m. Hanya bisa absen dalam radius ${TARGET_RADIUS} m dari lokasi target.`);
                    return;
                  }

                  const video = videoRef.current;
                  if (!video) {
                    setFaceStatus("Video belum tersedia.");
                    return;
                  }

                  if (!faceReady) {
                    setFaceStatus(faceLoading ? "Memuat model face-api.js..." : "Face-api belum siap.");
                    return;
                  }

                  const detection = await detectFace(video);
                  if (!detection) {
                    setFaceStatus("Wajah tidak terdeteksi. Pastikan wajah terlihat jelas di kamera.");
                    return;
                  }

                  const faceImage = captureFaceImage(video);
                  setFaceStatus(`Wajah terdeteksi (confidence ${(detection.score ?? 0).toFixed(2)}). Mengirim data...`);

                  await submit({
                    studentId,
                    status: "present",
                    confidence: detection.score,
                    faceImageUrl: faceImage,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                  });
                }}
                disabled={loading || faceLoading}
              >
                {loading ? "Memproses..." : faceLoading ? "Memuat model..." : "Absen Sekarang"}
              </Button>
            </div>

            <div className="mt-3 text-sm text-slate-400">
              {faceStatus ? faceStatus : null}
              {faceError ? faceError : null}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              {cameraError ? cameraError : null}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              {locationLoading ? "Mencari lokasi..." : locationError ? locationError : coords ? `Lokasi: ${coords.latitude}, ${coords.longitude}` : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold">Hasil</h2>
            <pre className="mt-4 overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              {JSON.stringify(result, null, 2)}
            </pre>
            <p className="mt-4 text-sm text-slate-400">
              UI ini bisa kamu sambungkan ke model face recognition asli kapan saja.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
