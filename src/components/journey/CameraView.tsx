import { useRef, useState } from "react";
import { useJourney } from "../../context/JourneyContext";
import type { TimelineItem } from "../../types/tracking/tracking";

export function CameraView() {
  const { savePoint, resumeWalking } = useJourney();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openNativeCamera() {
    setErrorMessage(null);
    fileInputRef.current?.click();
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("No se pudo convertir la fotografía."));
      };

      reader.onerror = () => {
        reject(new Error("No se pudo leer la fotografía."));
      };

      reader.readAsDataURL(file);
    });
  }

  function getCurrentCoordinates(): Promise<{
    lat: number;
    lng: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("Este dispositivo no permite obtener ubicación GPS.")
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
          reject(
            new Error(
              "No se pudo obtener tu ubicación. Activa el GPS e inténtalo nuevamente."
            )
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );
    });
  }

  async function handlePhotoSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const [photo, coordinates] = await Promise.all([
        readFileAsDataUrl(file),
        getCurrentCoordinates(),
      ]);

      const memoryPoint: TimelineItem = {
        id: crypto.randomUUID(),
        type: "memory",
        lat: coordinates.lat,
        lng: coordinates.lng,
        timestamp: Date.now(),
        photo,
        note: "Recuerdo guardado durante la expedición",
      };

      savePoint(memoryPoint);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el recuerdo.";

      setErrorMessage(message);
    } finally {
      setIsSaving(false);

      // Permite volver a tomar la misma fotografía si fuera necesario.
      event.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between p-6 text-white antialiased">
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={resumeWalking}
          disabled={isSaving}
          className="text-sm text-zinc-400 disabled:opacity-40"
        >
          ← Continuar ruta
        </button>

        <span className="text-xs tracking-widest text-zinc-500 uppercase">
          Captura de recuerdo
        </span>
      </div>

      <div className="flex-1 bg-zinc-900 rounded-2xl my-6 flex flex-col items-center justify-center border border-zinc-800 shadow-inner px-6 text-center">
        <span className="text-4xl mb-4">📷</span>

        <p className="text-sm text-zinc-300">
          Toma una fotografía del momento.
        </p>

        <p className="text-xs text-zinc-600 mt-2">
          I.GUIDE guardará la foto junto con tu ubicación real.
        </p>

        {errorMessage && (
          <p className="mt-5 text-sm text-red-400">
            {errorMessage}
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelected}
        style={{ display: "none" }}
      />

      <div className="flex flex-col items-center gap-4 pb-4">
        <button
          type="button"
          onClick={openNativeCamera}
          disabled={isSaving}
          aria-label="Abrir cámara"
          className="w-20 h-20 rounded-full bg-white border-[6px] border-zinc-800 active:scale-90 transition-transform shadow-lg disabled:opacity-50"
        />

        <span className="text-xs text-zinc-500">
          {isSaving
            ? "Guardando recuerdo..."
            : "Pulsa para abrir la cámara"}
        </span>
      </div>
    </div>
  );
}