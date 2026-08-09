import logoUrl from "../assets/branding/logo-dark-bg.png";

import type {
  MemoryCardData,
} from "../types/memoryCard";
import type {
  TimelineItem,
} from "../types/tracking/tracking";
import {
  getTimelineRouteSegments,
} from "./trackingEngine";
import {
  isStoredPhotoReference,
  loadPhotoBlob,
} from "./mediaStorage";
import { tx } from "../i18n";

const WIDTH = 864;
const HEIGHT = 1080;
const TILE_SIZE = 256;
const MAGENTA = "#FF20CE";
const CYAN = "#42E8F5";
const ORANGE = "#FF8A00";

type Coordinate = [number, number];
type LoadedImage = ImageBitmap | HTMLImageElement;

type RouteModel = {
  segments: Coordinate[][];
  coordinates: Coordinate[];
  memories: TimelineItem[];
  start: Coordinate | null;
  end: Coordinate | null;
  abandoned: boolean;
};

type MapProjection = {
  zoom: number;
  topLeftX: number;
  topLeftY: number;
  project: (coordinate: Coordinate) => { x: number; y: number };
};

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
      // Algunos JPEG con EXIF de Android necesitan el decodificador de <img>.
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

async function loadUrlImage(
  url: string,
  timeoutMs = 5000
): Promise<LoadedImage> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error("No se pudo cargar un recurso de la tarjeta.");
    }

    return await blobToImage(await response.blob());
  } finally {
    window.clearTimeout(timeout);
  }
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
  image: LoadedImage,
  overscan = 0
) {
  const targetWidth = WIDTH + overscan * 2;
  const targetHeight = HEIGHT + overscan * 2;
  const scale = Math.max(
    targetWidth / image.width,
    targetHeight / image.height
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

function drawPhotoPreservingFrame(
  context: CanvasRenderingContext2D,
  image: LoadedImage
) {
  /*
   * La capa borrosa llena el formato social. La capa superior usa
   * contain: una foto horizontal conserva a todas las personas.
   */
  context.save();
  context.filter = "blur(30px) brightness(0.62) saturate(0.92)";
  drawCover(context, image, 44);
  context.restore();

  const scale = Math.min(
    WIDTH / image.width,
    HEIGHT / image.height
  );
  const width = image.width * scale;
  const height = image.height * scale;

  context.save();
  context.shadowColor = "rgba(0,0,0,0.45)";
  context.shadowBlur = 24;
  context.drawImage(
    image,
    (WIDTH - width) / 2,
    (HEIGHT - height) / 2,
    width,
    height
  );
  context.restore();
}

function buildRouteModel(data: MemoryCardData): RouteModel {
  const waypoints = data.waypoints ?? [];
  const memories =
    data.mapBackground?.memories ??
    waypoints.filter((point) => point.type === "memory");
  const rawSegments =
    waypoints.length > 0
      ? getTimelineRouteSegments(waypoints)
      : [data.mapBackground?.path ?? data.path ?? []];
  const lastWaypoint = waypoints[waypoints.length - 1];
  const segments =
    lastWaypoint?.type === "memory" && rawSegments.length > 0
      ? rawSegments.map((segment, index) =>
          index === rawSegments.length - 1
            ? [
                ...segment,
                [lastWaypoint.lat, lastWaypoint.lng] as Coordinate,
              ]
            : segment
        )
      : rawSegments;
  const coordinates = segments.flat();
  const startWaypoint = waypoints.find(
    (point) => point.type === "start"
  );
  const terminalWaypoint = [...waypoints]
    .reverse()
    .find(
      (point) => point.type === "finish" || point.type === "abort"
    );

  return {
    segments,
    coordinates,
    memories,
    start: startWaypoint
      ? [startWaypoint.lat, startWaypoint.lng]
      : coordinates[0] ?? null,
    end: terminalWaypoint
      ? [terminalWaypoint.lat, terminalWaypoint.lng]
      : null,
    abandoned: terminalWaypoint?.type === "abort",
  };
}

function latLngToWorld(
  [lat, lng]: Coordinate,
  zoom: number
): { x: number; y: number } {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const safeLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const sinLat = Math.sin((safeLat * Math.PI) / 180);

  return {
    x: ((lng + 180) / 360) * worldSize,
    y:
      (0.5 -
        Math.log((1 + sinLat) / (1 - sinLat)) /
          (4 * Math.PI)) *
      worldSize,
  };
}

function createMapProjection(
  coordinates: Coordinate[],
  width: number,
  height: number
): MapProjection {
  const usableWidth = Math.max(40, width - 34);
  const usableHeight = Math.max(40, height - 30);
  let selectedZoom = 18;

  if (coordinates.length > 1) {
    for (let zoom = 18; zoom >= 12; zoom -= 1) {
      const projected = coordinates.map((point) =>
        latLngToWorld(point, zoom)
      );
      const xs = projected.map((point) => point.x);
      const ys = projected.map((point) => point.y);

      if (
        Math.max(...xs) - Math.min(...xs) <= usableWidth &&
        Math.max(...ys) - Math.min(...ys) <= usableHeight
      ) {
        selectedZoom = zoom;
        break;
      }
    }
  }

  const projected = coordinates.map((point) =>
    latLngToWorld(point, selectedZoom)
  );
  const xs = projected.map((point) => point.x);
  const ys = projected.map((point) => point.y);
  const centerX =
    coordinates.length > 0
      ? (Math.min(...xs) + Math.max(...xs)) / 2
      : 0;
  const centerY =
    coordinates.length > 0
      ? (Math.min(...ys) + Math.max(...ys)) / 2
      : 0;
  const topLeftX = centerX - width / 2;
  const topLeftY = centerY - height / 2;

  return {
    zoom: selectedZoom,
    topLeftX,
    topLeftY,
    project: (coordinate) => {
      const point = latLngToWorld(coordinate, selectedZoom);

      return {
        x: point.x - topLeftX,
        y: point.y - topLeftY,
      };
    },
  };
}

async function drawStreetTiles(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  projection: MapProjection
): Promise<boolean> {
  const firstTileX = Math.floor(projection.topLeftX / TILE_SIZE);
  const lastTileX = Math.floor(
    (projection.topLeftX + width) / TILE_SIZE
  );
  const firstTileY = Math.floor(projection.topLeftY / TILE_SIZE);
  const lastTileY = Math.floor(
    (projection.topLeftY + height) / TILE_SIZE
  );
  const tileLimit = 2 ** projection.zoom;
  const requests: Array<{
    image: Promise<LoadedImage | null>;
    drawX: number;
    drawY: number;
  }> = [];

  for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
    if (tileY < 0 || tileY >= tileLimit) {
      continue;
    }

    for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
      const wrappedTileX = ((tileX % tileLimit) + tileLimit) % tileLimit;
      const url =
        `https://a.basemaps.cartocdn.com/light_all/` +
        `${projection.zoom}/${wrappedTileX}/${tileY}.png`;

      requests.push({
        image: loadUrlImage(url, 2600).catch(() => null),
        drawX: x + tileX * TILE_SIZE - projection.topLeftX,
        drawY: y + tileY * TILE_SIZE - projection.topLeftY,
      });
    }
  }

  const tiles = await Promise.all(
    requests.map(async (request) => ({
      ...request,
      loadedImage: await request.image,
    }))
  );

  context.save();
  context.globalAlpha = 0.40;

  for (const tile of tiles) {
    if (!tile.loadedImage) {
      continue;
    }

    context.drawImage(
      tile.loadedImage,
      tile.drawX,
      tile.drawY,
      TILE_SIZE,
      TILE_SIZE
    );
  }

  context.restore();
  const drewTiles = tiles.some((tile) => Boolean(tile.loadedImage));
  tiles.forEach((tile) => releaseImage(tile.loadedImage));

  return drewTiles;
}

function drawMapFallback(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  context.save();
  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.lineWidth = 5;

  for (let offset = -height; offset < width; offset += 38) {
    context.beginPath();
    context.moveTo(x + offset, y);
    context.lineTo(x + offset + height, y + height);
    context.stroke();
  }

  context.strokeStyle = "rgba(90,125,135,0.12)";
  context.lineWidth = 1;
  for (let row = 22; row < height; row += 40) {
    context.beginPath();
    context.moveTo(x, y + row);
    context.lineTo(x + width, y + row - 10);
    context.stroke();
  }
  context.restore();
}

function drawDot(
  context: CanvasRenderingContext2D,
  point: { x: number; y: number },
  radius: number,
  color: string
) {
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.strokeStyle = "#FFFFFF";
  context.lineWidth = 3;
  context.stroke();
}

async function drawRoutePanel(
  context: CanvasRenderingContext2D,
  data: MemoryCardData
) {
  const panelWidth = 270;
  const panelHeight = 214;
  const statsHeight = 44;
  const mapHeight = panelHeight - statsHeight;
  const panelX = WIDTH - panelWidth - 28;
  const panelY = HEIGHT - panelHeight - 28;
  const model = buildRouteModel(data);
  const allCoordinates = [
    ...model.coordinates,
    ...model.memories.map(
      (memory) => [memory.lat, memory.lng] as Coordinate
    ),
    ...(model.start ? [model.start] : []),
    ...(model.end ? [model.end] : []),
  ];
  const projection = createMapProjection(
    allCoordinates.length > 0
      ? allCoordinates
      : [data.mapBackground?.center ?? [data.lat ?? 0, data.lng ?? 0]],
    panelWidth,
    mapHeight
  );

  context.save();
  roundedRect(
    context,
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    21
  );
  context.clip();

  /* Solo 8% de blanco: la foto sigue siendo la protagonista. */
  context.fillStyle = "rgba(255,255,255,0.08)";
  context.fillRect(panelX, panelY, panelWidth, mapHeight);
  const hasStreetTiles = await drawStreetTiles(
    context,
    panelX,
    panelY,
    panelWidth,
    mapHeight,
    projection
  );

  if (!hasStreetTiles) {
    drawMapFallback(context, panelX, panelY, panelWidth, mapHeight);
  }

  const project = (coordinate: Coordinate) => {
    const point = projection.project(coordinate);
    return {
      x: panelX + point.x,
      y: panelY + point.y,
    };
  };

  for (const segment of model.segments) {
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
    context.strokeStyle = "rgba(255,255,255,0.94)";
    context.lineWidth = 6;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
    context.strokeStyle = MAGENTA;
    context.lineWidth = 3.5;
    context.stroke();
  }

  if (model.start) {
    drawDot(context, project(model.start), 10, MAGENTA);
  }

  model.memories.forEach((memory) => {
    drawDot(context, project([memory.lat, memory.lng]), 6, CYAN);
  });

  if (model.end) {
    drawDot(
      context,
      project(model.end),
      11,
      model.abandoned ? ORANGE : MAGENTA
    );
  }

  context.fillStyle = "rgba(5,7,13,0.48)";
  context.fillRect(
    panelX,
    panelY + mapHeight,
    panelWidth,
    statsHeight
  );

  const stats = [
    [
      formatDuration(data.stats.durationSeconds),
      tx("Tiempo").toUpperCase(),
    ],
    [
      `${data.stats.totalDistanceKm.toFixed(2)} km`,
      tx("Distancia").toUpperCase(),
    ],
    [
      String(data.stats.totalMemories),
      tx("Hitos").toUpperCase(),
    ],
  ];

  stats.forEach(([value, label], index) => {
    const centerX = panelX + (panelWidth / 3) * (index + 0.5);

    context.textAlign = "center";
    context.fillStyle = index === 2 ? CYAN : "#FFFFFF";
    context.font = "800 14px Arial, sans-serif";
    context.fillText(value, centerX, panelY + mapHeight + 19);
    context.fillStyle = "rgba(255,255,255,0.68)";
    context.font = "700 7px Arial, sans-serif";
    context.fillText(label, centerX, panelY + mapHeight + 34);
  });

  context.fillStyle = "rgba(0,0,0,0.54)";
  context.font = "600 7px Arial, sans-serif";
  context.textAlign = "right";
  context.fillText(
    "© OpenStreetMap · © CARTO",
    panelX + panelWidth - 6,
    panelY + mapHeight - 5
  );
  context.restore();

  context.save();
  roundedRect(
    context,
    panelX,
    panelY,
    panelWidth,
    panelHeight,
    21
  );
  context.strokeStyle = "rgba(255,255,255,0.58)";
  context.lineWidth = 2;
  context.stroke();
  context.restore();
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
      "image/jpeg",
      0.92
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
      drawPhotoPreservingFrame(context, photo);
    } else {
      const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
      background.addColorStop(0, "#F8FBFC");
      background.addColorStop(0.55, "#DDECEF");
      background.addColorStop(1, "#E8DDE9");
      context.fillStyle = background;
      context.fillRect(0, 0, WIDTH, HEIGHT);
    }

    const shade = context.createLinearGradient(0, 0, 0, HEIGHT);
    shade.addColorStop(0, "rgba(3,4,8,0.22)");
    shade.addColorStop(0.42, "rgba(3,4,8,0.01)");
    shade.addColorStop(1, "rgba(3,4,8,0.82)");
    context.fillStyle = shade;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    /* Logo sólido y compacto: conserva contraste aun sobre fotos claras. */
    context.save();
    context.shadowColor = "rgba(0,0,0,0.72)";
    context.shadowBlur = 13;
    context.shadowOffsetY = 2;
    context.drawImage(
      logo,
      70,
      130,
      540,
      360,
      28,
      0,
      171,
      114
    );
    context.restore();

    const hasMap = Boolean(data.mapBackground || data.path?.length);
    const textWidth = hasMap ? 500 : WIDTH - 96;
    context.textAlign = "left";
    context.shadowColor = "rgba(0,0,0,0.72)";
    context.shadowBlur = 16;
    context.fillStyle = "#FFFFFF";
    context.font = "900 52px Arial, sans-serif";
    const titleLines =
      context.measureText(data.title).width <= textWidth ? 1 : 2;
    const hasNote = Boolean(data.note?.trim());
    const titleLastBaseline = hasNote ? 856 : 900;
    const titleStartY =
      titleLastBaseline - (titleLines - 1) * 52;
    const nextY = drawWrappedText(
      context,
      data.title,
      46,
      titleStartY,
      textWidth,
      52,
      2
    );
    const lastTitleBaseline = nextY - 52;

    context.font = "700 22px Arial, sans-serif";
    context.fillStyle = "rgba(255,255,255,0.94)";
    const placeLabelY = lastTitleBaseline + 32;
    context.fillText(data.placeLabel, 46, placeLabelY);

    context.font = "700 17px Arial, sans-serif";
    context.fillStyle = "rgba(255,255,255,0.82)";
    const metadataY = hasNote ? placeLabelY + 83 : placeLabelY + 31;
    context.fillText(`${data.city}   •   ${data.date}`, 46, metadataY);

    if (hasNote) {
      context.font = "italic 650 17px Arial, sans-serif";
      context.fillStyle = "#FFFFFF";
      drawWrappedText(
        context,
        `“${data.note!.trim()}”`,
        46,
        placeLabelY + 29,
        textWidth,
        22,
        2
      );
    }

    context.shadowBlur = 9;
    context.font = "850 16px Arial, sans-serif";
    context.fillStyle = MAGENTA;
    context.fillText("#IGuide #LiveLikeLocal", 46, metadataY + 27);
    context.shadowBlur = 0;

    if (hasMap) {
      await drawRoutePanel(context, data);
    }

    return await canvasToBlob(canvas);
  } finally {
    releaseImage(photo);
    releaseImage(logo);
    canvas.width = 1;
    canvas.height = 1;
  }
}
