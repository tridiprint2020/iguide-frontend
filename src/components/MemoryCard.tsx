import {
  Theme,
} from "../styles/theme";

import MemoryMapCanvas from "./sharing/MemoryMapCanvas";

import logo from "../assets/placeholders/logo-iguide.png";

import type {
  MemoryCardData,
} from "../types/memoryCard";

type Props = {
  data: MemoryCardData;
  onShare: () => void;
  onDownload?: () => void;
};

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
        "Completado",

      icon:
        "🏁",

      color:
        "#41E28A",

      background:
        "rgba(65,226,138,0.10)",

      border:
        "rgba(65,226,138,0.28)",
    };
  }

  if (hasAbort) {
    return {
      label:
        "Ruta conservada",

      icon:
        "●",

      color:
        "#FF8A00",

      background:
        "rgba(255,138,0,0.10)",

      border:
        "rgba(255,138,0,0.34)",
    };
  }

  return {
    label:
      "Ruta registrada",

    icon:
      "🧭",

    color:
      "#FFFFFF",

    background:
      "rgba(255,255,255,0.06)",

    border:
      "rgba(255,255,255,0.11)",
  };
}

function MemoryCard({
  data,
  onShare,
  onDownload,
}: Props) {
  const hasPhoto =
    Boolean(data.photo);

  const hasUserNote =
    isUserNote(data.note);

  const status =
    getJourneyStatus(data);

  const formattedDistance =
    `${data.stats.totalDistanceKm.toFixed(
      2
    )} km`;

  const formattedTime =
    formatDuration(
      data.stats.durationSeconds
    );

  return (
    <article
      style={{
        width:
          "min(88vw, 350px)",

        boxSizing:
          "border-box",

        overflow:
          "hidden",

        borderRadius:
          "24px",

        background:
          "linear-gradient(180deg, #1B1B1B 0%, #101010 100%)",

        border:
          "1px solid rgba(255,255,255,0.08)",

        boxShadow:
          "0 22px 50px rgba(0,0,0,0.48)",

        color:
          "#FFFFFF",
      }}
    >
      {/* MARCA Y NOMBRE */}
      <header
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "11px",

          padding:
            "18px 18px 15px",

          borderBottom:
            "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <img
          src={logo}
          alt="I.GUIDE"
          style={{
            width:
              "38px",

            height:
              "38px",

            flexShrink:
              0,

            objectFit:
              "contain",

            borderRadius:
              "8px",

            backgroundColor:
              "#FFFFFF",
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
          <span
            style={{
              display:
                "block",

              color:
                Theme.Colors.primary,

              fontSize:
                "10px",

              fontWeight:
                850,

              letterSpacing:
                "0.13em",

              textTransform:
                "uppercase",
            }}
          >
            Feel the City
          </span>

          <h2
            style={{
              margin:
                "3px 0 0",

              color:
                "#FFFFFF",

              fontSize:
                "20px",

              lineHeight:
                1.12,

              fontWeight:
                850,

              overflowWrap:
                "anywhere",
            }}
          >
            {data.title}
          </h2>
        </div>
      </header>

      {/* UBICACIÓN */}
      <section
        style={{
          padding:
            "12px 18px 0",

          textAlign:
            "center",
        }}
      >
        {data.placeLabel && (
          <p
            style={{
              margin:
                "0 0 5px",

              color:
                "rgba(255,255,255,0.72)",

              fontSize:
                "12px",

              lineHeight:
                1.4,
            }}
          >
            📍 {data.placeLabel}
          </p>
        )}

        <p
          style={{
            margin:
              0,

            color:
              "rgba(255,255,255,0.45)",

            fontSize:
              "11px",
          }}
        >
          {data.city} · {data.date}
        </p>
      </section>

      {/* MAPA O FOTOGRAFÍA PROTAGONISTA */}
      <section
        style={{
          position:
            "relative",

          height:
            "310px",

          margin:
            "14px 14px 0",

          overflow:
            "hidden",

          borderRadius:
            "18px",

          backgroundColor:
            "#080808",

          border:
            "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {hasPhoto ? (
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
        ) : data.mapBackground ? (
         <MemoryMapCanvas
  center={
    data.mapBackground.center
  }
  path={
    data.mapBackground.path
  }
  memories={
    data.mapBackground.memories
  }
  waypoints={
    data.waypoints ?? []
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

              alignItems:
                "center",

              justifyContent:
                "center",

              color:
                "rgba(255,255,255,0.42)",

              fontSize:
                "11px",
            }}
          >
            Preparando visualización…
          </div>
        )}

        {/* Degradado mínimo */}
        <div
          aria-hidden="true"
          style={{
            position:
              "absolute",

            inset:
              0,

            background:
              "linear-gradient(to top, rgba(4,4,4,0.28), transparent 44%)",

            pointerEvents:
              "none",
          }}
        />

        {/* NOTA REAL DEL USUARIO: MÁXIMO 1/4 DEL ÁREA */}
        {hasUserNote && (
          <div
            style={{
              position:
                "absolute",

              left:
                "12px",

              right:
                "12px",

              bottom:
                "12px",

              zIndex:
                3,

              maxHeight:
                "72px",

              overflow:
                "hidden",

              padding:
                "9px 11px",

              borderRadius:
                "12px",

              background:
                "rgba(8,8,8,0.78)",

              border:
                "1px solid rgba(255,255,255,0.09)",

              backdropFilter:
                "blur(9px)",
            }}
          >
            <p
              style={{
                margin:
                  0,

                color:
                  "#FFFFFF",

                fontSize:
                  "11px",

                lineHeight:
                  1.4,

                fontStyle:
                  "italic",

                fontWeight:
                  550,

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
      </section>

      {/* MÉTRICAS */}
      <section
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",

          gap:
            "7px",

          margin:
            "12px 14px 0",

          padding:
            "12px 8px",

          borderRadius:
            "14px",

          backgroundColor:
            "rgba(255,255,255,0.045)",

          border:
            "1px solid rgba(255,255,255,0.06)",

          textAlign:
            "center",
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
          value={`${data.stats.totalMemories} 🔮`}
          accent
        />
      </section>

      {/* TIMELINE */}
      {data.waypoints &&
        data.waypoints.length > 0 && (
          <div
            style={{
              margin:
                "10px 14px 0",
            }}
          >
            
          </div>
        )}

      {/* ESTADO Y ACCIONES */}
      <footer
        style={{
          padding:
            "14px 14px 11px",
        }}
      >
        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            gap:
              "9px",

            flexWrap:
              "wrap",
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "7px",

              minHeight:
                "40px",

              boxSizing:
                "border-box",

              padding:
                "7px 11px",

              borderRadius:
                "999px",

              background:
                status.background,

              border:
                `1px solid ${status.border}`,

              color:
                status.color,

              fontSize:
                "10px",

              fontWeight:
                800,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                color:
                  status.color,

                fontSize:
                  "15px",

                lineHeight:
                  1,
              }}
            >
              {status.icon}
            </span>

            <span>
              {status.label}
            </span>
          </div>

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "7px",
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
                  width:
                    "42px",

                  height:
                    "40px",

                  borderRadius:
                    "12px",

                  border:
                    "1px solid rgba(255,255,255,0.11)",

                  background:
                    "rgba(255,255,255,0.06)",

                  color:
                    "#FFFFFF",

                  cursor:
                    "pointer",

                  fontSize:
                    "17px",

                  fontWeight:
                    800,
                }}
              >
                ↓
              </button>
            )}

            <button
              type="button"
              onClick={
                onShare
              }
              style={{
                minHeight:
                  "40px",

                padding:
                  "8px 18px",

                border:
                  "none",

                borderRadius:
                  Theme.Radius.pill,

                backgroundColor:
                  Theme.Colors.primary,

                color:
                  "#FFFFFF",

                fontSize:
                  "12px",

                fontWeight:
                  800,

                cursor:
                  "pointer",

                boxShadow:
                  "0 5px 14px rgba(255,0,122,0.30)",
              }}
            >
              Compartir
            </button>
          </div>
        </div>

        <p
          style={{
            margin:
              "14px 0 0",

            color:
              "rgba(255,255,255,0.32)",

            fontSize:
              "8px",

            fontWeight:
              750,

            letterSpacing:
              "0.08em",

            textAlign:
              "center",

            textTransform:
              "uppercase",
          }}
        >
          Explora la esencia oculta de la ciudad.
        </p>
      </footer>
    </article>
  );
}

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
      }}
    >
      <span
        style={{
          display:
            "block",

          color:
            "rgba(255,255,255,0.38)",

          fontSize:
            "8px",

          textTransform:
            "uppercase",

          letterSpacing:
            "0.03em",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display:
            "block",

          marginTop:
            "5px",

          color:
            accent
              ? Theme.Colors.primary
              : "#FFFFFF",

          fontSize:
            "12px",

          fontFamily:
            "monospace",

          whiteSpace:
            "nowrap",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

export default MemoryCard;