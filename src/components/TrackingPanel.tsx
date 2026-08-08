import { useRef, useState } from "react";
import {
  startNewTrack,
  addPointToTrack,
  addMemoryToTrack,
  addFinishPoint,
  completeTrack,
  loadTrack,
  createStartPoint,
  canCompleteJourney,
} from "../engine/trackingEngine";
import { completeExpedition } from "../data/user";
import { getProximityHint } from "../engine/noriEngine";
import type { ExpeditionTrack } from "../types/tracking/tracking";
import { Theme } from "../styles/theme";
import { useJourney } from "../context/JourneyContext";
import { useNavigate } from "react-router-dom";
import { tx } from "../i18n";

type Props = {
  experienceId: string;
  track: ExpeditionTrack | null;
  onUpdate: (track: ExpeditionTrack | null) => void;
  targetLat?: number;
  targetLng?: number;
};

function TrackingPanel({
  experienceId,
  track,
  onUpdate,
  targetLat,
  targetLng,
}: Props) {
  // ✅ REGLA DE REACT: Los hooks se declaran aquí en la raíz, consumiendo resetToHome unificado
  const navigate = useNavigate();
const {
  completeJourney,
  abandonJourney,
} = useJourney();
  const [invalidCompletion, setInvalidCompletion] = useState({ open: false, message: "" });

  // Constante derivada pura alineada a la Adenda 11.B
  const isTracking = track !== null && !track.completedAt;

  const [note, setNote] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [noriHint, setNoriHint] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);


  const handleStart = () => {
    if (!navigator.geolocation) {
      alert(tx("Tu navegador no soporta GPS."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const newTrack = startNewTrack(experienceId);
        onUpdate(newTrack);

        createStartPoint(experienceId, latitude, longitude);
        onUpdate(loadTrack(experienceId));

        watchId.current = navigator.geolocation.watchPosition(
          (watchPosition) => {
            const { latitude: wLat, longitude: wLng } = watchPosition.coords;

            addPointToTrack(experienceId, {
              lat: wLat,
              lng: wLng,
              timestamp: Date.now(),
              type: "walk",
            });
            onUpdate(loadTrack(experienceId));

            if (targetLat !== undefined && targetLng !== undefined) {
              setNoriHint(getProximityHint(wLat, wLng, targetLat, targetLng));
            }
          },
          (error) => console.error(error),
          { enableHighAccuracy: true }
        );
      },
      (error) => {
        console.error("Error al obtener la ubicación inicial:", error);
        alert(tx("No se pudo acceder a tu ubicación para iniciar el recorrido."));
      },
      { enableHighAccuracy: true }
    );
  };

    const handleFinish = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    // ✅ REGLA 23: El dominio decide la realidad, la interfaz solo la comunica
    const validation = canCompleteJourney(experienceId);

    if (!validation.success) {
      setInvalidCompletion({
        open: true,
        message: validation.message,
      });
      return;
    }

    // Si el motor da luz verde, capturamos asíncronamente las coordenadas de llegada reales
    navigator.geolocation.getCurrentPosition(
      (position) => {
        addPointToTrack(experienceId, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          type: "finish",
        });

addFinishPoint(
  experienceId,
  position.coords.latitude,
  position.coords.longitude
);

const validation = canCompleteJourney(experienceId);

if (!validation.success) {
  setInvalidCompletion({
    open: true,
    message: validation.message,
  });
  return;
}

completeTrack(experienceId);
        completeExpedition(experienceId, 150);
        completeJourney(); 
        onUpdate(loadTrack(experienceId));
      },
      (error) => {
        console.error("Error al fijar hito de llegada:", error);
        // Fallback reglamentario inyectando ceros para no colgar el renderizado
setInvalidCompletion({
  open: true,
  message:
    tx("No se pudo obtener tu ubicación para validar la llegada. Activa el GPS e inténtalo nuevamente."),
});
        completeExpedition(experienceId, 150);
        completeJourney();
        onUpdate(loadTrack(experienceId));
      },
      { enableHighAccuracy: true }
    );
  };


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

    const handleAddMemory = () => {
    if (!navigator.geolocation) return;

    // 🧼 FEEDBACK INMEDIATO MÓVIL: Limpiamos la interfaz visual al instante del toque
    const noteToSave = note;
    const photoToSave = photoBase64;
    setNote("");
    setPhotoBase64(null);
    alert(`📍 ${tx("¡Hito registrado por Hospes! Guardando coordenadas en tu Timeline...")}`);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        addMemoryToTrack(experienceId, {
          lat: latitude,
          lng: longitude,
          note: noteToSave || undefined,
          photo: photoToSave || undefined,
        });

        // Despachamos una referencia profundamente nueva al mapa para que pinte el hito en caliente
        const freshTrack = loadTrack(experienceId);
        onUpdate(freshTrack ? { ...freshTrack } : null);
      },
      (error) => console.error("Error al capturar GPS para el recuerdo:", error),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };
return (
    <div
      style={{
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radius.medium,
        padding: Theme.Space.md,
        marginTop: Theme.Space.md,
        color: Theme.Colors.text,
      }}
    >
      {!isTracking && !track?.completedAt && (
        <button
          className="ig-hover"
          onClick={handleStart}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: Theme.Radius.medium,
            border: "none",
            backgroundColor: Theme.Colors.primary,
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🧭 {tx("Iniciar recorrido")}
        </button>
      )}

      {isTracking && (
        <>
          <p style={{ fontSize: "13px", color: Theme.Colors.textSoft }}>
            {/* ✅ Regla 13: El Timeline unificado almacena eventos semánticos completos */}
            {tx("Grabando recorrido...")} {track?.timeline.length ?? 0} {tx("eventos registrados.")}
          </p>


          {noriHint && (
            <div
              style={{
                backgroundColor: "#fff",
                color: "#1A202C",
                borderLeft: `4px solid ${Theme.Colors.secondary}`,
                borderRadius: Theme.Radius.medium,
                padding: "10px 14px",
                marginBottom: Theme.Space.sm,
                fontSize: "13px",
              }}
            >
              {tx(noriHint)}
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={tx("¿Qué está ocurriendo en este lugar?")}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: Theme.Radius.small,
              border: `1px solid ${Theme.Colors.textSoft}44`,
              backgroundColor: Theme.Colors.background,
              color: Theme.Colors.text,
              marginBottom: Theme.Space.sm,
              boxSizing: "border-box",
            }}
          />

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ marginBottom: Theme.Space.sm }}
          />
          <button
            className="ig-hover"
            // ✅ CORREGIDO: Enlace legítimo a la función multimedia del Core
            onClick={handleAddMemory} 
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: Theme.Radius.medium,
              border: `1px solid ${Theme.Colors.secondary}`,
              backgroundColor: "transparent",
              color: Theme.Colors.secondary,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: Theme.Space.sm,
            }}
          >
            📍 {tx("Guardar recuerdo")}
          </button>

          <button
            className="ig-hover"
            onClick={handleFinish}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: Theme.Radius.medium,
              border: "none",
              backgroundColor: Theme.Colors.secondary,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ✔️ {tx("Finalizar recorrido")}
          </button>
        </>
      )}

      {track?.completedAt && (
        <p style={{ color: Theme.Colors.secondary, fontWeight: 600 }}>
          {/* ✅ Regla 14: UI derivada directo de la longitud del Timeline Core */}
          ✔️ {tx("Recorrido completado")} — {track.timeline.filter(item => item.type === "memory").length} {tx("recuerdos guardados.")}
        </p>
      )}

      {/* =======================================================================
          🪟 INTERFAZ DE CONTROL: MODAL DE ADVERTENCIA ATENTO DE HOSPES (REGLA 22 Y 23)
          ======================================================================= */}
      {invalidCompletion.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(6, 6, 6, 0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999,
            padding: "24px",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              backgroundColor: "#1C1C1E",
              borderRadius: "24px",
              padding: "24px",
              maxWidth: "340px",
              width: "100%",
              textAlign: "center",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          >
            <div style={{ fontSize: "38px", marginBottom: "12px" }}>🧭</div>
            
            <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, margin: "0 0 10px 0" }}>
              {tx("La expedición aún no puede finalizar")}
            </h3>
            
            <p style={{ color: "#A0A0A0", fontSize: "13px", lineHeight: 1.5, margin: "0 0 24px 0" }}>
              {invalidCompletion.message}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => setInvalidCompletion({ open: false, message: "" })}
                style={{ height: "46px", borderRadius: "12px", border: "none", backgroundColor: Theme.Colors.primary, color: "#FFFFFF", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
              >
                🥾 {tx("Continuar explorando")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setInvalidCompletion({
                    open: false,
                    message: "",
                  });

                  abandonJourney();
                  navigate("/explorer");
                }}
                style={{
                  height: "46px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,138,0,0.35)",
                  backgroundColor: "rgba(255,138,0,0.10)",
                  color: "#FFB15C",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                ⛔ {tx("Abandonar definitivamente")}
              </button>
           
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


export default TrackingPanel;
//
