import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useJourney,
} from "../../context/JourneyContext";

import {
  getJourneyStats,
  loadTrack,
} from "../../engine/trackingEngine";

import {
  MemoryCardEngine,
} from "../../engine/memoryCardEngine";

import type {
  MemoryCardData,
} from "../../types/memoryCard";

import JourneyCompletedView from "./JourneyCompletedView";
import JourneyAbortedView from "./JourneyAbortedView";
import {
  CameraView,
} from "./CameraView";
import {
  PointSavedView,
} from "./PointSavedView";

import HospesBanner from "../hospes/HospesBanner";
import ExpeditionMap from "../ExpeditionMap";
import MemoryCardModal from "../sharing/MemoryCardModal";

import {
  getHospesMessage,
} from "../../engine/hospesContextEngine";
import { tx } from "../../i18n";

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
    return tx("Calculando");
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
    confirmArrival,
  } = useJourney();

  const [
    isConfirmingArrival,
    setIsConfirmingArrival,
  ] = useState(false);

  const [
    arrivalMessage,
    setArrivalMessage,
  ] = useState<string | null>(
    null
  );

  const [
    routeCard,
    setRouteCard,
  ] = useState<MemoryCardData | null>(
    null
  );

  const [
    routeShareMessage,
    setRouteShareMessage,
  ] = useState<string | null>(
    null
  );

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
        experience
          .arrivalLatitude ??
          experience.latitude,
        experience
          .arrivalLongitude ??
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

  const manualArrivalRadius =
    journey.experience
      ?.manualCertificationRadiusMeters ??
    journey.experience
      ?.certificationRadiusMeters ??
    25;

  const canConfirmArrival =
    journey.startedAt !== null &&
    distanceToTargetMeters !== null &&
    distanceToTargetMeters <=
      manualArrivalRadius;

  const hospesBannerMessage =
    useMemo(() => {
      const experience =
        journey.experience;

      if (
        experience &&
        journey.startedAt === null
      ) {
        return {
          title: tx("HOSPES · MISIÓN EN MARCHA"),
          message:
            tx(
              "Perfecto. Comenzamos la ruta hacia {{title}}. Estoy ubicándote para crear el Punto 0; el timeline empezará a registrar tu recorrido en unos segundos.",
              { title: experience.title }
            ),
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
          title: tx("Misión iniciada"),
          message:
            tx(
              "Punto 0 registrado. {{title}} está a aproximadamente {{minutes}} min caminando.",
              {
                title: experience.title,
                minutes: estimatedWalkingMinutes,
              }
            ) + " " +
            (experience.description ??
              tx("Hospes te acompañará hasta la llegada.")),
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

  const noriState =
    journey.startedAt === null
      ? "locating"
      : journey.timeline.length <= 1
        ? "mission-start"
        : "idle";

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
        tx("¿Deseas abandonar definitivamente esta misión?\n\nLa ruta registrada permanecerá guardada en tu historial.")
      );

    if (!confirmed) {
      return;
    }

    abandonJourney();
  }

  function handleShareRoute() {
    setRouteShareMessage(null);

    const experience =
      journey.experience;

    if (!experience) {
      return;
    }

    const track = loadTrack(
      experience.experienceId
    );

    if (
      !track ||
      track.timeline.length === 0
    ) {
      setRouteShareMessage(
        tx("El recorrido todavía está esperando el primer punto GPS.")
      );
      return;
    }

    const lastPoint =
      track.timeline[
        track.timeline.length - 1
      ];

    setRouteCard(
      MemoryCardEngine.build(
        experience,
        track,
        {
          includePhoto: false,
          lat: lastPoint.lat,
          lng: lastPoint.lng,
        }
      )
    );
  }

  async function handleConfirmArrival() {
    setIsConfirmingArrival(true);
    setArrivalMessage(null);

    const result =
      await confirmArrival();

    if (!result.success) {
      setArrivalMessage(
        result.message
      );
      setIsConfirmingArrival(
        false
      );
    }
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
            ← {tx("Inicio")}
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
            {tx("Misión activa")}
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
              {tx("Explorando")}
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
                tx("Destino")}
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
              {tx("eventos registrados")}
            </p>
          </section>

          {journey.experience && (
            <ExpeditionMap
              expedition={
                journey.experience
              }
              track={null}
              onSelectShare={() => {}}
              onCaptureMemory={
                openCamera
              }
            />
          )}

          <HospesBanner
            message={
              hospesBannerMessage
            }
            noriState={noriState}
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
                  ? tx("Preparando Punto 0…")
                  : tx("Timeline en vivo")}
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
                  ? tx("Esperando la primera ubicación GPS")
                  : tx("{{count}} eventos registrados durante la ruta", { count: journey.timeline.length })}
              </span>
            </div>
          </section>

          {canConfirmArrival && (
            <section
              style={{
                display: "grid",
                gap: "8px",
                padding: "13px",
                borderRadius: "16px",
                border:
                  "1px solid rgba(57,231,255,0.28)",
                background:
                  "rgba(57,231,255,0.07)",
              }}
            >
              <strong
                style={{
                  color: CYAN,
                  fontSize: "12px",
                }}
              >
                {tx("¿Ya estás en {{title}}?", { title: journey.experience?.title })}
              </strong>

              <span
                style={{
                  color:
                    "rgba(255,255,255,0.62)",
                  fontSize: "10px",
                  lineHeight: 1.4,
                }}
              >
                {tx("Si el pin comercial está desplazado, confirma tu llegada con la ubicación GPS actual.")}
              </span>

              <button
                type="button"
                onClick={() => {
                  void handleConfirmArrival();
                }}
                disabled={
                  isConfirmingArrival
                }
                style={primaryButtonStyle}
              >
                {isConfirmingArrival
                  ? tx("Confirmando GPS…")
                  : tx("📍 Estoy aquí · confirmar llegada")}
              </button>

              {arrivalMessage && (
                <span
                  role="alert"
                  style={{
                    color: "#FFB15C",
                    fontSize: "10px",
                  }}
                >
                  {arrivalMessage}
                </span>
              )}
            </section>
          )}

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "9px",
            }}
          >
            <Metric
              label={tx("Tiempo")}
              value={`${durationMinutes} min`}
            />

            <Metric
              label={tx("Recorrido")}
              value={`${(
                stats
                  ?.totalDistanceKm ??
                0
              ).toFixed(2)} km`}
            />

            <Metric
              label={tx("Destino")}
              value={formatDistance(
                distanceToTargetMeters
              )}
              accent
            />
          </section>

          <button
            type="button"
            onClick={handleShareRoute}
            style={primaryButtonStyle}
          >
            {tx("Compartir recorrido")}
          </button>

          {routeShareMessage && (
            <p
              role="status"
              style={{
                margin: "-8px 4px 0",
                color: "#FFB15C",
                fontSize: "11px",
                textAlign: "center",
              }}
            >
              {routeShareMessage}
            </p>
          )}

          <button
            type="button"
            onClick={
              handleReturnToExperience
            }
            style={secondaryButtonStyle}
          >
            {tx("Ver información del destino")}
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            style={secondaryButtonStyle}
          >
            {tx("Ir a Inicio · mantener misión")}
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
            {tx("Abandonar misión")}
          </button>
        </main>

        <MemoryCardModal
          open={routeCard !== null}
          data={routeCard}
          onClose={() =>
            setRouteCard(null)
          }
          closeLabel={tx("Volver a la misión")}
        />
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

    case "aborted":
      return (
        <JourneyAbortedView />
      );

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
