import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Download,
  Heart,
  MapPinned,
  MessageCircleHeart,
  Repeat2,
  Share2,
  Sparkles,
} from "lucide-react";


import {
  getFavorite,
  setFavoriteReaction,
} from "../data/user";

import MemoryMapCanvas from "./sharing/MemoryMapCanvas";

import logo from "../assets/optimized/logo-iguide.webp";

import type {
  FavoriteReaction,
} from "../types/user/user";

import type {
  MemoryCardData,
} from "../types/memoryCard";

type Props = {
  data: MemoryCardData;
  onShare: () => void;
  onDownload?: () => void;
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

const MAGENTA = "#FF00FF";
const MAGENTA_SOFT = "#FF3DE8";
const CYAN = "#00E6FF";
const ORANGE = "#FF8A00";

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

function isUserNote(
  note?: string
): boolean {
  const normalized =
    note?.trim().toLowerCase() ??
    "";

  if (!normalized) {
    return false;
  }

  return !AUTOMATIC_NOTES.some(
    (automaticNote) =>
      normalized.includes(
        automaticNote
      )
  );
}

function formatDuration(
  totalSeconds: number
): string {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(totalSeconds)
    );

  const hours =
    Math.floor(
      safeSeconds / 3600
    );

  const minutes =
    Math.floor(
      (safeSeconds % 3600) /
        60
    );

  const seconds =
    safeSeconds % 60;

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

function getJourneyStatus(
  data: MemoryCardData
) {
  const waypoints =
    data.waypoints ?? [];

  const hasFinish =
    waypoints.some(
      (point) =>
        point.type === "finish"
    );

  const hasAbort =
    waypoints.some(
      (point) =>
        point.type === "abort"
    );

  if (hasFinish) {
    return {
      label:
        "Misión completada",

      color:
        MAGENTA,

      background:
        "rgba(255,0,255,0.11)",

      border:
        "rgba(255,0,255,0.36)",
    };
  }

  if (hasAbort) {
    return {
      label:
        "Ruta conservada",

      color:
        ORANGE,

      background:
        "rgba(255,138,0,0.10)",

      border:
        "rgba(255,138,0,0.34)",
    };
  }

  return {
    label:
      "Ruta registrada",

    color:
      CYAN,

    background:
      "rgba(0,230,255,0.08)",

    border:
      "rgba(0,230,255,0.24)",
  };
}

function getExperienceId(
  data: MemoryCardData
): string | null {
  const source =
    data as MemoryCardData & {
      experienceId?: string;
    };

  return (
    source.experienceId ??
    null
  );
}

const MemoryCard = forwardRef<HTMLElement, Props>(function MemoryCard(
  {
    data,
    onShare,
    onDownload,
  },
  ref
) {
  const hasPhoto =
    Boolean(data.photo);

  const hasMap =
    Boolean(
      data.mapBackground
    );

  const hasUserNote =
    isUserNote(data.note);

  const status =
    getJourneyStatus(data);

  const experienceId =
    getExperienceId(data);

  const [
    selectedReaction,
    setSelectedReaction,
  ] =
    useState<FavoriteReaction | null>(
      null
    );

  useEffect(() => {
    if (!experienceId) {
      setSelectedReaction(
        null
      );

      return;
    }

    const favorite =
      getFavorite(
        experienceId
      );

    setSelectedReaction(
      favorite?.reaction ??
        null
    );
  }, [experienceId]);

  const formattedDistance =
    `${data.stats.totalDistanceKm.toFixed(
      2
    )} km`;

  const formattedTime =
    formatDuration(
      data.stats.durationSeconds
    );

  const memoryCount =
    data.stats.totalMemories;

  const primaryVisualLabel =
    hasPhoto
      ? "Tu recuerdo"
      : "Tu recorrido";

  const routeSummary =
    useMemo(
      () => ({
        points:
          data.waypoints?.length ??
          0,

        memories:
          memoryCount,
      }),
      [
        data.waypoints,
        memoryCount,
      ]
    );

  function handleReaction(
    reaction: FavoriteReaction
  ) {
    if (!experienceId) {
      return;
    }

    setFavoriteReaction(
      experienceId,
      reaction
    );

    setSelectedReaction(
      reaction
    );
  }

  return (
    <article
      ref={ref}
      data-iguide-memory-card="true"
      style={{
        width:
          "min(92vw, 390px)",

        boxSizing:
          "border-box",

        overflow:
          "hidden",

        borderRadius:
          "28px",

        background:
          `
            radial-gradient(
              circle at 12% 0%,
              rgba(255,0,255,0.13),
              transparent 30%
            ),
            radial-gradient(
              circle at 96% 95%,
              rgba(0,230,255,0.08),
              transparent 30%
            ),
            linear-gradient(
              180deg,
              #171827 0%,
              #090A12 100%
            )
          `,

        border:
          "1px solid rgba(255,255,255,0.08)",

        boxShadow:
          `
            0 28px 70px rgba(0,0,0,0.56),
            0 0 34px rgba(255,0,255,0.08)
          `,

        color:
          "#FFFFFF",
      }}
    >
      {/* MARCA */}
      <header
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "11px",

          padding:
            "17px 17px 14px",

          borderBottom:
            "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <img
          src={logo}
          alt="I.GUIDE"
          style={{
            width:
              "40px",

            height:
              "40px",

            flexShrink:
              0,

            objectFit:
              "contain",

            borderRadius:
              "10px",

            backgroundColor:
              "#FFFFFF",

            boxShadow:
              "0 0 16px rgba(255,0,255,0.16)",
          }}
        />

        <div
          style={{
            minWidth:
              0,

            flex:
              1,
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "6px",

              marginBottom:
                "3px",
            }}
          >
            <span
              style={{
                color:
                  MAGENTA_SOFT,

                fontSize:
                  "9px",

                fontWeight:
                  900,

                letterSpacing:
                  "0.14em",

                textTransform:
                  "uppercase",
              }}
            >
              Live Like Local
            </span>

            <Sparkles
              size={12}
              strokeWidth={1.8}
              color={CYAN}
              style={{
                filter:
                  "drop-shadow(0 0 6px rgba(0,230,255,0.65))",
              }}
            />
          </div>

          <h2
            style={{
              margin:
                0,

              color:
                "#FFFFFF",

              fontSize:
                "20px",

              lineHeight:
                1.12,

              fontWeight:
                900,

              letterSpacing:
                "-0.025em",

              overflowWrap:
                "anywhere",
            }}
          >
            {data.title}
          </h2>
        </div>

        <div
          style={{
            display:
              "inline-flex",

            alignItems:
              "center",

            gap:
              "6px",

            minHeight:
              "30px",

            padding:
              "5px 9px",

            borderRadius:
              "999px",

            color:
              status.color,

            background:
              status.background,

            border:
              `1px solid ${status.border}`,

            fontSize:
              "8px",

            fontWeight:
              900,

            textTransform:
              "uppercase",

            letterSpacing:
              "0.07em",

            whiteSpace:
              "nowrap",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width:
                "7px",

              height:
                "7px",

              borderRadius:
                "50%",

              backgroundColor:
                status.color,

              boxShadow:
                `0 0 9px ${status.color}`,
            }}
          />

          {status.label}
        </div>
      </header>

      {/* UBICACIÓN */}
      <section
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "flex-start",

          gap:
            "12px",

          padding:
            "12px 17px 0",
        }}
      >
        <div
          style={{
            minWidth:
              0,
          }}
        >
          {data.placeLabel && (
            <p
              style={{
                margin:
                  "0 0 4px",

                color:
                  "rgba(255,255,255,0.78)",

                fontSize:
                  "11px",

                fontWeight:
                  700,

                lineHeight:
                  1.35,
              }}
            >
              {data.placeLabel}
            </p>
          )}

          <p
            style={{
              margin:
                0,

              color:
                "rgba(255,255,255,0.43)",

              fontSize:
                "10px",
            }}
          >
            {data.city} · {data.date}
          </p>
        </div>

        <div
          style={{
            display:
              "inline-flex",

            alignItems:
              "center",

            gap:
              "6px",

            color:
              CYAN,

            fontSize:
              "9px",

            fontWeight:
              800,
          }}
        >
          <MapPinned
            size={14}
            strokeWidth={1.8}
          />

          {primaryVisualLabel}
        </div>
      </section>

      {/* VISUAL PRINCIPAL */}
      <section
        style={{
          position:
            "relative",

          height:
            "390px",

          margin:
            "14px 13px 0",

          overflow:
            "hidden",

          borderRadius:
            "21px",

          backgroundColor:
            "#080912",

          border:
            "1px solid rgba(255,255,255,0.08)",

          boxShadow:
            `
              inset 0 0 0 1px rgba(255,0,255,0.03),
              0 16px 34px rgba(0,0,0,0.30)
            `,
        }}
      >
        {hasPhoto ? (
          <>
            <img
              src={data.photo}
              alt={`Recuerdo de ${data.title}`}
              style={{
                position:
                  "absolute",

                inset:
                  0,

                width:
                  "100%",

                height:
                  "100%",

                objectFit:
                  "cover",

                display:
                  "block",
              }}
            />

            {/* MAPA FLOTANTE SOBRE FOTO */}
            {hasMap && (
              <div
                style={{
                  position:
                    "absolute",

                  right:
                    "12px",

                  bottom:
                    hasUserNote
                      ? "95px"
                      : "12px",

                  width:
                    "45%",

                  height:
                    "42%",

                  overflow:
                    "hidden",

                  borderRadius:
                    "16px",

                  border:
                    "1px solid rgba(255,255,255,0.18)",

                  backgroundColor:
                    "#0A0B14",

                  boxShadow:
                    `
                      0 14px 30px rgba(0,0,0,0.48),
                      0 0 18px rgba(255,0,255,0.16)
                    `,

                  zIndex:
                    3,
                }}
              >
                <MemoryMapCanvas
                  center={
                    data.mapBackground!.center
                  }
                  path={
                    data.mapBackground!.path
                  }
                  memories={
                    data.mapBackground!.memories
                  }
                  waypoints={
                    data.waypoints ??
                    []
                  }
                />
              </div>
            )}
          </>
        ) : hasMap ? (
          <MemoryMapCanvas
            center={
              data.mapBackground!.center
            }
            path={
              data.mapBackground!.path
            }
            memories={
              data.mapBackground!.memories
            }
            waypoints={
              data.waypoints ??
              []
            }
          />
        ) : (
          <div
            style={{
              position:
                "absolute",

              inset:
                0,

              display:
                "flex",

              flexDirection:
                "column",

              alignItems:
                "center",

              justifyContent:
                "center",

              gap:
                "8px",

              color:
                "rgba(255,255,255,0.42)",

              fontSize:
                "11px",
            }}
          >
            <MapPinned
              size={30}
              strokeWidth={1.4}
              color={MAGENTA}
            />

            Preparando visualización…
          </div>
        )}

        <div
          aria-hidden="true"
          style={{
            position:
              "absolute",

            inset:
              0,

            background:
              hasPhoto
                ? "linear-gradient(to top, rgba(5,5,10,0.56), transparent 54%)"
                : "linear-gradient(to top, rgba(5,5,10,0.10), transparent 40%)",

            pointerEvents:
              "none",

            zIndex:
              2,
          }}
        />

        {/* NOTA DEL USUARIO */}
        {hasUserNote && (
          <div
            style={{
              position:
                "absolute",

              left:
                "12px",

              right:
                hasPhoto &&
                hasMap
                  ? "49%"
                  : "12px",

              bottom:
                "12px",

              zIndex:
                4,

              maxHeight:
                "76px",

              overflow:
                "hidden",

              padding:
                "10px 11px",

              borderRadius:
                "13px",

              background:
                "rgba(7,8,15,0.82)",

              border:
                "1px solid rgba(255,255,255,0.11)",

              backdropFilter:
                "blur(10px)",
            }}
          >
            <p
              style={{
                margin:
                  0,

                color:
                  "#FFFFFF",

                fontSize:
                  "10px",

                lineHeight:
                  1.45,

                fontStyle:
                  "italic",

                fontWeight:
                  600,

                textAlign:
                  "left",

                display:
                  "-webkit-box",

                WebkitLineClamp:
                  3,

                WebkitBoxOrient:
                  "vertical",

                overflow:
                  "hidden",
              }}
            >
              “{data.note?.trim()}”
            </p>
          </div>
        )}

        {/* RESUMEN SOBRE EL MAPA */}
        <div
          style={{
            position:
              "absolute",

            left:
              "12px",

            top:
              "12px",

            zIndex:
              4,

            display:
              "inline-flex",

            alignItems:
              "center",

            gap:
              "7px",

            padding:
              "7px 9px",

            borderRadius:
              "999px",

            background:
              "rgba(7,8,15,0.74)",

            border:
              "1px solid rgba(255,255,255,0.10)",

            backdropFilter:
              "blur(9px)",

            color:
              "#FFFFFF",

            fontSize:
              "8px",

            fontWeight:
              800,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width:
                "7px",

              height:
                "7px",

              borderRadius:
                "50%",

              backgroundColor:
                MAGENTA,

              boxShadow:
                "0 0 9px rgba(255,0,255,0.92)",
            }}
          />

          {routeSummary.points} puntos ·{" "}
          {routeSummary.memories} recuerdos
        </div>
      </section>

      {/* MÉTRICAS */}
      <section
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",

          gap:
            "8px",

          margin:
            "12px 13px 0",
        }}
      >
        <Metric
          label="Distancia"
          value={
            formattedDistance
          }
        />

        <Metric
          label="Tiempo"
          value={
            formattedTime
          }
        />

        <Metric
          label="Hitos"
          value={`${memoryCount}`}
          accent
        />
      </section>

      {/* REACCIONES */}
      {experienceId && (
        <section
          style={{
            padding:
              "13px 13px 0",
          }}
        >
          <p
            style={{
              margin:
                "0 0 8px",

              color:
                "rgba(255,255,255,0.46)",

              fontSize:
                "8px",

              fontWeight:
                850,

              letterSpacing:
                "0.09em",

              textTransform:
                "uppercase",
            }}
          >
            ¿Qué te dejó esta experiencia?
          </p>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",

              gap:
                "7px",
            }}
          >
            {REACTIONS.map(
              (reaction) => {
                const Icon =
                  reaction.icon;

                const selected =
                  selectedReaction ===
                  reaction.id;

                return (
                  <button
                    key={
                      reaction.id
                    }
                    type="button"
                    onClick={() =>
                      handleReaction(
                        reaction.id
                      )
                    }
                    aria-pressed={
                      selected
                    }
                    title={
                      reaction.label
                    }
                    style={{
                      minWidth:
                        0,

                      minHeight:
                        "56px",

                      padding:
                        "8px 5px",

                      display:
                        "flex",

                      flexDirection:
                        "column",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      gap:
                        "5px",

                      borderRadius:
                        "14px",

                      border:
                        selected
                          ? "1px solid rgba(255,0,255,0.62)"
                          : "1px solid rgba(255,255,255,0.08)",

                      background:
                        selected
                          ? "linear-gradient(145deg, rgba(255,0,255,0.22), rgba(18,19,34,0.98))"
                          : "rgba(255,255,255,0.035)",

                      color:
                        selected
                          ? MAGENTA_SOFT
                          : "rgba(255,255,255,0.70)",

                      boxShadow:
                        selected
                          ? "0 0 18px rgba(255,0,255,0.16)"
                          : "none",

                      cursor:
                        "pointer",
                    }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={
                        selected
                          ? 2.2
                          : 1.7
                      }
                    />

                    <span
                      style={{
                        maxWidth:
                          "100%",

                        overflow:
                          "hidden",

                        textOverflow:
                          "ellipsis",

                        color:
                          "inherit",

                        fontSize:
                          "8px",

                        fontWeight:
                          800,

                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {
                        reaction.compactLabel
                      }
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>
      )}

      {/* ACCIONES */}
      <footer
        style={{
          padding:
            "14px 13px 11px",
        }}
      >
        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              onDownload
                ? "48px minmax(0, 1fr)"
                : "1fr",

            gap:
              "8px",
          }}
        >
          {onDownload && (
            <button
              type="button"
              onClick={
                onDownload
              }
              aria-label="Descargar imagen"
              title="Descargar imagen"
              style={{
                minHeight:
                  "46px",

                display:
                  "inline-flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                borderRadius:
                  "14px",

                border:
                  "1px solid rgba(0,230,255,0.25)",

                background:
                  "rgba(0,230,255,0.06)",

                color:
                  CYAN,

                cursor:
                  "pointer",

                boxShadow:
                  "0 0 15px rgba(0,230,255,0.07)",
              }}
            >
              <Download
                size={19}
                strokeWidth={2}
              />
            </button>
          )}

          <button
            type="button"
            onClick={
              onShare
            }
            style={{
              minHeight:
                "46px",

              display:
                "inline-flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              gap:
                "8px",

              padding:
                "9px 18px",

              border:
                "1px solid rgba(255,255,255,0.12)",

              borderRadius:
                "14px",

              background:
                "linear-gradient(145deg, #FF3DE8, #D4008D)",

              color:
                "#FFFFFF",

              fontSize:
                "12px",

              fontWeight:
                900,

              cursor:
                "pointer",

              boxShadow:
                "0 9px 24px rgba(255,0,184,0.26)",
            }}
          >
            <Share2
              size={17}
              strokeWidth={2.1}
            />

            Compartir momento
          </button>
        </div>

        <p
          style={{
            margin:
              "13px 0 0",

            color:
              "rgba(255,255,255,0.28)",

            fontSize:
              "7px",

            fontWeight:
              850,

            letterSpacing:
              "0.11em",

            textAlign:
              "center",

            textTransform:
              "uppercase",
          }}
        >
          No visites. Pertenece. Vive la ciudad como un local.
        </p>
      </footer>
    </article>
  );
});

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
        minWidth:
          0,

        minHeight:
          "66px",

        display:
          "flex",

        flexDirection:
          "column",

        justifyContent:
          "center",

        padding:
          "9px 7px",

        borderRadius:
          "14px",

        background:
          "rgba(255,255,255,0.038)",

        border:
          accent
            ? "1px solid rgba(255,0,255,0.18)"
            : "1px solid rgba(255,255,255,0.06)",

        textAlign:
          "center",
      }}
    >
      <span
        style={{
          display:
            "block",

          color:
            "rgba(255,255,255,0.38)",

          fontSize:
            "7px",

          fontWeight:
            800,

          textTransform:
            "uppercase",

          letterSpacing:
            "0.07em",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display:
            "block",

          marginTop:
            "6px",

          color:
            accent
              ? MAGENTA_SOFT
              : "#FFFFFF",

          fontSize:
            "13px",

          fontFamily:
            "monospace",

          whiteSpace:
            "nowrap",

          textShadow:
            accent
              ? "0 0 9px rgba(255,0,255,0.32)"
              : "none",
        }}
      >
        {value}
      </strong>
    </div>
  );
};

MemoryCard.displayName = "MemoryCard";

export default MemoryCard;