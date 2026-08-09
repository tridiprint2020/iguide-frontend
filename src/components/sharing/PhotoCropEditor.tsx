import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Check,
  Crop,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";

import {
  loadPhotoBlob,
} from "../../engine/mediaStorage";
import { tx } from "../../i18n";

type Props = {
  photoReference: string;
  onCancel: () => void;
  onApply: (croppedPhoto: Blob) => Promise<void>;
};

type LoadedPhoto = ImageBitmap | HTMLImageElement;

const PREVIEW_WIDTH = 432;
const PREVIEW_HEIGHT = 540;
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1350;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

async function decodePhoto(blob: Blob): Promise<LoadedPhoto> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob, {
        imageOrientation: "from-image",
      });
    } catch {
      // WebViews antiguos continúan con el decodificador de <img>.
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
      reject(new Error(tx("No pudimos abrir esta fotografía.")));
    };
    image.src = objectUrl;
  });
}

function releasePhoto(photo: LoadedPhoto | null) {
  if (
    photo &&
    "close" in photo &&
    typeof photo.close === "function"
  ) {
    photo.close();
  }
}

function drawCrop(
  context: CanvasRenderingContext2D,
  photo: LoadedPhoto,
  width: number,
  height: number,
  zoom: number,
  offsetX: number,
  offsetY: number
) {
  const baseScale = Math.max(
    width / photo.width,
    height / photo.height
  );
  const scale = baseScale * zoom;
  const drawWidth = photo.width * scale;
  const drawHeight = photo.height * scale;
  const horizontalTravel = Math.max(0, (drawWidth - width) / 2);
  const verticalTravel = Math.max(0, (drawHeight - height) / 2);
  const drawX =
    (width - drawWidth) / 2 + offsetX * horizontalTravel;
  const drawY =
    (height - drawHeight) / 2 + offsetY * verticalTravel;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#080910";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    photo,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error(tx("No se pudo guardar el encuadre.")));
      },
      "image/jpeg",
      0.88
    );
  });
}

export default function PhotoCropEditor({
  photoReference,
  onCancel,
  onApply,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const photoRef = useRef<LoadedPhoto | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
  } | null>(null);

  const [photoReady, setPhotoReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadedPhoto: LoadedPhoto | null = null;

    void loadPhotoBlob(photoReference)
      .then(async (blob) => {
        if (!blob) {
          throw new Error(tx("No se encontró la fotografía guardada."));
        }

        loadedPhoto = await decodePhoto(blob);

        if (cancelled) {
          releasePhoto(loadedPhoto);
          return;
        }

        photoRef.current = loadedPhoto;
        setPhotoReady(true);
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : tx("No pudimos abrir esta fotografía.")
          );
        }
      });

    return () => {
      cancelled = true;
      releasePhoto(photoRef.current ?? loadedPhoto);
      photoRef.current = null;
    };
  }, [photoReference]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const photo = photoRef.current;

    if (!canvas || !photo || !photoReady) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    drawCrop(
      context,
      photo,
      PREVIEW_WIDTH,
      PREVIEW_HEIGHT,
      zoom,
      offsetX,
      offsetY
    );
  }, [photoReady, zoom, offsetX, offsetY]);

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (!photoReady || isSaving) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialOffsetX: offsetX,
      initialOffsetY: offsetY,
    };
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontalChange =
      ((event.clientX - drag.startX) / Math.max(1, bounds.width)) * 2;
    const verticalChange =
      ((event.clientY - drag.startY) / Math.max(1, bounds.height)) * 2;

    setOffsetX(
      clamp(drag.initialOffsetX + horizontalChange, -1, 1)
    );
    setOffsetY(
      clamp(drag.initialOffsetY + verticalChange, -1, 1)
    );
  }

  function handlePointerEnd(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  function resetFraming() {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }

  async function handleApply() {
    const photo = photoRef.current;

    if (!photo || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = OUTPUT_WIDTH;
      outputCanvas.height = OUTPUT_HEIGHT;
      const outputContext = outputCanvas.getContext("2d");

      if (!outputContext) {
        throw new Error(tx("No se pudo guardar el encuadre."));
      }

      drawCrop(
        outputContext,
        photo,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT,
        zoom,
        offsetX,
        offsetY
      );

      const croppedPhoto = await canvasToBlob(outputCanvas);
      outputCanvas.width = 1;
      outputCanvas.height = 1;
      await onApply(croppedPhoto);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : tx("No se pudo guardar el encuadre.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-crop-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box",
        padding: "max(14px, env(safe-area-inset-top)) 14px max(14px, env(safe-area-inset-bottom))",
        overflowY: "auto",
        background: "rgba(3,4,10,0.94)",
        backdropFilter: "blur(14px)",
      }}
    >
      <section
        style={{
          width: "min(94vw, 430px)",
          boxSizing: "border-box",
          padding: "14px",
          borderRadius: "24px",
          border: "1px solid rgba(66,232,245,0.22)",
          background: "linear-gradient(145deg, #151827, #080910)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.70)",
          color: "#FFFFFF",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div>
            <span
              style={{
                color: "#42E8F5",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              {tx("Encuadre 4:5")}
            </span>
            <h2
              id="photo-crop-title"
              style={{
                margin: "4px 0 3px",
                fontSize: "21px",
                lineHeight: 1.1,
              }}
            >
              {tx("Ajusta tu fotografía")}
            </h2>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.58)",
                fontSize: "10px",
                lineHeight: 1.4,
              }}
            >
              {tx("Amplía y arrastra hasta dejar lo importante en las zonas libres.")}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            aria-label={tx("Cerrar")}
            style={{
              width: "38px",
              height: "38px",
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              color: "#FFFFFF",
              cursor: isSaving ? "wait" : "pointer",
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          style={{
            position: "relative",
            width: "min(78vw, 330px)",
            aspectRatio: "4 / 5",
            margin: "0 auto",
            overflow: "hidden",
            borderRadius: "18px",
            border: "1px solid rgba(255,255,255,0.18)",
            background: "#080910",
            touchAction: "none",
            cursor: photoReady ? "grab" : "wait",
          }}
        >
          <canvas
            ref={canvasRef}
            width={PREVIEW_WIDTH}
            height={PREVIEW_HEIGHT}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />

          {!photoReady && !errorMessage && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background: "rgba(8,9,16,0.88)",
                color: "#42E8F5",
              }}
            >
              <Loader2 size={28} />
            </div>
          )}

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              width: "24%",
              height: "10%",
              display: "grid",
              placeItems: "center",
              borderRadius: "9px",
              border: "1px dashed rgba(255,255,255,0.66)",
              background: "rgba(5,7,13,0.25)",
              color: "rgba(255,255,255,0.86)",
              fontSize: "7px",
              fontWeight: 900,
              letterSpacing: "0.08em",
              pointerEvents: "none",
            }}
          >
            {tx("LOGO")}
          </div>

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "8px",
              bottom: "8px",
              width: "35%",
              height: "30%",
              display: "grid",
              placeItems: "center",
              borderRadius: "12px",
              border: "1px dashed rgba(66,232,245,0.78)",
              background: "rgba(5,7,13,0.22)",
              color: "#42E8F5",
              fontSize: "7px",
              fontWeight: 900,
              letterSpacing: "0.08em",
              pointerEvents: "none",
            }}
          >
            {tx("MINIMAPA")}
          </div>

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "8px",
              bottom: "8px",
              width: "50%",
              height: "20%",
              display: "grid",
              placeItems: "center",
              borderRadius: "12px",
              border: "1px dashed rgba(255,61,232,0.74)",
              background: "rgba(5,7,13,0.20)",
              color: "#FF65DF",
              fontSize: "7px",
              fontWeight: 900,
              letterSpacing: "0.08em",
              pointerEvents: "none",
            }}
          >
            {tx("TEXTO")}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            alignItems: "center",
            gap: "9px",
            marginTop: "12px",
          }}
        >
          <Crop size={17} color="#42E8F5" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label={tx("Ampliar fotografía")}
            disabled={!photoReady || isSaving}
            style={{ width: "100%", accentColor: "#FF20CE" }}
          />
          <strong style={{ fontSize: "10px", minWidth: "34px" }}>
            {zoom.toFixed(1)}×
          </strong>
        </div>

        {errorMessage && (
          <p
            role="alert"
            style={{
              margin: "10px 0 0",
              padding: "9px 10px",
              borderRadius: "10px",
              background: "rgba(80,10,22,0.72)",
              color: "#FFD4D4",
              fontSize: "10px",
              lineHeight: 1.4,
            }}
          >
            {errorMessage}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.75fr) minmax(0, 1.45fr)",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          <button
            type="button"
            onClick={resetFraming}
            disabled={!photoReady || isSaving}
            style={{
              minHeight: "46px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              borderRadius: "13px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "#FFFFFF",
              fontSize: "10px",
              fontWeight: 850,
              cursor: isSaving ? "wait" : "pointer",
            }}
          >
            <RotateCcw size={16} />
            {tx("Reiniciar")}
          </button>

          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={!photoReady || isSaving}
            style={{
              minHeight: "46px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              border: "none",
              borderRadius: "13px",
              background: "linear-gradient(145deg, #FF3DE8, #D4008D)",
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: 900,
              cursor: isSaving ? "wait" : "pointer",
              opacity: !photoReady || isSaving ? 0.62 : 1,
            }}
          >
            {isSaving ? <Loader2 size={17} /> : <Check size={17} />}
            {isSaving
              ? tx("Guardando encuadre…")
              : tx("Usar este encuadre")}
          </button>
        </div>
      </section>
    </div>
  );
}
