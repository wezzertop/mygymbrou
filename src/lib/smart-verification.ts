export interface VerificationChecksBreakdown {
  idFrontScore: number; // 0-20
  idBackScore: number; // 0-20
  livenessScore: number; // 0-30
  faceMatchScore: number; // 0-30
  totalScore: number; // 0-100
  level: "high" | "medium" | "low";
  recommendation: string;
  flags: string[];
  livenessPassed: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function sampleRegionSignature(
  img: HTMLImageElement,
  sx = 0,
  sy = 0,
  sw = 1,
  sh = 1,
  grid = 16
): { luma: number[]; rgbAvg: [number, number, number]; edgeEnergy: number } {
  const canvas = document.createElement("canvas");
  canvas.width = grid;
  canvas.height = grid;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { luma: [], rgbAvg: [0, 0, 0], edgeEnergy: 0 };
  }

  const rx = Math.floor(img.naturalWidth * sx);
  const ry = Math.floor(img.naturalHeight * sy);
  const rw = Math.max(1, Math.floor(img.naturalWidth * sw));
  const rh = Math.max(1, Math.floor(img.naturalHeight * sh));
  ctx.drawImage(img, rx, ry, rw, rh, 0, 0, grid, grid);

  const { data } = ctx.getImageData(0, 0, grid, grid);
  const luma: number[] = [];
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let edgeEnergy = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    rSum += r;
    gSum += g;
    bSum += b;
    luma.push(0.299 * r + 0.587 * g + 0.114 * b);
  }

  for (let y = 0; y < grid - 1; y++) {
    for (let x = 0; x < grid - 1; x++) {
      const idx = y * grid + x;
      edgeEnergy +=
        Math.abs(luma[idx] - luma[idx + 1]) +
        Math.abs(luma[idx] - luma[idx + grid]);
    }
  }

  const count = grid * grid;
  return {
    luma,
    rgbAvg: [rSum / count, gSum / count, bSum / count],
    edgeEnergy: edgeEnergy / count,
  };
}

function normalizedDiff(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum / (a.length * 255);
}

function pearsonCorrelation(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  const meanA = a.reduce((s, v) => s + v, 0) / a.length;
  const meanB = b.reduce((s, v) => s + v, 0) / b.length;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < a.length; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  if (den === 0) return 0;
  return num / den; // -1..1
}

/**
 * Mide diferencia real de movimiento entre dos frames de cámara (prueba de vida activa).
 * Devuelve un valor 0..1 donde > 0.045 indica movimiento real de cabeza/escena.
 */
export function computeFrameMotionDelta(
  prevCanvasData: Uint8ClampedArray,
  nextCanvasData: Uint8ClampedArray
): number {
  if (prevCanvasData.length !== nextCanvasData.length || !prevCanvasData.length) {
    return 0;
  }
  let diffSum = 0;
  let pixels = 0;
  for (let i = 0; i < prevCanvasData.length; i += 16) {
    const d =
      Math.abs(prevCanvasData[i] - nextCanvasData[i]) +
      Math.abs(prevCanvasData[i + 1] - nextCanvasData[i + 1]) +
      Math.abs(prevCanvasData[i + 2] - nextCanvasData[i + 2]);
    diffSum += d / 3;
    pixels++;
  }
  return pixels > 0 ? diffSum / (pixels * 255) : 0;
}

/**
 * Evalúa integralmente la verificación del Coach y devuelve un puntaje 0–100% + banderas para /admin.
 */
export async function evaluateSmartVerification(params: {
  idFrontUrl: string;
  idBackUrl: string;
  faceCenterUrl: string;
  faceLeftUrl?: string | null;
  faceRightUrl?: string | null;
  livenessMotionPassed: boolean;
}): Promise<VerificationChecksBreakdown> {
  const flags: string[] = [];

  let idFrontScore = 0;
  let idBackScore = 0;
  let livenessScore = 0;
  let faceMatchScore = 0;

  try {
    const [frontImg, backImg, faceImg] = await Promise.all([
      loadImage(params.idFrontUrl),
      loadImage(params.idBackUrl),
      loadImage(params.faceCenterUrl),
    ]);

    const frontSig = sampleRegionSignature(frontImg, 0, 0, 1, 1, 20);
    const backSig = sampleRegionSignature(backImg, 0, 0, 1, 1, 20);

    // 1. Calidad de ID Frente (0-20)
    const frontGoodRes =
      frontImg.naturalWidth >= 400 && frontImg.naturalHeight >= 250;
    const frontSharp = frontSig.edgeEnergy >= 8;
    idFrontScore = (frontGoodRes ? 12 : 6) + (frontSharp ? 8 : 3);
    if (!frontGoodRes) flags.push("ID frente con baja resolución");
    if (!frontSharp) flags.push("ID frente poco nítida o borrosa");

    // 2. Calidad de ID Reverso + detección de duplicado (0-20)
    const backGoodRes =
      backImg.naturalWidth >= 400 && backImg.naturalHeight >= 250;
    const frontBackDiff = normalizedDiff(frontSig.luma, backSig.luma);
    const isDuplicateSide = frontBackDiff < 0.04;
    if (isDuplicateSide) {
      idBackScore = 3;
      flags.push("Posible duplicado: frente y reverso de credencial casi idénticos");
    } else {
      idBackScore = (backGoodRes ? 12 : 6) + (backSig.edgeEnergy >= 7 ? 8 : 4);
      if (!backGoodRes) flags.push("ID reverso con baja resolución");
    }

    // 3. Prueba de Vida Activa (Liveness: frente + giro izq + giro der) (0-30)
    if (params.livenessMotionPassed && params.faceLeftUrl && params.faceRightUrl) {
      const [leftImg, rightImg] = await Promise.all([
        loadImage(params.faceLeftUrl),
        loadImage(params.faceRightUrl),
      ]);
      const centerSig = sampleRegionSignature(faceImg, 0.2, 0.15, 0.6, 0.7, 16);
      const leftSig = sampleRegionSignature(leftImg, 0.2, 0.15, 0.6, 0.7, 16);
      const rightSig = sampleRegionSignature(rightImg, 0.2, 0.15, 0.6, 0.7, 16);
      const dLeft = normalizedDiff(centerSig.luma, leftSig.luma);
      const dRight = normalizedDiff(centerSig.luma, rightSig.luma);
      const dSides = normalizedDiff(leftSig.luma, rightSig.luma);

      if (dLeft > 0.04 && dRight > 0.04 && dSides > 0.04) {
        livenessScore = 30;
      } else {
        livenessScore = 16;
        flags.push("Movimiento de cabeza muy sutil — revisar giros manualmente");
      }
    } else {
      livenessScore = 8;
      flags.push("Sin prueba de vida activa en cámara (subida manual)");
    }

    // 4. Similitud visual Rostro vs. Foto en Credencial (0-30)
    // Compara región central del rostro selfie vs. regiones típicas de foto en INE/ID (izq y der)
    const selfieFaceSig = sampleRegionSignature(faceImg, 0.25, 0.18, 0.5, 0.58, 16);
    const idPhotoLeftSig = sampleRegionSignature(frontImg, 0.05, 0.22, 0.28, 0.55, 16);
    const idPhotoRightSig = sampleRegionSignature(frontImg, 0.65, 0.22, 0.28, 0.55, 16);

    const corrLeft = pearsonCorrelation(selfieFaceSig.luma, idPhotoLeftSig.luma);
    const corrRight = pearsonCorrelation(selfieFaceSig.luma, idPhotoRightSig.luma);
    const bestCorr = Math.max(corrLeft, corrRight);

    const colorDist = (a: [number, number, number], b: [number, number, number]) =>
      Math.sqrt(
        (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
      ) / 441.67;

    const bestColorSim =
      1 -
      Math.min(
        colorDist(selfieFaceSig.rgbAvg, idPhotoLeftSig.rgbAvg),
        colorDist(selfieFaceSig.rgbAvg, idPhotoRightSig.rgbAvg)
      );

    // Combinamos estructura facial normalizada + consistencia cromática
    const normalizedStruct = Math.max(0, (bestCorr + 1) / 2); // 0..1
    const matchRatio = Math.min(1, Math.max(0, normalizedStruct * 0.55 + bestColorSim * 0.45));
    faceMatchScore = Math.round(matchRatio * 30);

    if (faceMatchScore < 17) {
      flags.push("Similitud facial automática moderada/baja — cotejar rostro vs ID manualmente");
    }
  } catch {
    idFrontScore = 10;
    idBackScore = 10;
    livenessScore = params.livenessMotionPassed ? 24 : 8;
    faceMatchScore = 14;
    flags.push("Análisis automático parcial — revisar imágenes manualmente");
  }

  const totalScore = Math.min(
    100,
    Math.max(0, idFrontScore + idBackScore + livenessScore + faceMatchScore)
  );

  const level: VerificationChecksBreakdown["level"] =
    totalScore >= 80 ? "high" : totalScore >= 55 ? "medium" : "low";

  const recommendation =
    level === "high"
      ? "Alta probabilidad de verificación real. Lista para aprobación rápida."
      : level === "medium"
      ? "Confianza media. Se recomienda revisión visual rápida del administrador."
      : "Requiere atención manual prioritaria antes de aprobar.";

  return {
    idFrontScore,
    idBackScore,
    livenessScore,
    faceMatchScore,
    totalScore,
    level,
    recommendation,
    flags,
    livenessPassed: livenessScore >= 24,
  };
}
