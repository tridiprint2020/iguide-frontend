import {
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  Route,
} from "lucide-react";

import {
  useJourney,
} from "../../context/JourneyContext";

import MemoryCard from "../MemoryCard";
import ShareDrawer from "../sharing/ShareDrawer";
import HospesBanner from "../hospes/HospesBanner";

import {
  MemoryCardEngine,
} from "../../engine/memoryCardEngine";

import {
  shareEngine,
} from "../../engine/shareEngine";

import {
  getHospesMessage,
} from "../../engine/hospesContextEngine";

import {
  loadTrack,
  updateMemoryNote,
} from "../../engine/trackingEngine";

export function PointSavedView() {
  const {
    journey,
    resumeWalking,
  } = useJourney();

  const memoryCardRef =
    useRef<HTMLElement | null>(null);

  const [shareOpen, setShareOpen] =
    useState(false);

  const track = journey.experience
    ? loadTrack(journey.experience.experienceId)
    : null;

  const memories =
    track?.timeline.filter(
      (item) => item.type === "memory"
    ) ?? [];

  const lastMemory =
    memories[memories.length - 1];

  const [note, setNote] = useState(
    lastMemory?.note ?? ""
  );

  const cardData =
    journey.experience && track
      ? MemoryCardEngine.build(
          journey.experience,
          track,
          {
            photo: lastMemory?.photo,
            note,
            lat: lastMemory?.lat,
            lng: lastMemory?.lng,
          }
        )
      : null;

  const hospesBannerMessage =
    getHospesMessage({
      screen: "memory",
      experience: journey.experience,
      timeline:
        track?.timeline ?? journey.timeline,
    });

  async function handleShareMemory() {
    if (!cardData) {
      return;
    }

    await shareEngine.shareMemory(
      cardData,
      memoryCardRef.current
    );
  }

  async function handleDownloadMemory() {
    if (!cardData) {
      return;
    }

    await shareEngine.downloadImage(
      cardData,
      memoryCardRef.current
    );
  }

  async function handleCopyText() {
    if (!cardData) {
      return;
    }

    await shareEngine.copyShareText(cardData);
  }

  function handleContinueJourney() {
    if (
      journey.experience &&
      lastMemory
    ) {
      updateMemoryNote(
        journey.experience.experienceId,
        lastMemory.id,
        note
      );
    }

    resumeWalking();
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        boxSizing: "border-box",
        padding:
          "max(18px, env(safe-area-inset-top)) 14px max(30px, env(safe-area-inset-bottom))",
        background:
          "radial-gradient(circle at 8% 0%, rgba(255,32,206,0.12), transparent 30%), radial-gradient(circle at 100% 70%, rgba(66,232,245,0.08), transparent 32%), #070910",
        color: "#FFFFFF",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: "560px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <header
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "11px",
            boxSizing: "border-box",
            padding: "2px 2px 4px",
            textAlign: "left",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "42px",
              height: "42px",
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: "14px",
              color: "#45F0A4",
              background: "rgba(69,240,164,0.09)",
              border:
                "1px solid rgba(69,240,164,0.24)",
              boxShadow:
                "0 0 20px rgba(69,240,164,0.08)",
            }}
          >
            <CheckCircle2 size={22} />
          </span>

          <div style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                color: "#45F0A4",
                fontSize: "8px",
                fontWeight: 900,
                letterSpacing: "0.11em",
                textTransform: "uppercase",
              }}
            >
              Hito geolocalizado
            </span>
            <h1
              style={{
                margin: "3px 0 0",
                color: "#FFFFFF",
                fontSize: "23px",
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: "-0.035em",
              }}
            >
              ¡Recuerdo asegurado!
            </h1>
          </div>
        </header>

        <div style={{ width: "100%" }}>
          <HospesBanner message={hospesBannerMessage} />
        </div>

        {cardData ? (
          <MemoryCard
            ref={memoryCardRef}
            data={cardData}
            onShare={() => setShareOpen(true)}
            onDownload={handleDownloadMemory}
          />
        ) : (
          <div
            role="status"
            style={{
              width: "min(92vw, 410px)",
              minHeight: "180px",
              display: "grid",
              placeItems: "center",
              boxSizing: "border-box",
              padding: "20px",
              borderRadius: "24px",
              border:
                "1px solid rgba(255,255,255,0.09)",
              background: "#11131D",
              color: "rgba(255,255,255,0.56)",
              fontSize: "12px",
            }}
          >
            Preparando la tarjeta del recuerdo…
          </div>
        )}

        <section
          style={{
            width: "min(92vw, 410px)",
            boxSizing: "border-box",
            padding: "14px",
            borderRadius: "19px",
            border:
              "1px solid rgba(255,255,255,0.09)",
            background: "rgba(255,255,255,0.035)",
            textAlign: "left",
          }}
        >
          <label
            htmlFor="memory-note"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "rgba(255,255,255,0.55)",
              fontSize: "8px",
              fontWeight: 850,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
            }}
          >
            Añade una nota a este momento
          </label>

          <textarea
            id="memory-note"
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            maxLength={180}
            placeholder="¿Qué te hizo sentir este rincón de la ciudad?"
            style={{
              width: "100%",
              minHeight: "88px",
              resize: "vertical",
              boxSizing: "border-box",
              padding: "12px 13px",
              borderRadius: "14px",
              border:
                "1px solid rgba(66,232,245,0.16)",
              outline: "none",
              background: "rgba(4,5,10,0.56)",
              color: "#FFFFFF",
              font: "inherit",
              fontSize: "12px",
              lineHeight: 1.5,
            }}
          />

          <span
            style={{
              display: "block",
              marginTop: "6px",
              color: "rgba(255,255,255,0.32)",
              fontSize: "8px",
              textAlign: "right",
            }}
          >
            {note.length}/180
          </span>
        </section>

        <button
          type="button"
          onClick={handleContinueJourney}
          style={{
            width: "min(92vw, 410px)",
            minHeight: "54px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "9px",
            borderRadius: "17px",
            border:
              "1px solid rgba(66,232,245,0.22)",
            background:
              "linear-gradient(145deg, rgba(66,232,245,0.13), rgba(18,20,30,0.98))",
            color: "#FFFFFF",
            fontSize: "13px",
            fontWeight: 850,
            cursor: "pointer",
            boxShadow:
              "0 12px 30px rgba(0,0,0,0.24)",
          }}
        >
          <Route size={19} color="#42E8F5" />
          Guardar nota y continuar paseo
        </button>
      </main>

      <ShareDrawer
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShare={handleShareMemory}
        onDownload={handleDownloadMemory}
        onCopyLink={handleCopyText}
      />
    </div>
  );
}
