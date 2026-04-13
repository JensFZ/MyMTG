"use client";

type OpenCv = any;

export type CardDetection = {
  confidence: number;
  areaRatio: number;
  centerX: number;
  centerY: number;
  corners: Array<{ x: number; y: number }>;
  warpedCanvas: HTMLCanvasElement;
};

const OPENCV_SRC = "https://docs.opencv.org/4.x/opencv.js";
let openCvPromise: Promise<OpenCv> | null = null;

declare global {
  interface Window {
    cv?: OpenCv;
  }
}

export function loadOpenCv() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("OpenCV kann nur im Browser geladen werden."));
  }

  if (window.cv?.Mat) {
    return Promise.resolve(window.cv);
  }

  if (openCvPromise) {
    return openCvPromise;
  }

  openCvPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${OPENCV_SRC}"]`,
    );

    const finish = () => {
      const cv = window.cv;
      if (!cv) {
        reject(new Error("OpenCV wurde nicht gefunden."));
        return;
      }

      if (cv.Mat) {
        resolve(cv);
        return;
      }

      cv.onRuntimeInitialized = () => resolve(cv);
    };

    if (existingScript) {
      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("OpenCV konnte nicht geladen werden.")), {
        once: true,
      });
      finish();
      return;
    }

    const script = document.createElement("script");
    script.src = OPENCV_SRC;
    script.async = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("OpenCV konnte nicht geladen werden."));
    document.head.appendChild(script);
  });

  return openCvPromise;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function orderCorners(points: Array<{ x: number; y: number }>) {
  const sortedBySum = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
  const sortedByDiff = [...points].sort((a, b) => a.x - a.y - (b.x - b.y));

  return [
    sortedBySum[0],
    sortedByDiff[0],
    sortedBySum[3],
    sortedByDiff[3],
  ];
}

function polygonCenter(points: Array<{ x: number; y: number }>) {
  return points.reduce(
    (center, point) => ({
      x: center.x + point.x / points.length,
      y: center.y + point.y / points.length,
    }),
    { x: 0, y: 0 },
  );
}

export function detectCardFromCanvas(cv: OpenCv, sourceCanvas: HTMLCanvasElement) {
  const source = cv.imread(sourceCanvas);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const candidates: Array<{
    corners: Array<{ x: number; y: number }>;
    area: number;
    confidence: number;
  }> = [];

  try {
    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 60, 160);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const frameArea = sourceCanvas.width * sourceCanvas.height;

    for (let i = 0; i < contours.size(); i += 1) {
      const contour = contours.get(i);
      const perimeter = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.03 * perimeter, true);

      if (approx.rows === 4 && cv.isContourConvex(approx)) {
        const area = Math.abs(cv.contourArea(approx));
        const areaRatio = area / frameArea;
        const corners = Array.from({ length: 4 }, (_, index) => ({
          x: approx.intPtr(index, 0)[0],
          y: approx.intPtr(index, 0)[1],
        }));
        const ordered = orderCorners(corners);
        const topWidth = distance(ordered[0], ordered[1]);
        const bottomWidth = distance(ordered[3], ordered[2]);
        const leftHeight = distance(ordered[0], ordered[3]);
        const rightHeight = distance(ordered[1], ordered[2]);
        const width = (topWidth + bottomWidth) / 2;
        const height = (leftHeight + rightHeight) / 2;
        const aspect = width / height;
        const expectedAspect = 0.716;
        const aspectScore = 1 - Math.min(Math.abs(aspect - expectedAspect), expectedAspect) / expectedAspect;

        if (areaRatio > 0.16 && areaRatio < 0.86 && aspectScore > 0.55) {
          candidates.push({
            corners: ordered,
            area,
            confidence: areaRatio * 0.45 + aspectScore * 0.55,
          });
        }
      }

      approx.delete();
      contour.delete();
    }

    if (candidates.length !== 1) {
      return null;
    }

    const candidate = candidates[0];
    const warpedCanvas = document.createElement("canvas");
    warpedCanvas.width = 488;
    warpedCanvas.height = 680;

    const sourcePoints = cv.matFromArray(
      4,
      1,
      cv.CV_32FC2,
      candidate.corners.flatMap((point) => [point.x, point.y]),
    );
    const destinationPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      warpedCanvas.width,
      0,
      warpedCanvas.width,
      warpedCanvas.height,
      0,
      warpedCanvas.height,
    ]);
    const transform = cv.getPerspectiveTransform(sourcePoints, destinationPoints);
    const warped = new cv.Mat();

    cv.warpPerspective(
      source,
      warped,
      transform,
      new cv.Size(warpedCanvas.width, warpedCanvas.height),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(),
    );
    cv.imshow(warpedCanvas, warped);

    const center = polygonCenter(candidate.corners);
    const detection: CardDetection = {
      confidence: candidate.confidence,
      areaRatio: candidate.area / frameArea,
      centerX: center.x / sourceCanvas.width,
      centerY: center.y / sourceCanvas.height,
      corners: candidate.corners,
      warpedCanvas,
    };

    sourcePoints.delete();
    destinationPoints.delete();
    transform.delete();
    warped.delete();

    return detection;
  } finally {
    source.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}

export function cropCardNameCanvas(cardCanvas: HTMLCanvasElement) {
  const nameCanvas = document.createElement("canvas");
  const context = nameCanvas.getContext("2d", { willReadFrequently: true });

  nameCanvas.width = 860;
  nameCanvas.height = 150;

  if (!context) {
    return nameCanvas;
  }

  context.filter = "grayscale(1) contrast(1.45) brightness(1.08)";
  context.drawImage(
    cardCanvas,
    cardCanvas.width * 0.08,
    cardCanvas.height * 0.045,
    cardCanvas.width * 0.84,
    cardCanvas.height * 0.11,
    0,
    0,
    nameCanvas.width,
    nameCanvas.height,
  );

  return nameCanvas;
}
