import {
  useMemo,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useJourney,
} from "../../context/JourneyContext";

import {
  getJourneyStats,
} from "../../engine/trackingEngine";

import JourneyCompletedView from "./JourneyCompletedView";
import {
  CameraView,
} from "./CameraView";
import {
  PointSavedView,
} from "./PointSavedView";

import HospesBanner from "../hospes/HospesBanner";

import {
  getHospesMessage,
} from "../../engine/hospesContextEngine";

const MAGENTA = "#FF00FF";
const CYAN = "#39E7FF";

function distanceInMeters(
  firstLat: number,
  firstLng: number,
  secondLat: number,
  secondLng: number
): number {
  const earthRadius = 6371000;
  const toRadians =
    (value: number) =>
      (value * Math.PI) / 180;

  const deltaLat = toRadians(
    secondLat - firstLat
  );
  const deltaLng = toRadians(
    secondLng - firstLng
  );

  const firstLatitude =
    toRadians(firstLat);
  const secondLatitude =
    toRadians(secondLat);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(deltaLng / 2) ** 2;

  return (
    earthRadius *
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    )
  );
}

function formatDistance(
  meters: number | null
): string {
  if (meters === null) {
    return "Calculando";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

export function WalkingView() {
  const navigate =
    useNavigate();

  const {
    journey,
    openCamera,
    abandonJourney,
  } = useJourney();

  const stats =
    journey.startedAt !== null
      ? getJourneyStats(
          journey.timeline,
          journey.startedAt
        )
      : null;

  const durationMinutes =
    Math.floor(
      (stats?.durationSeconds ?? 0) /
        60
    );

  const distanceToTargetMeters =
    useMemo(() => {
      const experience =
        journey.experience;

      if (!experience) {
        return null;
      }

      const lastLocation =
        [...journey.timeline]
          .reverse()
          .find(
            (item) =>
              item.type === "start" ||
              item.type === "walk" ||
              item.type === "memory" ||
              item.type === "finish"
          );

      if (!lastLocation) {
        return null;
      }

      return distanceInMeters(
        lastLocation.lat,
        lastLocation.lng,
        experience.latitude,
        experience.longitude
      );
    }, [
      journey.experience,
      journey.timeline,
    ]);

  const estimatedWalkingMinutes =
    distanceToTargetMeters === null
      ? null
      : Math.max(
          1,
          Math.ceil(
            distanceToTargetMeters / 70
          )
        );

  const hospesBannerMessage =
    useMemo(() => {
      const experience =
        journey.experience;

      if (
        experience &&
        journey.startedAt === null
      ) {
        return {
          title: "HOSPES · MISIÓN EN MARCHA",
          message:
            `Perfecto. Comenzamos la ruta hacia ${experience.title}. ` +
            "Estoy ubicándote para crear el Punto 0; el timeline empezará a registrar tu recorrido en unos segundos.",
          icon: "✦",
          color: MAGENTA,
          tone: "brand" as const,
        };
      }

      if (
        experience &&
        journey.timeline.length <= 1 &&
        estimatedWalkingMinutes !== null
      ) {
        return {
          title: "Misión iniciada",
          message:
            `Punto 0 registrado. ${experience.title} está a aproximadamente ${estimatedWalkingMinutes} min caminando. ` +
            (experience.description ??
              "Hospes te acompañará hasta la llegada."),
          icon: "✦",
          color: MAGENTA,
          tone: "brand" as const,
        };
      }

      return getHospesMessage({
        screen: "walking",
        experience,
        timeline:
          journey.timeline,
        distanceToTargetMeters:
          distanceToTargetMeters ??
          undefined,
      });
    }, [
      journey.experience,
      journey.startedAt,
      journey.timeline,
      distanceToTargetMeters,
      estimatedWalkingMinutes,
    ]);

  function handleGoHome() {
    navigate("/");
  }

  function handleReturnToExperience() {
    const experience =
      journey.experience;

    if (!experience) {
      return;
    }

    navigate(
      `/expedition/${experience.slug}`
    );
  }

  function handleAbandon() {
    const confirmed =
      window.confirm(
        "¿Deseas abandonar definitivamente esta misión?\n\nLa ruta registrada permanecerá guardada en tu historial."
      );

    if (!confirmed) {
      return;
    }

    abandonJourney();
    navigate("/explorer");
  }

  function WalkingUI() {
    return (
      <div
        style={{
          minHeight: "100dvh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,0,255,0.10), transparent 34%), #0B0C14",
          color: "#FFFFFF",
          padding:
            "max(14px, env(safe-area-inset-top)) 16px max(22px, env(safe-area-inset-bottom))",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "12px",
            maxWidth: "680px",
            width: "100%",
            margin: "0 auto 18px",
          }}
        >
          <button
            type="button"
            onClick={handleGoHome}
            style={{
              minHeight: "42px",
              padding: "9px 13px",
              borderRadius: "13px",
              border:
                "1px solid rgba(255,255,255,0.11)",
              background:
                "rgba(255,255,255,0.05)",
              color: "#FFFFFF",
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            ← Inicio
          </button>

          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: MAGENTA,
              fontSize: "12px",
              fontWeight: 850,
              letterSpacing:
                "0.06em",
              textTransform:
                "uppercase",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor:
                  MAGENTA,
                boxShadow:
                  "0 0 15px rgba(255,0,255,0.92)",
              }}
            />
            Misión activa
          </span>
        </header>

        <main
          style={{
            width: "100%",
            maxWidth: "680px",
            margin: "0 auto",
            display: "grid",
            gap: "16px",
          }}
        >
          <section
            style={{
              textAlign: "center",
              padding: "4px 8px",
            }}
          >
            <p
              style={{
                margin: 0,
                color:
                  "rgba(255,255,255,0.52)",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing:
                  "0.18em",
                textTransform:
                  "uppercase",
              }}
            >
              Explorando
            </p>

            <h1
              style={{
                margin: "7px 0 0",
                color: "#FFFFFF",
                fontSize:
                  "clamp(2rem, 9vw, 3.2rem)",
                lineHeight: 1.04,
              }}
            >
              {journey.experience
                ?.title ??
                "Destino"}
            </h1>

            <p
              style={{
                margin: "9px 0 0",
                color: CYAN,
                fontSize: "12px",
                fontWeight: 750,
              }}
            >
              {journey.timeline.length}{" "}
              eventos registrados
            </p>
          </section>

          <HospesBanner
            message={
              hospesBannerMessage
            }
          />

          <section
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "13px 14px",
              borderRadius: "16px",
              border:
                "1px solid rgba(255,0,255,0.20)",
              background:
                "rgba(255,0,255,0.055)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "12px",
                height: "12px",
                flex: "0 0 auto",
                borderRadius: "50%",
                backgroundColor:
                  MAGENTA,
                boxShadow:
                  "0 0 15px rgba(255,0,255,0.92)",
              }}
            />

            <div>
              <strong
                style={{
                  display: "block",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
              >
                {journey.startedAt === null
                  ? "Preparando Punto 0…"
                  : "Timeline en vivo"}
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: "3px",
                  color:
                    "rgba(255,255,255,0.58)",
                  fontSize: "10px",
                }}
              >
                {journey.startedAt === null
                  ? "Esperando la primera ubicación GPS"
                  : `${journey.timeline.length} eventos registrados durante la ruta`}
              </span>
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "9px",
            }}
          >
            <Metric
              label="Tiempo"
              value={`${durationMinutes} min`}
            />

            <Metric
              label="Recorrido"
              value={`${(
                stats
                  ?.totalDistanceKm ??
                0
              ).toFixed(2)} km`}
            />

            <Metric
              label="Destino"
              value={formatDistance(
                distanceToTargetMeters
              )}
              accent
            />
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "10px",
              paddingTop: "4px",
            }}
          >
            <button
              type="button"
              onClick={openCamera}
              style={primaryButtonStyle}
            >
              📸 Guardar recuerdo
            </button>

            <button
              type="button"
              onClick={
                handleReturnToExperience
              }
              style={secondaryButtonStyle}
            >
              🧭 Ver destino y mapa
            </button>
          </section>

          <button
            type="button"
            onClick={handleGoHome}
            style={secondaryButtonStyle}
          >
            Ir a Inicio · mantener misión
          </button>

          <button
            type="button"
            onClick={handleAbandon}
            style={{
              ...secondaryButtonStyle,
              color: "#FF9A52",
              border:
                "1px solid rgba(255,138,0,0.28)",
              background:
                "rgba(255,138,0,0.07)",
            }}
          >
            Abandonar misión
          </button>
        </main>
      </div>
    );
  }

  switch (journey.screen) {
    case "walking":
      return <WalkingUI />;

    case "camera":
      return <CameraView />;

    case "pointSaved":
      return <PointSavedView />;

    case "completed":
      return (
        <JourneyCompletedView />
      );

    case "idle":
    default:
      return null;
  }
}

const primaryButtonStyle = {
  minHeight: "52px",
  padding: "12px 14px",
  borderRadius: "16px",
  border: "none",
  background:
    "linear-gradient(135deg, #FF36E4, #E0009D)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 850,
  boxShadow:
    "0 10px 26px rgba(255,0,184,0.25)",
  cursor: "pointer",
} as const;

const secondaryButtonStyle = {
  minHeight: "50px",
  padding: "11px 13px",
  borderRadius: "16px",
  border:
    "1px solid rgba(255,255,255,0.11)",
  background:
    "rgba(255,255,255,0.045)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 750,
  cursor: "pointer",
} as const;

type MetricProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function Metric({
  label,
  value,
  accent = false,
}: MetricProps) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: "12px 8px",
        borderRadius: "16px",
        background:
          "rgba(255,255,255,0.045)",
        border: accent
          ? "1px solid rgba(57,231,255,0.25)"
          : "1px solid rgba(255,255,255,0.06)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          color:
            "rgba(255,255,255,0.48)",
          fontSize: "9px",
          fontWeight: 750,
          textTransform:
            "uppercase",
          letterSpacing:
            "0.05em",
        }}
      >
        {label}
      </p>

      <strong
        style={{
          display: "block",
          marginTop: "6px",
          color: accent
            ? CYAN
            : "#FFFFFF",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "13px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </strong>
    </div>
  );
}
