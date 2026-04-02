import { useEffect, useRef, useState } from "react";

interface QRDetectionResult {
  success: boolean;
  data?: string;
  error?: string;
}

export function useQrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    const requestCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@ericblade/quagga2@latest/dist/quagga.min.js";
        script.async = true;
        script.onload = () => {
          initializeQrScanner();
        };
        document.body.appendChild(script);
      } catch (err) {
        setError("Tidak bisa akses kamera");
      }
    };

    const initializeQrScanner = async () => {
      try {
        const Quagga = (window as any).Quagga;
        if (!Quagga) return;

        await Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: videoRef.current,
              constraints: {
                facingMode: "environment",
              },
            },
            decoder: {
              readers: ["qr_code"],
              debug: {
                showPattern: false,
                showConf: false,
                showCounts: false,
              },
            },
          },
          (err: any) => {
            if (err) {
              console.error("QR Scanner init error:", err);
              return;
            }
            Quagga.start();
          }
        );

        Quagga.onDetected((result: any) => {
          const code = result.codeResult.code;
          if (code && code.startsWith("qr_")) {
            setQrCode(code);
            setScanning(false);
            if (Quagga.stop) {
              Quagga.stop();
            }
          }
        });
      } catch (err) {
        console.error("QR initialization error:", err);
      }
    };

    requestCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scanning]);

  const startScanning = () => {
    setQrCode(null);
    setError(null);
    setScanning(true);
  };

  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  return {
    videoRef,
    scanning,
    error,
    qrCode,
    startScanning,
    stopScanning,
  };
}
