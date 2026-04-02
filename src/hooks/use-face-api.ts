"use client";

import { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

export function useFaceApi() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        if (mounted) {
          setReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError("Gagal memuat model face-api.js. Coba refresh halaman atau periksa koneksi.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      mounted = false;
    };
  }, []);

  return { ready, loading, error };
}

export async function detectFace(video: HTMLVideoElement) {
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
  const detection = await faceapi.detectSingleFace(video, options);
  return detection;
}

export function captureFaceImage(video: HTMLVideoElement) {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D tidak tersedia");
  }

  ctx.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.85);
}
