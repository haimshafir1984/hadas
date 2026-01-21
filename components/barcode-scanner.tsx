"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BarcodeScannerProps = {
  onDetected?: (value: string) => void;
  inputId?: string;
  formId?: string;
};

export function BarcodeScanner({ onDetected, inputId, formId }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const startCamera = async () => {
      try {
        if (!("BarcodeDetector" in window)) {
          setError("הדפדפן לא תומך בסריקת ברקוד.");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new (window as any).BarcodeDetector({
          formats: ["code_128", "ean_13", "ean_8", "qr_code"]
        });

        intervalId = setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              if (inputId) {
                const input = document.getElementById(inputId) as HTMLInputElement | null;
                if (input) {
                  input.value = value;
                }
                if (formId) {
                  const form = document.getElementById(formId) as HTMLFormElement | null;
                  form?.requestSubmit();
                }
              }
              onDetected?.(value);
              setIsActive(false);
            }
          } catch {
            // ignore frame errors
          }
        }, 500);
      } catch {
        setError("אין גישה למצלמה. בדוק הרשאות.");
      }
    };

    if (isActive) {
      setError(null);
      startCamera();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive, onDetected]);

  return (
    <div className="space-y-3">
      {!isActive ? (
        <Button type="button" variant="outline" onClick={() => setIsActive(true)}>
          <Camera size={16} className="mr-2" />
          סריקת ברקוד
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <video ref={videoRef} className="h-52 w-full object-cover" />
          </div>
          <Button type="button" variant="outline" onClick={() => setIsActive(false)}>
            <X size={16} className="mr-2" />
            עצור סריקה
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}

