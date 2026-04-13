"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ScanLine, Square, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCameraStartError, getCameraSupportError } from "@/lib/camera-support";

type ScannerState = "idle" | "camera" | "reading";

function cleanCardName(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => /^[A-Za-z0-9' ,.-]{3,}$/.test(line))
    ?.replace(/\s{2,}/g, " ")
    .trim();
}

function writeInputValue(inputId: string, value: string) {
  const input = document.getElementById(inputId) as HTMLInputElement | null;
  if (!input) return;

  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.focus();
}

export function CardScanner({ targetInputId }: { targetInputId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ScannerState>("idle");
  const [message, setMessage] = useState(
    "Karte flach hinlegen, gut beleuchten und den Kartennamen oben scharf ausrichten.",
  );

  useEffect(() => {
    return () => stopCamera();
  }, []);

  async function startCamera() {
    const supportError = getCameraSupportError();
    if (supportError) {
      setMessage(supportError);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("camera");
      setMessage("Rahme die Karte so ein, dass der Kartenname oben gut lesbar ist.");
    } catch (error) {
      setMessage(getCameraStartError(error));
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
  }

  async function scanCardName() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setState("reading");
    setMessage("Kartennamen wird gelesen ...");

    const width = video.videoWidth;
    const height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || width === 0 || height === 0) {
      setMessage("Kamerabild ist noch nicht bereit. Versuche es gleich erneut.");
      setState("camera");
      return;
    }

    const cropX = Math.round(width * 0.16);
    const cropY = Math.round(height * 0.13);
    const cropWidth = Math.round(width * 0.68);
    const cropHeight = Math.round(height * 0.16);

    canvas.width = cropWidth * 2;
    canvas.height = cropHeight * 2;
    context.filter = "contrast(1.35) grayscale(1)";
    context.drawImage(
      video,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const result = await worker.recognize(canvas);
      await worker.terminate();

      const cardName = cleanCardName(result.data.text);
      if (!cardName) {
        setMessage("Kein Kartenname erkannt. Naeher ran, Reflexionen vermeiden und erneut scannen.");
        setState("camera");
        return;
      }

      writeInputValue(targetInputId, cardName);
      setMessage(`Erkannt: ${cardName}`);
      stopCamera();
    } catch {
      setMessage("OCR konnte nicht abgeschlossen werden. Versuche es erneut.");
      setState("camera");
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ScanLine className="h-4 w-4 text-primary" />
            Kartenname scannen
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {state === "idle" ? (
            <Button type="button" onClick={startCamera}>
              <Camera className="mr-2 h-4 w-4" />
              Scanner starten
            </Button>
          ) : (
            <>
              <Button type="button" onClick={scanCardName} disabled={state === "reading"}>
                {state === "reading" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                Aufnehmen
              </Button>
              <Button type="button" variant="outline" onClick={stopCamera}>
                <X className="mr-2 h-4 w-4" />
                Schliessen
              </Button>
            </>
          )}
        </div>
      </div>

      {state !== "idle" ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-black shadow-glass">
          <video ref={videoRef} className="aspect-video w-full object-cover" playsInline muted />
          <div className="pointer-events-none -mt-[56.25%] aspect-video w-full">
            <div className="mx-auto mt-[13%] h-[16%] w-[68%] rounded-md border-2 border-primary/80 bg-primary/10 shadow-[0_0_34px_rgba(42,214,170,0.32)]" />
          </div>
        </div>
      ) : null}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
