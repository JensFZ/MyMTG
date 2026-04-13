"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Loader2, ScanLine, ShieldAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCameraStartError, getCameraSupportError } from "@/lib/camera-support";
import type { CardMatch, ScanResult, ScanStatus } from "@/lib/scan-types";
import {
  cropCardNameCanvas,
  detectCardFromCanvas,
  loadOpenCv,
  type CardDetection,
} from "@/lib/live-card-vision";

type MatchResponse = {
  best: CardMatch | null;
  candidates: CardMatch[];
};

const analysisIntervalMs = 450;
const stableFrameTarget = 3;
const scanCooldownMs = 8000;

function cleanOcrLine(text: string) {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/[|_[\]{}]/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => /^[A-Za-z0-9',.\-: ]{3,}$/.test(line))
    .sort((a, b) => b.length - a.length)[0];
}

function isStableDetection(previous: CardDetection | null, next: CardDetection) {
  if (!previous) return false;

  const centerDelta = Math.hypot(
    previous.centerX - next.centerX,
    previous.centerY - next.centerY,
  );
  const areaDelta = Math.abs(previous.areaRatio - next.areaRatio);

  return centerDelta < 0.035 && areaDelta < 0.045;
}

async function readCardName(cardCanvas: HTMLCanvasElement) {
  const nameCanvas = cropCardNameCanvas(cardCanvas);
  const { PSM, createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',.-:",
    });
    const result = await worker.recognize(nameCanvas);
    return cleanOcrLine(result.data.text);
  } finally {
    await worker.terminate();
  }
}

async function matchCard(name: string) {
  const response = await fetch("/api/scan/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as MatchResponse;
}

async function addScannedCard(card: CardMatch) {
  const response = await fetch("/api/scan/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ card, quantity: 1 }),
  });

  if (!response.ok) {
    throw new Error("Karte konnte nicht gespeichert werden.");
  }
}

export function LiveCardScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const lastDetectionRef = useRef<CardDetection | null>(null);
  const stableFramesRef = useRef(0);
  const recentScansRef = useRef(new Map<string, number>());

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [message, setMessage] = useState("Scanner starten und eine Karte in den Rahmen halten.");
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [candidates, setCandidates] = useState<CardMatch[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const statusLabel = useMemo(() => {
    const labels: Record<ScanStatus, string> = {
      idle: "Bereit",
      starting: "Kamera startet",
      searching: "Suche Karte",
      detected: "Karte erkannt",
      processing: "Wird verarbeitet",
      added: "Hinzugefuegt",
      uncertain: "Unsicher",
      error: "Fehler",
    };

    return labels[status];
  }, [status]);

  useEffect(() => {
    return () => stopScanner();
  }, []);

  async function startScanner() {
    const supportError = getCameraSupportError();
    if (supportError) {
      setPermissionError(supportError);
      setStatus("error");
      return;
    }

    setStatus("starting");
    setMessage("Kamera und Kartenerkennung werden vorbereitet ...");
    setPermissionError(null);

    try {
      await loadOpenCv();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("searching");
      setMessage("Halte genau eine Karte ruhig in den Rahmen.");
      timerRef.current = window.setInterval(analyzeFrame, analysisIntervalMs);
    } catch (error) {
      setStatus("error");
      setPermissionError(getCameraStartError(error));
    }
  }

  function stopScanner() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    busyRef.current = false;
    lastDetectionRef.current = null;
    stableFramesRef.current = 0;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("idle");
    setMessage("Scanner starten und eine Karte in den Rahmen halten.");
  }

  async function analyzeFrame() {
    if (busyRef.current || !videoRef.current || !frameCanvasRef.current || !window.cv?.Mat) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
      return;
    }

    const canvas = frameCanvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    const targetWidth = 480;
    const targetHeight = Math.round((video.videoHeight / video.videoWidth) * targetWidth);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.drawImage(video, 0, 0, targetWidth, targetHeight);

    const detection = detectCardFromCanvas(window.cv, canvas);
    if (!detection) {
      lastDetectionRef.current = null;
      stableFramesRef.current = 0;
      if (status !== "processing") {
        setStatus("searching");
        setMessage("Suche eine einzelne, gut sichtbare Kartenkontur.");
      }
      return;
    }

    if (isStableDetection(lastDetectionRef.current, detection)) {
      stableFramesRef.current += 1;
    } else {
      stableFramesRef.current = 1;
    }
    lastDetectionRef.current = detection;

    setStatus("detected");
    setMessage(`Karte erkannt. Stabilitaet ${stableFramesRef.current}/${stableFrameTarget}.`);

    if (stableFramesRef.current >= stableFrameTarget) {
      await processStableCard(detection.warpedCanvas);
    }
  }

  async function processStableCard(cardCanvas: HTMLCanvasElement) {
    busyRef.current = true;
    stableFramesRef.current = 0;
    setCandidates([]);
    setStatus("processing");
    setMessage("Kartenname wird gelesen und mit Scryfall abgeglichen ...");

    try {
      const ocrName = await readCardName(cardCanvas);
      if (!ocrName) {
        setStatus("uncertain");
        setMessage("Kein brauchbarer Kartenname erkannt. Karte neu ausrichten.");
        return;
      }

      const match = await matchCard(ocrName);
      if (!match?.best) {
        setStatus("uncertain");
        setMessage(`Unsicher: "${ocrName}" wurde nicht eindeutig gefunden.`);
        return;
      }

      if (match.candidates.length > 1) {
        setCandidates(match.candidates);
        setStatus("uncertain");
        setMessage(`Mehrere Treffer fuer "${ocrName}". Bitte waehle die passende Karte.`);
        return;
      }

      await confirmCard(match.best);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Scan konnte nicht verarbeitet werden.");
    } finally {
      window.setTimeout(() => {
        busyRef.current = false;
        if (streamRef.current && status !== "idle") {
          setStatus("searching");
          setMessage("Bereit fuer die naechste Karte.");
        }
      }, 900);
    }
  }

  async function confirmCard(card: CardMatch) {
    const now = Date.now();
    const previousScan = recentScansRef.current.get(card.id) ?? 0;

    if (now - previousScan < scanCooldownMs) {
      setStatus("detected");
      setMessage(`${card.name} wurde gerade erst erfasst. Karte kurz wechseln.`);
      return;
    }

    await addScannedCard(card);
    recentScansRef.current.set(card.id, now);
    setCandidates([]);
    setLastResult({ card, addedAt: now });
    setStatus("added");
    setMessage(`${card.name} wurde deiner Sammlung hinzugefuegt.`);
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
        <div className="relative aspect-[3/4] max-h-[72vh] w-full sm:aspect-video">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.32),transparent_22%,transparent_78%,rgba(0,0,0,0.38))]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-primary/80 shadow-[0_0_44px_rgba(53,214,164,0.35)] sm:h-[82%] sm:w-[42%]" />
          <div className="absolute left-4 top-4 rounded-md border border-white/10 bg-black/55 px-3 py-2 text-sm backdrop-blur">
            <span className="inline-flex items-center gap-2">
              {status === "processing" || status === "starting" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : status === "added" ? (
                <Check className="h-4 w-4 text-primary" />
              ) : status === "error" ? (
                <ShieldAlert className="h-4 w-4 text-destructive" />
              ) : (
                <ScanLine className="h-4 w-4 text-primary" />
              )}
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-lg p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{message}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ziehe Karten einzeln durch den Rahmen. OCR startet erst nach stabiler Kontur.
            </p>
          </div>
          <div className="flex gap-2">
            {status === "idle" || status === "error" ? (
              <Button type="button" onClick={startScanner}>
                <Camera className="mr-2 h-4 w-4" />
                Live-Scan starten
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={stopScanner}>
                <X className="mr-2 h-4 w-4" />
                Stoppen
              </Button>
            )}
          </div>
        </div>

        {permissionError ? (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {permissionError}
          </div>
        ) : null}

        {lastResult ? (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/10 p-3">
            {lastResult.card.imageUrl ? (
              <img
                src={lastResult.card.imageUrl}
                alt=""
                className="h-16 w-12 rounded object-cover"
              />
            ) : null}
            <div>
              <p className="font-medium">{lastResult.card.name}</p>
              <p className="text-sm text-muted-foreground">
                {lastResult.card.setName} - #{lastResult.card.collectorNumber}
              </p>
            </div>
          </div>
        ) : null}

        {candidates.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {candidates.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => confirmCard(card)}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-3 text-left transition-colors hover:bg-white/[0.08]"
              >
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt="" className="h-14 w-10 rounded object-cover" />
                ) : null}
                <span>
                  <span className="block font-medium">{card.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {card.setName} - #{card.collectorNumber}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <canvas ref={frameCanvasRef} className="hidden" />
    </div>
  );
}
