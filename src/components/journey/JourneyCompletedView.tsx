import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Camera,
  Crop,
  FlipHorizontal2,
  ImagePlus,
  Loader2,
  PencilLine,
  RotateCw,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useJourney,
} from "../../context/JourneyContext";

import {
  addMemoryToTrack,
  getJourneyStats,
  loadTrack,
  updateMemoryNote,
  updateMemoryPhoto,
} from "../../engine/trackingEngine";
import {
  storePhotoBlob,
} from "../../engine/mediaStorage";
import {
  compressPhotoFile,
  type PhotoTransformation,
} from "../../engine/photoProcessing";
import {
  replaceMemoryPhotoBlob,
  transformMemoryPhoto,
} from "../../engine/memoryPhotoEditor";

import MemoryCard from "../MemoryCard";
import ShareDrawer from "../sharing/ShareDrawer";
import PhotoCropEditor from "../sharing/PhotoCropEditor";
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
import { getAppLanguage, tx } from "../../i18n";

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

  const photoInputRef =
    useRef<HTMLInputElement | null>(null);

  const cameraInputRef =
    useRef<HTMLInputElement | null>(null);

  const [
    cardTimeline,
    setCardTimeline,
  ] = useState(() => journey.timeline ?? []);

  const [
    isEditingCard,
    setIsEditingCard,
  ] = useState(false);

  const [
    isSavingPhoto,
    setIsSavingPhoto,
  ] = useState(false);

  const [
    cardFeedback,
    setCardFeedback,
  ] = useState<string | null>(null);

  const [
    photoAction,
    setPhotoAction,
  ] = useState<PhotoTransformation | null>(null);

  const [
    cropEditorOpen,
    setCropEditorOpen,
  ] = useState(false);

  const activeExperience =
    journey.experience as
      | Experience
      | null;

  const stats = useMemo(() => {
    if (
      !journey.startedAt ||
      !cardTimeline
    ) {
      return null;
    }

    return getJourneyStats(
      cardTimeline,
      journey.startedAt
    );
  }, [
    journey.startedAt,
    cardTimeline,
  ]);

  const lastPhoto =
    stats?.lastPhoto;

  const lastNote =
    stats?.lastNote ?? "";

  const lastMemoryWithPhoto = [...cardTimeline]
    .reverse()
    .find(
      (item) =>
        item.type === "memory" && Boolean(item.photo)
    );

  const [
    editableNote,
    setEditableNote,
  ] = useState(() => lastNote);

  const hospesBannerMessage =
    getHospesMessage({
      screen: "completed",
      experience:
        journey.experience,
      timeline:
        cardTimeline,
      rewardXp: 150,
    });

  const memoryData = {
    experienceId:
      activeExperience?.experienceId,

    title:
      activeExperience?.title ??
      tx("Destino"),

    placeCategory:
      activeExperience?.placeCategory ??
      activeExperience?.type,

    listingStatus:
      activeExperience?.listingStatus ??
      "editorial" as const,

    placeLabel:
      activeExperience?.title ??
      tx("Lugar visitado"),

    city:
      activeExperience?.city ??
      "Huancayo",

    date:
      new Date().toLocaleDateString(
        getAppLanguage() === "en"
          ? "en-US"
          : "es-PE"
      ),

    photo: lastPhoto,

    /*
     * Solo mostramos como protagonista
     * una nota escrita realmente por el usuario.
     * No inyectamos frases automáticas largas.
     */
    note: editableNote,

    primaryInterest:
      activeExperience?.interests?.[0],

    lat:
      activeExperience?.latitude,

    lng:
      activeExperience?.longitude,

    waypoints:
      cardTimeline,

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
        cardTimeline
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
        cardTimeline
      ).filter(
        (item) =>
          item.type === "memory"
      ),
    },
  };

  function getMemoryCoordinates(): {
    lat: number;
    lng: number;
  } {
    const lastPosition = [...cardTimeline]
      .reverse()
      .find((item) => item.type !== "resume");

    return {
      lat:
        lastPosition?.lat ??
        activeExperience?.latitude ??
        0,
      lng:
        lastPosition?.lng ??
        activeExperience?.longitude ??
        0,
    };
  }

  function refreshCardTimeline() {
    if (!activeExperience) {
      return;
    }

    const updatedTrack = loadTrack(
      activeExperience.experienceId
    );

    if (updatedTrack) {
      setCardTimeline(updatedTrack.timeline);
    }
  }

  async function handleCardPhotoSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !activeExperience) {
      return;
    }

    setIsSavingPhoto(true);
    setCardFeedback(null);

    try {
      const compressed = await compressPhotoFile(file);
      const photoReference = await storePhotoBlob(compressed);
      const lastMemory = [...cardTimeline]
        .reverse()
        .find((item) => item.type === "memory");

      if (lastMemory) {
        updateMemoryPhoto(
          activeExperience.experienceId,
          lastMemory.id,
          photoReference
        );
      } else {
        const coordinates = getMemoryCoordinates();

        addMemoryToTrack(activeExperience.experienceId, {
          ...coordinates,
          photo: photoReference,
          note: editableNote.trim() || undefined,
        });
      }

      refreshCardTimeline();
      setCardFeedback(
        tx("Foto agregada. Tu MemoryCard ya está lista para compartir.")
      );
    } catch (error) {
      setCardFeedback(
        error instanceof Error
          ? error.message
          : tx("No se pudo agregar la fotografía.")
      );
    } finally {
      setIsSavingPhoto(false);
    }
  }

  function handleSaveCardNote() {
    if (!activeExperience) {
      return;
    }

    const lastMemory = [...cardTimeline]
      .reverse()
      .find((item) => item.type === "memory");

    if (lastMemory) {
      updateMemoryNote(
        activeExperience.experienceId,
        lastMemory.id,
        editableNote
      );
    } else if (editableNote.trim()) {
      addMemoryToTrack(activeExperience.experienceId, {
        ...getMemoryCoordinates(),
        note: editableNote.trim(),
      });
    }

    refreshCardTimeline();
    setIsEditingCard(false);
    setCardFeedback(tx("Cambios guardados en tu MemoryCard."));
  }

  async function handlePhotoTransformation(
    transformation: PhotoTransformation
  ) {
    if (
      !activeExperience ||
      !lastMemoryWithPhoto?.photo ||
      photoAction
    ) {
      return;
    }

    setPhotoAction(transformation);
    setCardFeedback(null);

    try {
      const updatedTrack = await transformMemoryPhoto(
        activeExperience.experienceId,
        lastMemoryWithPhoto.id,
        lastMemoryWithPhoto.photo,
        transformation
      );

      setCardTimeline(updatedTrack.timeline);
      setCardFeedback(
        transformation === "flip-horizontal"
          ? tx("Espejo corregido. La MemoryCard ya usa la nueva orientación.")
          : tx("Fotografía girada. La MemoryCard ya está actualizada.")
      );
    } catch (error) {
      setCardFeedback(
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
      !activeExperience ||
      !lastMemoryWithPhoto?.photo
    ) {
      return;
    }

    const updatedTrack = await replaceMemoryPhotoBlob(
      activeExperience.experienceId,
      lastMemoryWithPhoto.id,
      lastMemoryWithPhoto.photo,
      croppedPhoto
    );

    setCardTimeline(updatedTrack.timeline);
    setCardFeedback(
      tx("Encuadre guardado. La MemoryCard ya muestra tu composición.")
    );
    setCropEditorOpen(false);
  }

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
          ✓ {tx("Expedición completada")}
        </div>

        <HospesBanner
          message={
            hospesBannerMessage
          }
          noriState="arrival"
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
          {tx("¡Aventura finalizada!")}
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
          {tx("Tu recorrido, recuerdos y llegada quedaron guardados.")}
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
            label={tx("Distancia")}
            value={`${(
              stats?.totalDistanceKm ??
              0
            ).toFixed(2)} km`}
          />

          <Metric
            label={tx("Tiempo")}
            value={formatDuration(
              stats?.durationSeconds ??
                0
            )}
          />

          <Metric
            label={tx("Hitos")}
            value={`${
              stats?.totalMemories ??
              0
            } 🔮`}
          />
        </section>

        <section
          style={{
            marginBottom: "18px",
            padding: "15px",
            borderRadius: "18px",
            background:
              "linear-gradient(145deg, rgba(255,32,206,0.10), rgba(66,232,245,0.06))",
            border:
              "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <strong
            style={{
              display: "block",
              fontSize: "14px",
              lineHeight: 1.35,
            }}
          >
            {lastPhoto
              ? tx("¿Quieres cambiar la foto de tu MemoryCard?")
              : tx("¿Quieres agregar una foto a tu MemoryCard?")}
          </strong>

          <p
            style={{
              margin: "5px 0 12px",
              color: "rgba(255,255,255,0.62)",
              fontSize: "11px",
              lineHeight: 1.45,
            }}
          >
            {tx("Puedes elegir una foto, tomar otra o editar el texto antes de compartir.")}
          </p>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handleCardPhotoSelected}
            style={{ display: "none" }}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleCardPhotoSelected}
            style={{ display: "none" }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isSavingPhoto}
              style={{
                minHeight: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                border: "none",
                borderRadius: "13px",
                background: "#FF20CE",
                color: "#FFFFFF",
                fontWeight: 850,
                fontSize: "11px",
                cursor: isSavingPhoto ? "wait" : "pointer",
                opacity: isSavingPhoto ? 0.65 : 1,
              }}
            >
              <ImagePlus size={17} />
              {isSavingPhoto
                ? tx("Guardando…")
                : lastPhoto
                  ? tx("Cambiar foto")
                  : tx("Agregar foto")}
            </button>

            <button
              type="button"
              onClick={() => setIsEditingCard((value) => !value)}
              style={{
                minHeight: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                borderRadius: "13px",
                border: "1px solid rgba(66,232,245,0.26)",
                background: "rgba(66,232,245,0.06)",
                color: "#42E8F5",
                fontWeight: 850,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              <PencilLine size={16} />
              {tx("Editar texto")}
            </button>
          </div>

          {lastMemoryWithPhoto?.photo && (
            <div
              aria-label={tx("Ajustar fotografía")}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  void handlePhotoTransformation("flip-horizontal")
                }
                disabled={Boolean(photoAction)}
                style={{
                  minHeight: "42px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  borderRadius: "13px",
                  border: "1px solid rgba(66,232,245,0.22)",
                  background: "rgba(66,232,245,0.06)",
                  color: "#FFFFFF",
                  fontWeight: 850,
                  fontSize: "10px",
                  cursor: photoAction ? "wait" : "pointer",
                  opacity:
                    photoAction && photoAction !== "flip-horizontal"
                      ? 0.48
                      : 1,
                }}
              >
                {photoAction === "flip-horizontal" ? (
                  <Loader2 size={16} />
                ) : (
                  <FlipHorizontal2 size={16} color="#42E8F5" />
                )}
                {tx("Corregir espejo")}
              </button>

              <button
                type="button"
                onClick={() =>
                  void handlePhotoTransformation("rotate-clockwise")
                }
                disabled={Boolean(photoAction)}
                style={{
                  minHeight: "42px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  borderRadius: "13px",
                  border: "1px solid rgba(66,232,245,0.22)",
                  background: "rgba(66,232,245,0.06)",
                  color: "#FFFFFF",
                  fontWeight: 850,
                  fontSize: "10px",
                  cursor: photoAction ? "wait" : "pointer",
                  opacity:
                    photoAction && photoAction !== "rotate-clockwise"
                      ? 0.48
                      : 1,
                }}
              >
                {photoAction === "rotate-clockwise" ? (
                  <Loader2 size={16} />
                ) : (
                  <RotateCw size={16} color="#42E8F5" />
                )}
                {tx("Girar fotografía")}
              </button>

              <button
                type="button"
                onClick={() => setCropEditorOpen(true)}
                disabled={Boolean(photoAction)}
                style={{
                  minHeight: "42px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  borderRadius: "13px",
                  border: "1px solid rgba(66,232,245,0.22)",
                  background: "rgba(66,232,245,0.06)",
                  color: "#FFFFFF",
                  fontWeight: 850,
                  fontSize: "10px",
                  cursor: photoAction ? "wait" : "pointer",
                }}
              >
                <Crop size={16} color="#42E8F5" />
                {tx("Ajustar encuadre")}
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={Boolean(photoAction) || isSavingPhoto}
                style={{
                  minHeight: "42px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  borderRadius: "13px",
                  border: "1px solid rgba(66,232,245,0.22)",
                  background: "rgba(66,232,245,0.06)",
                  color: "#FFFFFF",
                  fontWeight: 850,
                  fontSize: "10px",
                  cursor:
                    photoAction || isSavingPhoto
                      ? "wait"
                      : "pointer",
                }}
              >
                {isSavingPhoto ? (
                  <Loader2 size={16} />
                ) : (
                  <Camera size={16} color="#42E8F5" />
                )}
                {tx("Volver a tomar foto")}
              </button>
            </div>
          )}

          {isEditingCard && (
            <div style={{ marginTop: "10px" }}>
              <textarea
                value={editableNote}
                onChange={(event) => setEditableNote(event.target.value)}
                maxLength={180}
                placeholder={tx("Escribe algo que quieras recordar…")}
                style={{
                  width: "100%",
                  minHeight: "82px",
                  boxSizing: "border-box",
                  padding: "11px",
                  resize: "vertical",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.14)",
                  outline: "none",
                  background: "rgba(3,4,9,0.68)",
                  color: "#FFFFFF",
                  font: "inherit",
                  fontSize: "12px",
                }}
              />

              <button
                type="button"
                onClick={handleSaveCardNote}
                style={{
                  width: "100%",
                  minHeight: "40px",
                  marginTop: "8px",
                  border: "none",
                  borderRadius: "11px",
                  background: "#42E8F5",
                  color: "#061013",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {tx("Guardar cambios")}
              </button>
            </div>
          )}

          {cardFeedback && (
            <p
              role="status"
              style={{
                margin: "10px 0 0",
                color: "rgba(255,255,255,0.76)",
                fontSize: "10px",
                lineHeight: 1.4,
              }}
            >
              {cardFeedback}
            </p>
          )}
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
              {tx("Tu nota")}
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
          {tx("Explorar otro lugar")} →
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

      {cropEditorOpen && lastMemoryWithPhoto?.photo && (
        <PhotoCropEditor
          photoReference={lastMemoryWithPhoto.photo}
          onCancel={() => setCropEditorOpen(false)}
          onApply={handleCroppedPhoto}
        />
      )}
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
