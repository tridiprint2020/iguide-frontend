import {
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  House,
  Loader2,
  MapPin,
} from "lucide-react";

import {
  saveReturnPoint,
} from "../engine/returnPointEngine";
import { tx } from "../i18n";

type ReturnPointOnboardingModalProps = {
  onComplete: () => void;
};

function ReturnPointOnboardingModal({
  onComplete,
}: ReturnPointOnboardingModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const completionTimerRef = useRef<number | null>(null);

  function handleSaveCurrentLocation() {
    if (isSaving || saved) {
      return;
    }

    if (!navigator.geolocation) {
      setErrorMessage(
        tx("Este dispositivo no permite obtener tu ubicación.")
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveReturnPoint(
          position.coords.latitude,
          position.coords.longitude,
          tx("Mi hotel / punto de descanso")
        );

        setIsSaving(false);
        setSaved(true);

        completionTimerRef.current = window.setTimeout(
          onComplete,
          900
        );
      },
      () => {
        setIsSaving(false);
        setErrorMessage(
          tx("No pude leer tu ubicación. Activa el GPS y vuelve a intentarlo.")
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-point-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100000,
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box",
        padding: "22px",
        overflowY: "auto",
        background: "rgba(3,4,12,0.90)",
        backdropFilter: "blur(14px)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "410px",
          boxSizing: "border-box",
          padding: "28px 24px 24px",
          borderRadius: "28px",
          border: "1px solid rgba(66,232,245,0.28)",
          background:
            "radial-gradient(circle at 90% 8%, rgba(66,232,245,0.15), transparent 34%), radial-gradient(circle at 10% 100%, rgba(255,61,232,0.14), transparent 34%), linear-gradient(145deg, rgba(24,25,47,0.99), rgba(8,9,18,0.99))",
          boxShadow:
            "0 30px 90px rgba(0,0,0,0.66), 0 0 38px rgba(66,232,245,0.10)",
          color: "#FFFFFF",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            width: "74px",
            height: "74px",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 18px",
            borderRadius: "24px",
            border: "1px solid rgba(66,232,245,0.34)",
            background: "rgba(66,232,245,0.09)",
            color: "#42E8F5",
          }}
        >
          {saved ? <CheckCircle2 size={36} /> : <House size={35} />}
          {!saved && (
            <MapPin
              size={17}
              color="#FF3DE8"
              style={{ position: "absolute", right: "6px", top: "6px" }}
            />
          )}
        </div>

        <span
          style={{
            color: "#42E8F5",
            fontSize: "10px",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {tx("Tu punto seguro")}
        </span>

        <h2
          id="return-point-title"
          style={{
            margin: "8px 0 12px",
            fontSize: "26px",
            lineHeight: 1.12,
            letterSpacing: "-0.035em",
          }}
        >
          {saved
            ? tx("¡Punto de descanso guardado!")
            : tx("¿Quieres guardar tu ubicación de partida como punto de descanso?")}
        </h2>

        <p
          style={{
            margin: "0 auto 22px",
            maxWidth: "320px",
            color: "rgba(255,255,255,0.68)",
            fontSize: "12px",
            lineHeight: 1.55,
          }}
        >
          {saved
            ? tx("La casita permanecerá en tu mapa para ayudarte a regresar.")
            : tx("Puede ser tu hotel, alojamiento o lugar de partida. Si te pierdes o olvidas el nombre, I.GUIDE te ayudará a volver.")}
        </p>

        {errorMessage && (
          <p
            role="alert"
            style={{
              margin: "0 0 12px",
              padding: "10px 12px",
              borderRadius: "12px",
              border: "1px solid rgba(255,90,90,0.30)",
              background: "rgba(90,12,24,0.72)",
              color: "#FFD4D4",
              fontSize: "11px",
              lineHeight: 1.4,
            }}
          >
            {errorMessage}
          </p>
        )}

        {!saved && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.45fr) minmax(0, 0.8fr)",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={handleSaveCurrentLocation}
              disabled={isSaving}
              style={{
                minHeight: "52px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                border: "none",
                borderRadius: "15px",
                background: "linear-gradient(145deg, #42E8F5, #00BFD1)",
                color: "#061014",
                fontSize: "12px",
                fontWeight: 900,
                cursor: isSaving ? "wait" : "pointer",
                opacity: isSaving ? 0.65 : 1,
              }}
            >
              {isSaving ? <Loader2 size={18} /> : <MapPin size={18} />}
              {isSaving ? tx("Guardando…") : tx("Sí, guardar ubicación")}
            </button>

            <button
              type="button"
              onClick={onComplete}
              disabled={isSaving}
              style={{
                minHeight: "52px",
                borderRadius: "15px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.72)",
                fontSize: "11px",
                fontWeight: 800,
                cursor: isSaving ? "default" : "pointer",
              }}
            >
              {tx("Ahora no")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default ReturnPointOnboardingModal;
