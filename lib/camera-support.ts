"use client";

import { Capacitor } from "@capacitor/core";

function isNativeCapacitor() {
  return Capacitor.isNativePlatform();
}

export function getCameraSupportError() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "Kamerazugriff ist nur im Browser verfuegbar.";
  }

  if (!window.isSecureContext && !isNativeCapacitor()) {
    return "Kamerazugriff ist auf iPhone/Safari nur ueber HTTPS verfuegbar. Oeffne die App per HTTPS oder ueber localhost.";
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return "Dieser Browser unterstuetzt keinen Kamerazugriff.";
  }

  return null;
}

export function getCameraStartError(error: unknown) {
  if (!(error instanceof DOMException)) {
    return "Kamera konnte nicht gestartet werden. Pruefe die Berechtigung.";
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "Kamerazugriff wurde blockiert. Erlaube Safari den Kamerazugriff fuer diese Website.";
  }

  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
    return "Keine Kamera gefunden.";
  }

  if (error.name === "NotReadableError" || error.name === "TrackStartError") {
    return "Kamera ist gerade nicht verfuegbar. Schliesse andere Apps, die die Kamera nutzen.";
  }

  return error.message || "Kamera konnte nicht gestartet werden. Pruefe die Berechtigung.";
}
