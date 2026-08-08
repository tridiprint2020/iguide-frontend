import {
  forwardRef,
  useState,
} from "react";

import {
  CalendarDays,
  Download,
  Footprints,
  Heart,
  MapPin,
  MessageCircleHeart,
  Repeat2,
  Share2,
} from "lucide-react";

import {
  getFavorite,
  setFavoriteReaction,
} from "../data/user";

import MemoryMapCanvas from "./sharing/MemoryMapCanvas";
import MemoryRouteGraphic from "./sharing/MemoryRouteGraphic";

import logo from "../assets/optimized/logoig.webp";

import type {
  FavoriteReaction,
} from "../types/user/user";

import type {
  MemoryCardData,
} from "../types/memoryCard";
import {
  useMediaUrl,
} from "../hooks/useMediaUrl";
import { tx } from "../i18n";

type Props = {
  data: MemoryCardData;
  onShare: () => void | Promise<void>;
  onDownload?: () => void | Promise<void>;
};

type ReactionOption = {
  id: FavoriteReaction;
  label: string;
  compactLabel: string;
  icon:
    | typeof Heart
    | typeof MessageCircleHeart
    | typeof Repeat2;
};

type StatusStyle = {
  label: string;
  color: string;
  background: string;
  border: string;
};

const MAGENTA = "#FF20CE";
const MAGENTA_SOFT = "#FF65DF";
const CYAN = "#42E8F5";
const ORANGE = "#FF9A3D";

const AUTOMATIC_NOTES = [
  "guardando la esencia del momento",
  "guardé un recuerdo durante mi experiencia",
  "comienza mi aventura con i.guide",
  "comencé mi aventura hacia",
  "completé mi línea de exploración",
  "completé mi línea de exploración con éxito",
  "un rincón que no aparece en los mapas",
  "hasta aquí llegó esta parte de la aventura",
  "el recorrido quedó guardado para continuar descubriendo la ciudad",
  "cada gran recorrido empieza con un primer paso",
  "este punto forma parte de mi recorrido hacia",
  "llegué a",
  "un momento registrado durante mi recorrido",
];

const REACTIONS: ReactionOption[] = [
  {
    id: "loved",
    label: "Me encantó",
    compactLabel: "Me encantó",
    icon: Heart,
  },
  {
    id: "recommended",
    label: "Lo recomiendo",
    compactLabel: "Recomiendo",
    icon: MessageCircleHeart,
  },
  {
    id: "must_try",
    label: "Quiero repetir",
    compactLabel: "Repetir",
    icon: Repeat2,
  },
];

function isUserNote(note?: string): boolean {
  const normalized =
    note?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return false;
  }

  return !AUTOMATIC_NOTES.some(
    (automaticNote) =>
      normalized.includes(automaticNote)
  );
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(
    0,
    Math.floor(totalSeconds)
  );
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(
    (safeSeconds % 3600) / 60
  );
  const seconds = safeSeconds % 60;
  const pad = (value: number) =>
    String(value).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getJourneyStatus(
  data: MemoryCardData
): StatusStyle {
  const waypoints = data.waypoints ?? [];
  const hasFinish = waypoints.some(
    (point) => point.type === "finish"
  );
  const hasAbort = waypoints.some(
    (point) => point.type === "abort"
  );

  if (hasFinish) {
    return {
      label: tx("Misión completada"),
      color: MAGENTA_SOFT,
      background: "rgba(38,9,32,0.68)",
      border: "rgba(255,32,206,0.42)",
    };
  }

  if (hasAbort) {
    return {
      label: tx("Ruta conservada"),
      color: ORANGE,
      background: "rgba(40,24,8,0.68)",
      border: "rgba(255,154,61,0.42)",
    };
  }

  return {
    label: tx("Ruta registrada"),
    color: CYAN,
    background: "rgba(5,30,34,0.68)",
    border: "rgba(66,232,245,0.36)",
  };
}

function getExperienceId(
  data: MemoryCardData
): string | null {
  return data.experienceId ?? null;
}

const MemoryCard = forwardRef<HTMLElement, Props>(
  function MemoryCard(
    {
      data,
      onShare,
      onDownload,
    },
    ref
  ) {
    const requestedPhoto = Boolean(data.photo);
    const {
      url: photoUrl,
      loading: photoLoading,
      error: photoError,
    } = useMediaUrl(data.photo);
    const hasPhoto = Boolean(photoUrl);
    const hasMap = Boolean(data.mapBackground);
    const hasUserNote = isUserNote(data.note);
    const status = getJourneyStatus(data);
    const experienceId = getExperienceId(data);

    const [
      reactionSelection,
      setReactionSelection,
    ] = useState<{
      experienceId: string;
      reaction: FavoriteReaction;
    } | null>(null);

    const [
      isDownloading,
      setIsDownloading,
    ] = useState(false);

    const selectedReaction =
      experienceId &&
      reactionSelection?.experienceId === experienceId
        ? reactionSelection.reaction
        : experienceId
          ? getFavorite(experienceId)?.reaction ?? null
          : null;

    const formattedDistance =
      `${data.stats.totalDistanceKm.toFixed(2)} km`;
    const formattedTime = formatDuration(
      data.stats.durationSeconds
    );
    const memoryCount = data.stats.totalMemories;
    const pointCount = data.waypoints?.length ?? 0;

    function handleReaction(
      reaction: FavoriteReaction
    ) {
      if (!experienceId) {
        return;
      }

      setFavoriteReaction(experienceId, reaction);
      setReactionSelection({
        experienceId,
        reaction,
      });
    }

    async function handleDownloadClick() {
      if (!onDownload || isDownloading) {
        return;
      }

      setIsDownloading(true);

      try {
        await onDownload();
      } finally {
        setIsDownloading(false);
      }
    }

    return (
      <article
        style={{
          width: "min(92vw, 410px)",
          boxSizing: "border-box",
          overflow: "hidden",
          borderRadius: "28px",
          background:
            "linear-gradient(180deg, #11131D 0%, #080910 100%)",
          border:
            "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 28px 76px rgba(0,0,0,0.58), 0 0 34px rgba(255,32,206,0.08)",
          color: "#FFFFFF",
        }}
      >
        {/* La pieza exportable: formato social 4:5. */}
        <section
          ref={ref}
          data-iguide-memory-card="true"
          data-iguide-media-ready={
            requestedPhoto && photoLoading
              ? "false"
              : "true"
          }
          style={{
            position: "relative",
            aspectRatio: "4 / 5",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, #151827, #080910)",
          }}
        >
          {hasPhoto ? (
            <img
              src={photoUrl}
              alt={tx("Recuerdo de {{title}}", { title: data.title })}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
              }}
            />
          ) : requestedPhoto && photoLoading ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(145deg, #F7F9FC, #EAF2F5)",
                color: "#52616B",
                fontSize: "12px",
                fontWeight: 750,
              }}
            >
              {tx("Preparando tu fotografía…")}
            </div>
          ) : hasMap ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
              }}
            >
              <MemoryRouteGraphic
                path={data.mapBackground!.path}
                memories={data.mapBackground!.memories}
                waypoints={data.waypoints ?? []}
              />

              <div
                data-export-ignore="true"
                style={{
                  position: "absolute",
                  inset: 0,
                }}
              >
                <MemoryMapCanvas
                  center={data.mapBackground!.center}
                  path={data.mapBackground!.path}
                  memories={data.mapBackground!.memories}
                  waypoints={data.waypoints ?? []}
                  variant="full"
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "rgba(255,255,255,0.42)",
                fontSize: "12px",
              }}
            >
              {photoError
                ? tx("No pudimos abrir esta fotografía.")
                : tx("Preparando tu recuerdo…")}
            </div>
          )}

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background: hasPhoto
                ? `
                    linear-gradient(
                      180deg,
                      rgba(4,5,10,0.50) 0%,
                      rgba(4,5,10,0.04) 30%,
                      rgba(4,5,10,0.16) 54%,
                      rgba(4,5,10,0.90) 100%
                    )
                  `
                : "linear-gradient(180deg, rgba(4,5,10,0.02), rgba(4,5,10,0.18))",
              pointerEvents: "none",
            }}
          />

          {/* Marca integrada, como en la maqueta social. */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "15px",
              zIndex: 5,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <img
              src={logo}
              alt="I.GUIDE"
              style={{
                width: "88px",
                height: "38px",
                objectFit: "contain",
                objectPosition: "left center",
                filter:
                  "drop-shadow(0 3px 10px rgba(0,0,0,0.65))",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "14px",
              zIndex: 5,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              minHeight: "28px",
              padding: "4px 9px",
              borderRadius: "999px",
              color: status.color,
              background: status.background,
              border: `1px solid ${status.border}`,
              backdropFilter: "blur(10px)",
              fontSize: "7px",
              fontWeight: 900,
              letterSpacing: "0.075em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: status.color,
                boxShadow: `0 0 8px ${status.color}`,
              }}
            />
            {status.label}
          </div>

          <div
            style={{
              position: "absolute",
              left: "15px",
              top: "63px",
              zIndex: 5,
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "6px 9px",
              borderRadius: "999px",
              color: "rgba(255,255,255,0.90)",
              background: "rgba(5,6,12,0.52)",
              border:
                "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(8px)",
              fontSize: "8px",
              fontWeight: 800,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                backgroundColor: MAGENTA,
                boxShadow:
                  "0 0 10px rgba(255,32,206,0.95)",
              }}
            />
            {tx("{{points}} puntos · {{memories}} recuerdos", { points: pointCount, memories: memoryCount })}
          </div>

          {/* Texto inferior: ocupa solo el lado izquierdo del mapa. */}
          <div
            style={{
              position: "absolute",
              left: "16px",
              right: hasMap ? "48%" : "16px",
              bottom: "16px",
              zIndex: 5,
              textAlign: "left",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#FFFFFF",
                fontSize: "clamp(22px, 6vw, 30px)",
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: "-0.045em",
                overflowWrap: "anywhere",
                textShadow: "0 3px 18px rgba(0,0,0,0.88)",
              }}
            >
              {data.title}
            </h2>

            {data.placeLabel && (
              <p
                style={{
                  margin: "4px 0 0",
                  color: "rgba(255,255,255,0.92)",
                  fontSize: "10px",
                  fontWeight: 750,
                  lineHeight: 1.3,
                }}
              >
                {data.placeLabel}
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "5px 8px",
                marginTop: "8px",
                color: "rgba(255,255,255,0.76)",
                fontSize: "8px",
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <MapPin size={11} strokeWidth={2} />
                {data.city}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <CalendarDays size={11} strokeWidth={2} />
                {data.date}
              </span>
            </div>

            {hasUserNote && (
              <p
                style={{
                  margin: "10px 0 0",
                  color: "#FFFFFF",
                  fontSize: "9px",
                  lineHeight: 1.42,
                  fontStyle: "italic",
                  fontWeight: 650,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                }}
              >
                “{data.note?.trim()}”
              </p>
            )}

            <p
              style={{
                margin: "10px 0 0",
                color: MAGENTA_SOFT,
                fontSize: "8px",
                fontWeight: 850,
              }}
            >
              #IGuide #LiveLikeLocal
            </p>
          </div>

          {/*
           * El mapa queda pegado a la esquina inferior derecha.
           * Sus teselas conservan transparencia: la fotografía sigue
           * siendo visible y la ruta magenta conserva contraste.
           */}
          {hasPhoto && hasMap && (
            <div
              style={{
                position: "absolute",
                right: "10px",
                bottom: "10px",
                zIndex: 4,
                width: "43%",
                height: "36%",
                overflow: "hidden",
                borderRadius: "15px",
                border:
                  "1px solid rgba(255,255,255,0.26)",
                background: "rgba(5,7,13,0.28)",
                boxShadow:
                  "0 12px 28px rgba(0,0,0,0.34), 0 0 18px rgba(255,32,206,0.10)",
                backdropFilter: "blur(2px)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "0 0 42px",
                }}
              >
                <MemoryRouteGraphic
                  path={data.mapBackground!.path}
                  memories={data.mapBackground!.memories}
                  waypoints={data.waypoints ?? []}
                  compact
                />

                <div
                  data-export-ignore="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                  }}
                >
                  <MemoryMapCanvas
                    center={data.mapBackground!.center}
                    path={data.mapBackground!.path}
                    memories={data.mapBackground!.memories}
                    waypoints={data.waypoints ?? []}
                    variant="glass"
                  />
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "42px",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  alignItems: "center",
                  background: "rgba(5,7,13,0.76)",
                  borderTop:
                    "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <MapStat value={formattedTime} label={tx("Tiempo")} />
                <MapStat value={formattedDistance} label={tx("Distancia")} />
                <MapStat value={`${memoryCount}`} label={tx("Hitos")} accent />
              </div>
            </div>
          )}

          {!hasMap && (
            <div
              style={{
                position: "absolute",
                right: "14px",
                bottom: "15px",
                zIndex: 5,
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                padding: "9px 10px",
                borderRadius: "13px",
                background: "rgba(5,7,13,0.62)",
                border:
                  "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
                textAlign: "right",
              }}
            >
              <strong style={{ fontSize: "11px" }}>
                {formattedTime}
              </strong>
              <span
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "7px",
                  textTransform: "uppercase",
                }}
              >
                {tx("{{distance}} · {{count}} hitos", { distance: formattedDistance, count: memoryCount })}
              </span>
            </div>
          )}
        </section>

        {/* Controles de la app: no forman parte de la imagen exportada. */}
        {experienceId && (
          <section
            data-export-ignore="true"
            style={{
              padding: "14px 14px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "9px",
                color: "rgba(255,255,255,0.48)",
                fontSize: "8px",
                fontWeight: 850,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <Footprints size={13} color={CYAN} />
              {tx("¿Qué te dejó esta experiencia?")}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "7px",
              }}
            >
              {REACTIONS.map((reaction) => {
                const Icon = reaction.icon;
                const selected =
                  selectedReaction === reaction.id;

                return (
                  <button
                    key={reaction.id}
                    type="button"
                    onClick={() =>
                      handleReaction(reaction.id)
                    }
                    aria-pressed={selected}
                    title={tx(reaction.label)}
                    style={{
                      minWidth: 0,
                      minHeight: "50px",
                      padding: "7px 5px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      borderRadius: "13px",
                      border: selected
                        ? "1px solid rgba(255,32,206,0.58)"
                        : "1px solid rgba(255,255,255,0.08)",
                      background: selected
                        ? "linear-gradient(145deg, rgba(255,32,206,0.20), rgba(18,19,31,0.98))"
                        : "rgba(255,255,255,0.035)",
                      color: selected
                        ? MAGENTA_SOFT
                        : "rgba(255,255,255,0.68)",
                      cursor: "pointer",
                    }}
                  >
                    <Icon
                      size={17}
                      strokeWidth={selected ? 2.2 : 1.7}
                    />
                    <span
                      style={{
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: "8px",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tx(reaction.compactLabel)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <footer
          data-export-ignore="true"
          style={{
            padding: "12px 14px 14px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: onDownload
                ? "48px minmax(0, 1fr)"
                : "1fr",
              gap: "8px",
            }}
          >
            {onDownload && (
              <button
                type="button"
                onClick={() => {
                  void handleDownloadClick();
                }}
                disabled={isDownloading}
                aria-busy={isDownloading}
                aria-label={tx("Descargar imagen")}
                title={tx("Descargar imagen")}
                style={{
                  minHeight: "48px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "14px",
                  border:
                    "1px solid rgba(66,232,245,0.24)",
                  background: "rgba(66,232,245,0.06)",
                  color: CYAN,
                  cursor: isDownloading ? "wait" : "pointer",
                  opacity: isDownloading ? 0.62 : 1,
                }}
              >
                <Download size={19} strokeWidth={2} />
              </button>
            )}

            <button
              type="button"
              onClick={onShare}
              style={{
                minHeight: "48px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "9px 18px",
                border:
                  "1px solid rgba(255,255,255,0.13)",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, #FF31D4 0%, #D4008D 100%)",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow:
                  "0 10px 26px rgba(255,0,184,0.25)",
              }}
            >
              <Share2 size={17} strokeWidth={2.1} />
              {tx("Compartir momento")}
            </button>
          </div>
        </footer>
      </article>
    );
  }
);

type MapStatProps = {
  value: string;
  label: string;
  accent?: boolean;
};

function MapStat({
  value,
  label,
  accent = false,
}: MapStatProps) {
  return (
    <span
      style={{
        minWidth: 0,
        padding: "0 3px",
        color: accent ? MAGENTA_SOFT : "#FFFFFF",
        textAlign: "center",
        borderRight:
          !accent
            ? "1px solid rgba(255,255,255,0.10)"
            : "none",
      }}
    >
      <strong
        style={{
          display: "block",
          overflow: "hidden",
          fontSize: "7px",
          lineHeight: 1.15,
          fontWeight: 850,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </strong>
      <small
        style={{
          display: "block",
          marginTop: "3px",
          color: "rgba(255,255,255,0.48)",
          fontSize: "5px",
          lineHeight: 1,
          fontWeight: 750,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </small>
    </span>
  );
}

export default MemoryCard;
