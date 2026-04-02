"use client";
import { useState, useCallback } from "react";

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const geolocationMode = process.env.NEXT_PUBLIC_GEOLOCATION_MODE || "automatic";

  const getLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung di browser ini");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ 
          latitude: pos.coords.latitude, 
          longitude: pos.coords.longitude 
        });
        setLoading(false);
      },
      (err) => {
        let errorMsg = "Izin lokasi ditolak";
        
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = geolocationMode === "automatic" 
            ? "Silakan izinkan akses lokasi untuk login" 
            : "Mohon izinkan akses lokasi atau gunakan input manual";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = "Lokasi tidak tersedia";
        } else if (err.code === err.TIMEOUT) {
          errorMsg = "Timeout mengambil lokasi";
        }
        
        setError(errorMsg);
        setLoading(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [geolocationMode]);

  const setManualLocation = useCallback((latitude: number, longitude: number) => {
    if (geolocationMode === "manual") {
      setCoords({ latitude, longitude });
      setError(null);
    } else {
      setError("Mode manual tidak diizinkan");
    }
  }, [geolocationMode]);

  return { 
    loading, 
    coords, 
    error, 
    getLocation,
    setManualLocation,
    geolocationMode
  };
}
