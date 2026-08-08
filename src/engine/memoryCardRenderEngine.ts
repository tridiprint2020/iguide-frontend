import logoUrl from "../assets/optimized/logoig.webp";

import type {
  MemoryCardData,
} from "../types/memoryCard";
import {
  getTimelineRouteSegments,
} from "./trackingEngine";
import {
  isStoredPhotoReference,
  loadPhotoBlob,
} from "./mediaStorage";

const WIDTH = 864;
const HEIGHT = 1080;
const MAGENTA = "#FF20CE";
const CYAN = "#42E8F5";

type LoadedImage = ImageBitmap | HTMLImageElement;

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

async function blobToImage(blob: Blob): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob);
    } catch {
      // Algunos WebP/EXIF de Android necesitan el decodificador de <img>.
    }
  }

  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo abrir la imagen."));
    };
    image.src = objectUrl;
  });
}

async function loadUrlImage(url: string): Promise<LoadedImage> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("No se pudo cargar un recurso de la tarjeta.");
  }

  return blobToImage(await response.blob());
}

async function loadMemoryPhoto(
  reference?: string
): Promise<LoadedImage | null> {
  if (!reference) {
    return null;
  }

  if (isStoredPhotoReference(reference)) {
    const blob = await loadPhotoBlob(reference);
    return blob ? blobToImage(blob) : null;
  }

  return loadUrlImage(reference);
}

function releaseImage(image: LoadedImage | null) {
  if (
    image &&
    "close" in image &&
    typeof image.close === "function"
  ) {
    image.close();
  }
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: LoadedImage
) {
  const scale = Math.max(
    WIDTH / image.width,
    HEIGHT / image.height
  );
  const width = image.width * scale;
  const height = image.height * scale;

  context.drawImage(
    image,
    (WIDTH - width) / 2,
    (HEIGHT - height) / 2,
    width,
    height
  );
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
): number {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (context.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
}

function drawRoutePanel(
  context: CanvasRenderingContext2D,
  data: MemoryCardData
) {
  const panelWidth = 246;
  const panelHeight = 212;
  const panelX = WIDTH - panelWidth - 34;
  const panelY = HEIGHT - panelHeight - 34;
  const statsHeight = 52;
  const mapHeight = panelHeight - statsHeight;
  const waypoints = data.waypoints ?? [];
  const memories =
    data.mapBackground?.memories ??
    waypoints.filter((point) => point.type === "memory");
  const segments =
    waypoints.length > 0
      ? getTimelineRouteSegments(waypoints)
      : [data.mapBackground?.path ?? data.path ?? []];
  const routeCoordinates = segments.flat();
  const allCoordinates = [
    ...routeCoordinates,
    ...memories.map(
      (memory) => [memory.lat, memory.lng] as [number, number]
    ),
  ];

  context.save();
  roundedRect(
    context,
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    22
  );
  context.clip();

  /* Base blanca translúcida: la fotografía continúa visible. */
  context.fillStyle = "rgba(255,255,255,0.18)";
  context.fillRect(panelX, panelY, panelWidth, mapHeight);

  context.strokeStyle = "rgba(255,255,255,0.18)";
  context.lineWidth = 7;
  for (let offset = -panelHeight; offset < panelWidth; offset += 44) {
    context.beginPath();
    context.moveTo(panelX + offset, panelY);
    context.lineTo(panelX + offset + panelHeight, panelY + mapHeight);
    context.stroke();
  }

  if (allCoordinates.length > 0) {
    const lats = allCoordinates.map(([lat]) => lat);
    const lngs = allCoordinates.map(([, lng]) => lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.00025);
    const lngSpan = Math.max(maxLng - minLng, 0.00025);
    const padding = 20;
    const project = ([lat, lng]: [number, number]) => ({
      x:
        panelX +
        padding +
        ((lng - minLng) / lngSpan) * (panelWidth - padding * 2),
      y:
        panelY +
        padding +
        ((maxLat - lat) / latSpan) * (mapHeight - padding * 2),
    });

    for (const segment of segments) {
      if (segment.length < 2) {
        continue;
      }

      const projected = segment.map(project);

      context.beginPath();
      projected.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });
      context.strokeStyle = "rgba(255,255,255,0.92)";
      context.lineWidth = 10;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();

      context.strokeStyle = MAGENTA;
      context.lineWidth = 5;
      context.stroke();
    }

    const start = routeCoordinates[0]
      ? project(routeCoordinates[0])
      : null;
    const end = routeCoordinates[routeCoordinates.length - 1]
      ? project(routeCoordinates[routeCoordinates.length - 1])
      : null;

    const drawDot = (
      point: { x: number; y: number },
      radius: number,
      color: string
    ) => {
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = "#FFFFFF";
      context.lineWidth = 3;
      context.stroke();
    };

    if (start) {
      drawDot(start, 10, MAGENTA);
    }

    memories.forEach((memory) => {
      drawDot(project([memory.lat, memory.lng]), 6, CYAN);
    });

    if (end) {
      drawDot(end, 11, MAGENTA);
    }
  }

  context.fillStyle = "rgba(5,7,13,0.46)";
  context.fillRect(
    panelX,
    panelY + mapHeight,
    panelWidth,
    statsHeight
  );

  const stats = [
    [formatDuration(data.stats.durationSeconds), "TIEMPO"],
    [`${data.stats.totalDistanceKm.toFixed(2)} km`, "DISTANCIA"],
    [String(data.stats.totalMemories), "HITOS"],
  ];

  stats.forEach(([value, label], index) => {
    const centerX = panelX + (panelWidth / 3) * (index + 0.5);

    context.textAlign = "center";
    context.fillStyle = index === 2 ? CYAN : "#FFFFFF";
    context.font = "800 14px Arial, sans-serif";
    context.fillText(value, centerX, panelY + mapHeight + 22);
    context.fillStyle = "rgba(255,255,255,0.66)";
    context.font = "700 8px Arial, sans-serif";
    context.fillText(label, centerX, panelY + mapHeight + 39);
  });

  context.restore();

  context.save();
  roundedRect(
    context,
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    22
  );
  context.strokeStyle = "rgba(255,255,255,0.58)";
  context.lineWidth = 2;
  context.stroke();
  context.restore();
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("No se pudo crear la imagen final."));
        }
      },
      "image/png"
    );
  });
}

export async function renderMemoryCardBlob(
  data: MemoryCardData
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Este navegador no pudo preparar la MemoryCard.");
  }

  const [photo, logo] = await Promise.all([
    loadMemoryPhoto(data.photo),
    loadUrlImage(logoUrl),
  ]);

  try {
    if (photo) {
      drawCover(context, photo);
    } else {
      const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
      background.addColorStop(0, "#F8FBFC");
      background.addColorStop(0.55, "#DDECEF");
      background.addColorStop(1, "#E8DDE9");
      context.fillStyle = background;
      context.fillRect(0, 0, WIDTH, HEIGHT);
    }

    const shade = context.createLinearGradient(0, 0, 0, HEIGHT);
    shade.addColorStop(0, "rgba(3,4,8,0.18)");
    shade.addColorStop(0.42, "rgba(3,4,8,0.02)");
    shade.addColorStop(1, "rgba(3,4,8,0.82)");
    context.fillStyle = shade;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    /* El modo screen elimina visualmente el negro del logo actual. */
    context.save();
    context.globalCompositeOperation = "screen";
    const logoWidth = 230;
    const logoHeight = logoWidth * (logo.height / logo.width);
    context.drawImage(logo, 38, 26, logoWidth, logoHeight);
    context.restore();

    const textWidth = data.mapBackground ? 470 : WIDTH - 96;
    context.textAlign = "left";
    context.shadowColor = "rgba(0,0,0,0.72)";
    context.shadowBlur = 16;
    context.fillStyle = "#FFFFFF";
    context.font = "900 54px Arial, sans-serif";
    const nextY = drawWrappedText(
      context,
      data.title,
      48,
      790,
      textWidth,
      58,
      2
    );

    context.font = "700 23px Arial, sans-serif";
    context.fillStyle = "rgba(255,255,255,0.94)";
    context.fillText(data.placeLabel, 48, nextY + 4);

    context.font = "700 18px Arial, sans-serif";
    context.fillStyle = "rgba(255,255,255,0.82)";
    context.fillText(`${data.city}   •   ${data.date}`, 48, nextY + 43);

    if (data.note?.trim()) {
      context.font = "italic 650 18px Arial, sans-serif";
      context.fillStyle = "#FFFFFF";
      drawWrappedText(
        context,
        `“${data.note.trim()}”`,
        48,
        nextY + 82,
        textWidth,
        26,
        2
      );
    }

    context.shadowBlur = 10;
    context.font = "850 17px Arial, sans-serif";
    context.fillStyle = MAGENTA;
    context.fillText("#IGuide #LiveLikeLocal", 48, HEIGHT - 42);
    context.shadowBlur = 0;

    if (data.mapBackground || data.path?.length) {
      drawRoutePanel(context, data);
    }

    return await canvasToBlob(canvas);
  } finally {
    releaseImage(photo);
    releaseImage(logo);
    canvas.width = 1;
    canvas.height = 1;
  }
}
