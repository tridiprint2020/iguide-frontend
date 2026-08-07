import {
  useMemo,
  useRef,
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
} from "../../engine/trackingEngine";

import MemoryCard from "../MemoryCard";
import ShareDrawer from "../sharing/ShareDrawer";
import {
  shareEngine,
} from "../../engine/shareEngine";
import HospesBanner from "../hospes/HospesBanner";

import {
  getHospesMessage,
} from "../../engine/hospesContextEngine";

import type {
  Experience,
} from "../../types/experience/experience";

export default function JourneyCompletedView() {
  const {
    journey,
    resetToHome,
  } = useJourney();

  const navigate =
    useNavigate();

  const [
    shareOpen,
    setShareOpen,
  ] = useState(false);

  const memoryCardRef =
    useRef<HTMLElement | null>(
      null
    );

  const activeExperience =
    journey.experience as
      | Experience
      | null;

  const stats = useMemo(() => {
    if (
      !journey.startedAt ||
      !journey.timeline
    ) {
      return null;
    }

    return getJourneyStats(
      journey.timeline,
      journey.startedAt
    );
  }, [
    journey.startedAt,
    journey.timeline,
  ]);

  const lastPhoto =
    stats?.lastPhoto;

  const lastNote =
    stats?.lastNote ?? "";

  const hospesBannerMessage =
    getHospesMessage({
      screen: "completed",
      experience:
        journey.experience,
      timeline:
        journey.timeline,
      rewardXp: 150,
    });

  const memoryData = {
    experienceId:
      activeExperience?.experienceId,

    title:
      activeExperience?.title ??
      "Destino",

    placeLabel:
      activeExperience?.title ??
      "Lugar visitado",

    city:
      activeExperience?.city ??
      "Huancayo",

    date:
      new Date().toLocaleDateString(
        "es-PE"
      ),

    photo: lastPhoto,

    /*
     * Solo mostramos como protagonista
     * una nota escrita realmente por el usuario.
     * No inyectamos frases automáticas largas.
     */
    note: lastNote,

    primaryInterest:
      activeExperience?.interests?.[0],

    lat:
      activeExperience?.latitude,

    lng:
      activeExperience?.longitude,

    waypoints:
      journey.timeline ?? [],

    stats:
      stats ?? {
        totalPhotos: 0,
        totalNotes: 0,
        totalMemories: 0,
        totalDistanceKm: 0,
        durationSeconds: 0,
      },

    mapBackground: {
      center: [
        activeExperience
          ?.latitude ?? 0,
        activeExperience
          ?.longitude ?? 0,
      ] as [number, number],

      path: (
        journey.timeline ?? []
      )
        .filter(
          (item) =>
            item.type !== "memory"
        )
        .map(
          (item) =>
            [
              item.lat,
              item.lng,
            ] as [number, number]
        ),

      memories: (
        journey.timeline ?? []
      ).filter(
        (item) =>
          item.type === "memory"
      ),
    },
  };

  async function handleDownload() {
    await shareEngine.downloadImage(
      memoryData,
      memoryCardRef.current
    );
  }

  async function handleNativeShare() {
    await shareEngine.shareMemory(
      memoryData,
      memoryCardRef.current
    );
  }

  async function handleCopyLink() {
    await shareEngine.copyShareText(
      memoryData
    );
  }

  function handleReturnToExplorer() {
    /*
     * La expedición ya fue completada.
     * Limpiamos la vista activa y regresamos
     * al catálogo, conservando el historial.
     */
    resetToHome();
    navigate("/explorer");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "#090909",
        padding:
          "20px 16px 42px",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            color: "#41E28A",
            fontWeight: 800,
            marginBottom: "10px",
            fontSize: "13px",
          }}
        >
          ✓ Expedición completada
        </div>

        <HospesBanner
          message={
            hospesBannerMessage
          }
        />

        <h1
          style={{
            margin:
              "22px 0 8px",
            color: "#FFFFFF",
            fontSize:
              "clamp(1.8rem, 7vw, 2.4rem)",
            lineHeight: 1.08,
          }}
        >
          ¡Aventura finalizada!
        </h1>

        <p
          style={{
            margin:
              "0 0 20px",
            color:
              "rgba(255,255,255,0.68)",
            lineHeight: 1.55,
            fontSize: "13px",
          }}
        >
          Tu recorrido, recuerdos y
          llegada quedaron guardados.
        </p>

        {/* Resumen único, sin repetir dentro y fuera varias veces */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <Metric
            label="Distancia"
            value={`${(
              stats?.totalDistanceKm ??
              0
            ).toFixed(2)} km`}
          />

          <Metric
            label="Tiempo"
            value={formatDuration(
              stats?.durationSeconds ??
                0
            )}
          />

          <Metric
            label="Hitos"
            value={`${
              stats?.totalMemories ??
              0
            } 🔮`}
          />
        </section>

        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
          }}
        >
          <MemoryCard
            ref={memoryCardRef}
            data={memoryData}
            onShare={() =>
              setShareOpen(true)
            }
            onDownload={
              handleDownload
            }
          />
        </div>

        {lastNote && (
          <section
            style={{
              marginTop: "16px",
              padding: "15px",
              borderRadius: "15px",
              background:
                "rgba(255,255,255,0.04)",
              border:
                "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#FF00FF",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing:
                  "0.08em",
                textTransform:
                  "uppercase",
              }}
            >
              Tu nota
            </span>

            <p
              style={{
                margin: 0,
                color:
                  "rgba(255,255,255,0.82)",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              “{lastNote}”
            </p>
          </section>
        )}

        {/*
         * Ya no repetimos:
         * - Compartir aventura completa
         * - Compartir descubrimiento
         * - O comparte este descubrimiento
         *
         * La MemoryCard contiene los únicos
         * botones Compartir y Descargar.
         */}
        <button
          type="button"
          onClick={
            handleReturnToExplorer
          }
          style={{
            width: "100%",
            minHeight: "52px",
            marginTop: "20px",
            borderRadius: "14px",
            border:
              "1px solid rgba(255,255,255,0.12)",
            background: "#111111",
            color: "#FFFFFF",
            fontWeight: 750,
            cursor: "pointer",
          }}
        >
          Explorar otro lugar →
        </button>
      </div>

      <ShareDrawer
        open={shareOpen}
        onClose={() =>
          setShareOpen(false)
        }
        onShare={
          handleNativeShare
        }
        onDownload={
          handleDownload
        }
        onCopyLink={
          handleCopyLink
        }
      />
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({
  label,
  value,
}: MetricProps) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: "12px 6px",
        borderRadius: "13px",
        backgroundColor:
          "#141414",
        border:
          "1px solid rgba(255,255,255,0.05)",
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "block",
          color:
            "rgba(255,255,255,0.42)",
          fontSize: "8px",
          fontWeight: 700,
          textTransform:
            "uppercase",
          letterSpacing:
            "0.05em",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: "5px",
          color: "#FFFFFF",
          fontSize:
            "clamp(11px, 3.4vw, 14px)",
          fontFamily:
            "monospace",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function formatDuration(
  totalSeconds: number
): string {
  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60
    );

  const seconds =
    totalSeconds % 60;

  const pad = (
    value: number
  ) =>
    String(value).padStart(
      2,
      "0"
    );

  return `${pad(hours)}:${pad(
    minutes
  )}:${pad(seconds)}`;
}
