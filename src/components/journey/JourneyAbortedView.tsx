import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Compass,
  House,
} from "lucide-react";

import {
  useJourney,
} from "../../context/JourneyContext";

import {
  getJourneyStats,
} from "../../engine/trackingEngine";

import {
  getHospesMessage,
} from "../../engine/hospesContextEngine";

import {
  shareEngine,
} from "../../engine/shareEngine";

import type {
  MemoryCardData,
} from "../../types/memoryCard";

import HospesBanner from "../hospes/HospesBanner";
import MemoryCard from "../MemoryCard";
import ShareDrawer from "../sharing/ShareDrawer";
import { getAppLanguage, tx } from "../../i18n";

export default function JourneyAbortedView() {
  const {
    journey,
    resetToHome,
  } = useJourney();

  const navigate =
    useNavigate();

  const memoryCardRef =
    useRef<HTMLElement | null>(
      null
    );

  const [
    shareOpen,
    setShareOpen,
  ] = useState(false);

  const experience =
    journey.experience;

  const stats =
    useMemo(
      () =>
        getJourneyStats(
          journey.timeline,
          journey.startedAt ??
            journey.timeline[0]
              ?.timestamp ??
            0
        ),
      [
        journey.startedAt,
        journey.timeline,
      ]
    );

  const hospesMessage =
    getHospesMessage({
      screen: "walking",
      experience,
      timeline:
        journey.timeline,
    });

  const memoryData:
    MemoryCardData = {
    experienceId:
      experience?.experienceId,
    title:
      experience?.title ??
      tx("Ruta guardada"),
    placeLabel:
      experience?.title ??
      tx("Recorrido interrumpido"),
    city:
      experience?.city ??
      "Huancayo",
    date:
      new Date().toLocaleDateString(
        getAppLanguage() === "en"
          ? "en-US"
          : "es-PE"
      ),
    note: "",
    photo:
      stats.lastPhoto,
    lat:
      experience?.latitude,
    lng:
      experience?.longitude,
    waypoints:
      journey.timeline,
    stats,
    mapBackground: {
      center: [
        experience?.latitude ??
          0,
        experience?.longitude ??
          0,
      ],
      path:
        journey.timeline
          .filter(
            (item) =>
              item.type !==
              "memory"
          )
          .map(
            (item) => [
              item.lat,
              item.lng,
            ] as [
              number,
              number,
            ]
          ),
      memories:
        journey.timeline.filter(
          (item) =>
            item.type ===
            "memory"
        ),
    },
  };

  async function handleShare() {
    await shareEngine.shareMemory(
      memoryData,
      memoryCardRef.current
    );
  }

  async function handleDownload() {
    await shareEngine.downloadImage(
      memoryData,
      memoryCardRef.current
    );
  }

  function handleExit(
    destination: "/" | "/explorer"
  ) {
    resetToHome();
    navigate(destination);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        boxSizing: "border-box",
        padding:
          "20px 16px 42px",
        background:
          "radial-gradient(circle at 50% 0%, rgba(255,138,0,0.10), transparent 34%), #090909",
        color: "#FFFFFF",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <nav
          aria-label={tx("Salir del recorrido interrumpido")}
          style={{
            position: "sticky",
            top: "max(0px, env(safe-area-inset-top))",
            zIndex: 1200,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "8px",
            marginBottom: "14px",
            padding: "7px",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(8,9,16,0.92)",
            boxShadow: "0 10px 28px rgba(0,0,0,0.34)",
            backdropFilter: "blur(14px)",
          }}
        >
          <ExitButton
            icon={House}
            label={tx("Inicio")}
            onClick={() => handleExit("/")}
          />
          <ExitButton
            icon={Compass}
            label={tx("Explorer")}
            onClick={() => handleExit("/explorer")}
          />
        </nav>

        <div
          style={{
            color: "#FFB15C",
            fontSize: "12px",
            fontWeight: 850,
            marginBottom: "12px",
          }}
        >
          ● {tx("Ruta interrumpida y conservada")}
        </div>

        <HospesBanner
          message={hospesMessage}
        />

        <h1
          style={{
            margin: "22px 0 8px",
            fontSize:
              "clamp(1.75rem, 7vw, 2.35rem)",
          }}
        >
          {tx("Tu recorrido no se perdió")}
        </h1>

        <p
          style={{
            margin: "0 0 18px",
            color:
              "rgba(255,255,255,0.66)",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          {tx("Guardé el Punto 0, la ruta, los recuerdos y el lugar donde decidiste detenerte.")}
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "8px",
            marginBottom: "18px",
          }}
        >
          <Metric
            label={tx("Distancia")}
            value={`${stats.totalDistanceKm.toFixed(2)} km`}
          />

          <Metric
            label={tx("Eventos")}
            value={String(
              journey.timeline.length
            )}
          />

          <Metric
            label={tx("Recuerdos")}
            value={String(
              stats.totalMemories
            )}
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

      </main>

      <ShareDrawer
        open={shareOpen}
        onClose={() =>
          setShareOpen(false)
        }
        onShare={handleShare}
        onDownload={
          handleDownload
        }
        onCopyLink={async () => {
          await shareEngine.copyShareText(
            memoryData
          );
        }}
      />
    </div>
  );
}

type ExitButtonProps = {
  icon: typeof House;
  label: string;
  onClick: () => void;
};

function ExitButton({
  icon: Icon,
  label,
  onClick,
}: ExitButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: "42px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        borderRadius: "12px",
        border: "1px solid rgba(66,232,245,0.18)",
        background: "rgba(66,232,245,0.06)",
        color: "#FFFFFF",
        fontSize: "11px",
        fontWeight: 850,
        cursor: "pointer",
      }}
    >
      <Icon size={16} color="#42E8F5" />
      {label}
    </button>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: "12px 6px",
        borderRadius: "13px",
        background: "#151515",
        border:
          "1px solid rgba(255,255,255,0.06)",
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "block",
          color:
            "rgba(255,255,255,0.48)",
          fontSize: "9px",
          textTransform:
            "uppercase",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: "5px",
          color: "#FFFFFF",
          fontSize: "12px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}
