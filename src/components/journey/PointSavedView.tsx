import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  Compass,
  Crop,
  FlipHorizontal2,
  House,
  Loader2,
  Route,
  RotateCw,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useJourney,
} from "../../context/JourneyContext";

import MemoryCard from "../MemoryCard";
import ShareDrawer from "../sharing/ShareDrawer";
import PhotoCropEditor from "../sharing/PhotoCropEditor";
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
import {
  replaceMemoryPhotoBlob,
  transformMemoryPhoto,
} from "../../engine/memoryPhotoEditor";
import type {
  PhotoTransformation,
} from "../../engine/photoProcessing";
import { tx } from "../../i18n";
import {
  sensoryFeedbackEngine,
} from "../../engine/sensoryFeedbackEngine";

export function PointSavedView() {
  const {
    journey,
    resumeWalking,
  } = useJourney();

  const navigate = useNavigate();

  const hasPlayedFeedbackRef =
    useRef(false);

  useEffect(() => {
    if (hasPlayedFeedbackRef.current) {
      return;
    }

    hasPlayedFeedbackRef.current = true;
    sensoryFeedbackEngine.memorySaved();
  }, []);

  const memoryCardRef =
    useRef<HTMLElement | null>(null);

  const [shareOpen, setShareOpen] =
    useState(false);

  const [track, setTrack] = useState(() =>
    journey.experience
      ? loadTrack(journey.experience.experienceId)
      : null
  );

  const [photoAction, setPhotoAction] =
    useState<PhotoTransformation | null>(null);

  const [photoFeedback, setPhotoFeedback] =
    useState<string | null>(null);

  const [cropEditorOpen, setCropEditorOpen] =
    useState(false);

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

  async function handlePhotoTransformation(
    transformation: PhotoTransformation
  ) {
    if (
      !journey.experience ||
      !lastMemory?.photo ||
      photoAction
    ) {
      return;
    }

    setPhotoAction(transformation);
    setPhotoFeedback(null);

    try {
      const updatedTrack = await transformMemoryPhoto(
        journey.experience.experienceId,
        lastMemory.id,
        lastMemory.photo,
        transformation
      );

      setTrack(updatedTrack);
      setPhotoFeedback(
        transformation === "flip-horizontal"
          ? tx("Espejo corregido. La MemoryCard ya usa la nueva orientación.")
          : tx("Fotografía girada. La MemoryCard ya está actualizada.")
      );
    } catch (error) {
      setPhotoFeedback(
        error instanceof Error
          ? error.message
          : tx("No se pudo ajustar la fotografía.")
      );
    } finally {
      setPhotoAction(null);
    }
  }

  async function handleCroppedPhoto(croppedPhoto: Blob) {
    if (
      !journey.experience ||
      !lastMemory?.photo
    ) {
      return;
    }

    const updatedTrack = await replaceMemoryPhotoBlob(
      journey.experience.experienceId,
      lastMemory.id,
      lastMemory.photo,
      croppedPhoto
    );

    setTrack(updatedTrack);
    setPhotoFeedback(
      tx("Encuadre guardado. La MemoryCard ya muestra tu composición.")
    );
    setCropEditorOpen(false);
  }

  function persistNote() {
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
  }

  function handleContinueJourney() {
    persistNote();
    resumeWalking();
  }

  function handleExit(destination: "/" | "/explorer") {
    persistNote();

    /*
     * La misión sigue activa y su burbuja acompañará al usuario.
     * Al volver al Journey encontrará nuevamente la pantalla de ruta.
     */
    resumeWalking();
    navigate(destination);
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
        <nav
          aria-label={tx("Salir del recuerdo")}
          style={{
            position: "sticky",
            top: "max(0px, env(safe-area-inset-top))",
            zIndex: 1200,
            width: "min(92vw, 410px)",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "8px",
            boxSizing: "border-box",
            padding: "7px",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(8,9,16,0.92)",
            boxShadow: "0 10px 28px rgba(0,0,0,0.34)",
            backdropFilter: "blur(14px)",
          }}
        >
          <MemoryExitButton
            icon={House}
            label={tx("Inicio")}
            onClick={() => handleExit("/")}
          />
          <MemoryExitButton
            icon={Compass}
            label={tx("Explorer")}
            onClick={() => handleExit("/explorer")}
          />
        </nav>

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
              {tx("Hito geolocalizado")}
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
              {tx("¡Recuerdo asegurado!")}
            </h1>
          </div>
        </header>

        <div style={{ width: "100%" }}>
          <HospesBanner
            message={hospesBannerMessage}
            noriState="memory-saved"
          />
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
            {tx("Preparando la tarjeta del recuerdo…")}
          </div>
        )}

        {lastMemory?.photo && (
          <section
            aria-label={tx("Ajustar fotografía")}
            style={{
              width: "min(92vw, 410px)",
              boxSizing: "border-box",
              padding: "10px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.035)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              <PhotoAdjustmentButton
                icon={FlipHorizontal2}
                label={tx("Corregir espejo")}
                busy={photoAction === "flip-horizontal"}
                disabled={Boolean(photoAction)}
                onClick={() =>
                  void handlePhotoTransformation("flip-horizontal")
                }
              />
              <PhotoAdjustmentButton
                icon={RotateCw}
                label={tx("Girar fotografía")}
                busy={photoAction === "rotate-clockwise"}
                disabled={Boolean(photoAction)}
                onClick={() =>
                  void handlePhotoTransformation("rotate-clockwise")
                }
              />
              <PhotoAdjustmentButton
                icon={Crop}
                label={tx("Ajustar encuadre")}
                busy={false}
                disabled={Boolean(photoAction)}
                wide
                onClick={() => setCropEditorOpen(true)}
              />
            </div>

            {photoFeedback && (
              <p
                role="status"
                style={{
                  margin: "8px 2px 0",
                  color: "rgba(255,255,255,0.72)",
                  fontSize: "9px",
                  lineHeight: 1.4,
                  textAlign: "left",
                }}
              >
                {photoFeedback}
              </p>
            )}
          </section>
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
            {tx("Añade una nota a este momento")}
          </label>

          <textarea
            id="memory-note"
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            maxLength={180}
            placeholder={tx("¿Qué te hizo sentir este rincón de la ciudad?")}
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
          {tx("Guardar nota y continuar paseo")}
        </button>
      </main>

      <ShareDrawer
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onShare={handleShareMemory}
        onDownload={handleDownloadMemory}
        onCopyLink={handleCopyText}
      />

      {cropEditorOpen && lastMemory?.photo && (
        <PhotoCropEditor
          photoReference={lastMemory.photo}
          onCancel={() => setCropEditorOpen(false)}
          onApply={handleCroppedPhoto}
        />
      )}
    </div>
  );
}

type PhotoAdjustmentButtonProps = {
  icon: typeof FlipHorizontal2;
  label: string;
  busy: boolean;
  disabled: boolean;
  wide?: boolean;
  onClick: () => void;
};

function PhotoAdjustmentButton({
  icon: Icon,
  label,
  busy,
  disabled,
  wide = false,
  onClick,
}: PhotoAdjustmentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: "42px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        borderRadius: "12px",
        border: "1px solid rgba(66,232,245,0.20)",
        background: "rgba(66,232,245,0.06)",
        color: "#FFFFFF",
        fontSize: "10px",
        fontWeight: 850,
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled && !busy ? 0.48 : 1,
        gridColumn: wide ? "1 / -1" : undefined,
      }}
    >
      {busy ? (
        <Loader2 size={16} />
      ) : (
        <Icon size={16} color="#42E8F5" />
      )}
      {label}
    </button>
  );
}

type MemoryExitButtonProps = {
  icon: typeof House;
  label: string;
  onClick: () => void;
};

function MemoryExitButton({
  icon: Icon,
  label,
  onClick,
}: MemoryExitButtonProps) {
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
