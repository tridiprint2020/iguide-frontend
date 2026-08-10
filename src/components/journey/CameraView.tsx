import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Camera,
  ImagePlus,
  Loader2,
  Route,
} from "lucide-react";

import {
  useJourney,
} from "../../context/JourneyContext";
import type {
  TimelineItem,
} from "../../types/tracking/tracking";
import {
  deletePhoto,
  storePhotoBlob,
} from "../../engine/mediaStorage";
import {
  compressPhotoFile,
} from "../../engine/photoProcessing";
import {
  sensoryFeedbackEngine,
} from "../../engine/sensoryFeedbackEngine";
import { tx } from "../../i18n";

export function CameraView() {
  const {
    journey,
    savePoint,
    resumeWalking,
  } = useJourney();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasAutoOpenedRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openNativeCamera() {
    if (isSaving) {
      return;
    }

    setErrorMessage(null);
    fileInputRef.current?.click();
  }

  useEffect(() => {
    if (hasAutoOpenedRef.current) {
      return;
    }

    hasAutoOpenedRef.current = true;
    window.setTimeout(openNativeCamera, 120);
    // La apertura automática ocurre una sola vez al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getCurrentCoordinates(): Promise<{
    lat: number;
    lng: number;
  }> {
    const latestJourneyPoint =
      [...journey.timeline]
        .reverse()
        .find(
          (item) =>
            Number.isFinite(item.lat) &&
            Number.isFinite(item.lng)
        );

    const fallbackCoordinates =
      latestJourneyPoint
        ? {
            lat: latestJourneyPoint.lat,
            lng: latestJourneyPoint.lng,
          }
        : null;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        if (fallbackCoordinates) {
          resolve(fallbackCoordinates);
          return;
        }

        reject(
          new Error(
            tx("Este dispositivo no permite obtener ubicación GPS.")
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          /*
           * Android puede suspender la lectura GPS al abrir su cámara
           * nativa. La misión ya conserva una ubicación válida; usarla
           * evita perder la fotografía o encerrar al usuario en negro.
           */
          if (fallbackCoordinates) {
            resolve(fallbackCoordinates);
            return;
          }

          reject(
            new Error(
              tx("No se pudo obtener tu ubicación. Activa el GPS e inténtalo nuevamente.")
            )
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 8000,
        }
      );
    });
  }

  async function saveSelectedPhoto(file: File) {
    setIsSaving(true);
    setErrorMessage(null);
    let storedPhotoReference: string | null = null;

    try {
      const [compressedPhotoBlob, coordinates] = await Promise.all([
        compressPhotoFile(file),
        getCurrentCoordinates(),
      ]);

      storedPhotoReference = await storePhotoBlob(compressedPhotoBlob);

      const memoryPoint: TimelineItem = {
        id: crypto.randomUUID(),
        type: "memory",
        lat: coordinates.lat,
        lng: coordinates.lng,
        timestamp: Date.now(),
        photo: storedPhotoReference,
      };

      /*
       * Android ya pidió confirmar la captura. Al regresar a I.GUIDE
       * guardamos directamente y evitamos una segunda revisión idéntica.
       */
      savePoint(memoryPoint);
    } catch (error) {
      if (storedPhotoReference) {
        await deletePhoto(storedPhotoReference).catch(() => undefined);
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : tx("No se pudo guardar el recuerdo.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handlePhotoSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      setIsFlashing(true);
      sensoryFeedbackEngine.shutter();

      window.setTimeout(
        () => setIsFlashing(false),
        280
      );

      void saveSelectedPhoto(file);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        height: "100dvh",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr) auto",
        boxSizing: "border-box",
        overflow: "hidden",
        backgroundColor: "#080910",
        color: "#FFFFFF",
      }}
    >
      {isFlashing && (
        <div
          className="iguide-camera-flash"
          aria-hidden="true"
        />
      )}

      <header
        style={{
          minHeight: "58px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "8px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(8,9,16,0.96)",
        }}
      >
        <button
          type="button"
          onClick={resumeWalking}
          disabled={isSaving}
          style={{
            minHeight: "42px",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 11px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.05)",
            color: "#FFFFFF",
            fontWeight: 750,
            cursor: isSaving ? "wait" : "pointer",
            opacity: isSaving ? 0.45 : 1,
          }}
        >
          <Route size={18} />
          {tx("Ruta")}
        </button>

        <span
          style={{
            color: "#FF3DE8",
            fontSize: "11px",
            fontWeight: 900,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
          }}
        >
          {isSaving ? tx("Guardando…") : tx("Guardar recuerdo")}
        </span>
      </header>

      <main
        style={{
          minHeight: 0,
          display: "grid",
          placeItems: "center",
          padding: "12px",
        }}
      >
        <section
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            maxWidth: "620px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "13px",
            boxSizing: "border-box",
            padding: "26px",
            overflow: "hidden",
            borderRadius: "22px",
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "radial-gradient(circle at 50% 35%, rgba(255,32,206,0.10), transparent 32%), #11131D",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "76px",
              height: "76px",
              display: "grid",
              placeItems: "center",
              borderRadius: "24px",
              color: isSaving ? "#42E8F5" : "#FF3DE8",
              background: isSaving
                ? "rgba(66,232,245,0.10)"
                : "rgba(255,0,255,0.10)",
              border: isSaving
                ? "1px solid rgba(66,232,245,0.28)"
                : "1px solid rgba(255,0,255,0.28)",
            }}
          >
            {isSaving ? (
              <Loader2
                size={35}
                style={{ animation: "iguide-camera-spin 0.9s linear infinite" }}
              />
            ) : (
              <Camera size={34} strokeWidth={1.6} />
            )}
          </div>

          <strong style={{ fontSize: "19px" }}>
            {isSaving
              ? tx("Guardando foto y ubicación…")
              : tx("Captura el momento")}
          </strong>

          <p
            style={{
              maxWidth: "320px",
              margin: 0,
              color: "rgba(255,255,255,0.58)",
              fontSize: "12px",
              lineHeight: 1.5,
            }}
          >
            {isSaving
              ? tx("Enseguida verás tu MemoryCard.")
              : tx("Al aceptar en la cámara, I.GUIDE guardará el recuerdo directamente.")}
          </p>

          {errorMessage && (
            <div
              role="alert"
              style={{
                width: "100%",
                maxWidth: "380px",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1px solid rgba(255,85,85,0.34)",
                background: "rgba(66,8,18,0.91)",
                color: "#FFD3D3",
                fontSize: "11px",
                lineHeight: 1.4,
              }}
            >
              {errorMessage}
            </div>
          )}
        </section>
      </main>

      <footer
        style={{
          padding: "10px 14px max(14px, env(safe-area-inset-bottom))",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(8,9,16,0.98)",
          boxShadow: "0 -12px 28px rgba(0,0,0,0.30)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelected}
          style={{ display: "none" }}
        />

        <button
          type="button"
          onClick={openNativeCamera}
          disabled={isSaving}
          style={{
            width: "100%",
            maxWidth: "620px",
            minHeight: "54px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "9px",
            border: "none",
            borderRadius: "16px",
            background: isSaving
              ? "rgba(66,232,245,0.10)"
              : "linear-gradient(145deg, #FF3DE8, #D4008D)",
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: 900,
            cursor: isSaving ? "wait" : "pointer",
            opacity: isSaving ? 0.66 : 1,
            boxShadow: "0 10px 26px rgba(255,0,184,0.26)",
          }}
        >
          {isSaving ? <Loader2 size={20} /> : <ImagePlus size={20} />}
          {isSaving ? tx("Guardando…") : tx("Abrir cámara")}
        </button>
      </footer>

      <style>
        {`
          @keyframes iguide-camera-spin {
            to { transform: rotate(360deg); }
          }

          .iguide-camera-flash {
            position: fixed;
            z-index: 99999;
            inset: 0;
            pointer-events: none;
            background: #FFFFFF;
            animation: iguide-camera-flash 280ms ease-out both;
          }

          @keyframes iguide-camera-flash {
            0% { opacity: 0; }
            14% { opacity: 0.94; }
            100% { opacity: 0; }
          }

          @media (prefers-reduced-motion: reduce) {
            .iguide-camera-flash {
              animation-duration: 80ms;
            }
          }
        `}
      </style>
    </div>
  );
}
