import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

import {
  catalog,
} from "../data/catalog";

import {
  loadUserProfile,
} from "../data/user";

import {
  loadAllTrackSessions,
} from "../engine/trackingEngine";

import {
  MemoryCardEngine,
} from "../engine/memoryCardEngine";

import {
  shareEngine,
} from "../engine/shareEngine";

import {
  Theme,
} from "../styles/theme";

import MemoryCardModal from "./sharing/MemoryCardModal";
import QhapaqNanLayer from "./maps/QhapaqNanLayer";

import type {
  Experience,
} from "../types/experience";

import type {
  ExpeditionTrack,
  TimelineItem,
} from "../types/tracking/tracking";

import type {
  MemoryCardData,
} from "../types/memoryCard";

interface Props {
  track: ExpeditionTrack | null;
}

type TrackBundle = {
  experience: Experience;
  track: ExpeditionTrack;

  routePath: [
    number,
    number,
  ][];

  startPoint:
    | TimelineItem
    | null;

  abortPoint:
    | TimelineItem
    | null;

  finishPoint:
    | TimelineItem
    | null;

  memoryNodes: TimelineItem[];
};

/*
 * Corrección de los iconos
 * predeterminados de Leaflet.
 */
delete (
  L.Icon.Default.prototype as
    L.Icon.Default & {
      _getIconUrl?: unknown;
    }
)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER: [
  number,
  number,
] = [
  -12.06513,
  -75.20486,
];

const WINE = "#7A123D";
const ORANGE = "#FF8A00";

function findLastTimelineItem(
  timeline: TimelineItem[],
  type: TimelineItem["type"]
): TimelineItem | null {
  for (
    let index =
      timeline.length - 1;
    index >= 0;
    index -= 1
  ) {
    if (
      timeline[index].type ===
      type
    ) {
      return timeline[index];
    }
  }

  return null;
}

function MapView({
  track,
}: Props) {
  const navigate =
    useNavigate();

  const [
    selectedCard,
    setSelectedCard,
  ] =
    useState<MemoryCardData | null>(
      null
    );

  const [
    showQhapaqNan,
    setShowQhapaqNan,
  ] = useState(false);

  const user =
    loadUserProfile();

  /*
   * Explorer recupera todas las sesiones:
   *
   * - activas;
   * - completadas;
   * - abandonadas;
   * - históricas.
   *
   * Así los recuerdos continúan apareciendo
   * aunque el puntero activo haya sido eliminado.
   */
  const trackBundles =
    useMemo<TrackBundle[]>(() => {
      const bundles: TrackBundle[] =
        [];

      for (
        const experience of catalog
      ) {
        const storedSessions =
          loadAllTrackSessions(
            experience.experienceId
          );

        for (
          const persistedTrack of storedSessions
        ) {
          const routeNodes =
            persistedTrack.timeline.filter(
              (item) =>
                item.type === "start" ||
                item.type === "walk" ||
                item.type === "abort" ||
                item.type === "finish"
            );

          const routePath: [
            number,
            number,
          ][] =
            routeNodes.map(
              (point) => [
                point.lat,
                point.lng,
              ]
            );

          const startPoint =
            persistedTrack.timeline.find(
              (item) =>
                item.type === "start"
            ) ?? null;

          const abortPoint =
            findLastTimelineItem(
              persistedTrack.timeline,
              "abort"
            );

          const finishPoint =
            findLastTimelineItem(
              persistedTrack.timeline,
              "finish"
            );

          const memoryNodes =
            persistedTrack.timeline.filter(
              (item) =>
                item.type === "memory"
            );

          bundles.push({
            experience,
            track: persistedTrack,
            routePath,
            startPoint,
            abortPoint,
            finishPoint,
            memoryNodes,
          });
        }
      }

      return bundles;
    }, [track]);

  const activePath =
    track?.timeline.filter(
      (item) =>
        item.type === "start" ||
        item.type === "walk" ||
        item.type === "abort" ||
        item.type === "finish"
    ) ?? [];

  const mapCenter: [
    number,
    number,
  ] =
    activePath.length > 0
      ? [
          activePath[0].lat,
          activePath[0].lng,
        ]
      : DEFAULT_CENTER;

  function closeMemoryCard() {
    setSelectedCard(null);
  }

  /*
   * La tarjeta se construye solamente
   * cuando el usuario toca un hito.
   */
  function openTimelineCard(
    experience: Experience,
    expeditionTrack: ExpeditionTrack,
    item: TimelineItem
  ) {
    const cardData =
      MemoryCardEngine
        .buildFromTimelineItem(
          experience,
          expeditionTrack,
          item
        );

    setSelectedCard(
      cardData
    );
  }

  return (
    <>
      <section
        style={{
          backgroundColor:
            Theme.Colors.surface,

          borderRadius:
            Theme.Radius.large,

          padding: "10px",

          boxShadow:
            Theme.Shadows.card,

          marginTop:
            Theme.Space.md,

          marginLeft: "-6px",
          marginRight: "-6px",
        }}
      >
        <header
          style={{
            display: "flex",

            justifyContent:
              "space-between",

            alignItems: "center",

            gap: "10px",

            marginBottom: "10px",
          }}
        >
          <div>
            <strong
              style={{
                color:
                  Theme.Colors.text,

                fontSize: "14px",
              }}
            >
              Mapa de exploración
            </strong>

            <p
              style={{
                margin:
                  "3px 0 0",

                color:
                  Theme.Colors.textSoft,

                fontSize: "10px",
              }}
            >
              Rutas, experiencias y
              patrimonio
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowQhapaqNan(
                (current) =>
                  !current
              )
            }
            aria-pressed={
              showQhapaqNan
            }
            style={{
              minHeight: "38px",

              padding:
                "7px 11px",

              borderRadius:
                "11px",

              border:
                showQhapaqNan
                  ? `1px solid ${ORANGE}`
                  : "1px solid rgba(255,255,255,0.12)",

              backgroundColor:
                showQhapaqNan
                  ? "rgba(255,138,0,0.15)"
                  : "rgba(255,255,255,0.05)",

              color:
                showQhapaqNan
                  ? ORANGE
                  : Theme.Colors.text,

              fontSize: "11px",

              fontWeight: 800,

              cursor: "pointer",
            }}
          >
            {showQhapaqNan
              ? "✓ Qhapaq Ñan"
              : "Qhapaq Ñan"}
          </button>
        </header>

        {showQhapaqNan && (
          <div
            style={{
              display: "flex",

              alignItems: "center",

              gap: "7px",

              marginBottom:
                "9px",

              padding:
                "7px 9px",

              borderRadius:
                "9px",

              backgroundColor:
                "rgba(255,138,0,0.09)",

              color:
                Theme.Colors.textSoft,

              fontSize: "10px",

              lineHeight: 1.35,
            }}
          >
            <span
              style={{
                display:
                  "inline-block",

                width: "24px",

                borderTop:
                  `3px dashed ${ORANGE}`,
              }}
            />

            Camino prehispánico del
            Valle del Mantaro
          </div>
        )}

        <div
          style={{
            position: "relative",

            height: "520px",

            borderRadius:
              Theme.Radius.medium,

            overflow: "hidden",
          }}
        >
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom
            preferCanvas
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <QhapaqNanLayer
              visible={
                showQhapaqNan
              }
            />

            {/* PINES DEL CATÁLOGO */}
            {catalog.map(
              (experience) => {
                const isVisited =
                  user.visitedExperiences
                    ?.includes(
                      experience.experienceId
                    ) ?? false;

                const experienceImage =
                  experience.image ||
                  experience.coverImage;

                return (
                  <Marker
                    key={
                      experience.experienceId
                    }
                    position={[
                      experience.latitude,
                      experience.longitude,
                    ]}
                  >
                    <Popup
                      minWidth={260}
                    >
                      <article
                        style={{
                          width: "235px",
                          color: "#161616",
                        }}
                      >
                        {experienceImage && (
                          <img
                            src={
                              experienceImage
                            }
                            alt={
                              experience.title
                            }
                            loading="lazy"
                            style={{
                              width:
                                "100%",

                              height:
                                "105px",

                              objectFit:
                                "cover",

                              borderRadius:
                                "11px",

                              marginBottom:
                                "9px",

                              backgroundColor:
                                "#EFEFEF",
                            }}
                          />
                        )}

                        <div
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "flex-start",

                            gap: "8px",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                margin:
                                  "0 0 3px",

                                color:
                                  Theme
                                    .Colors
                                    .primary,

                                fontSize:
                                  "10px",

                                fontWeight:
                                  800,

                                textTransform:
                                  "uppercase",

                                letterSpacing:
                                  "0.08em",
                              }}
                            >
                              {
                                experience.type
                              }
                            </p>

                            <h3
                              style={{
                                margin:
                                  0,

                                fontSize:
                                  "17px",
                              }}
                            >
                              {
                                experience.title
                              }
                            </h3>
                          </div>

                          {isVisited && (
                            <span
                              title="Lugar visitado"
                              style={{
                                fontSize:
                                  "17px",
                              }}
                            >
                              ✔️
                            </span>
                          )}
                        </div>

                        <p
                          style={{
                            margin:
                              "8px 0 10px",

                            color:
                              "#666666",

                            fontSize:
                              "12px",

                            lineHeight:
                              1.4,
                          }}
                        >
                          {
                            experience.description
                          }
                        </p>

                        {"openingHours" in
                          experience &&
                          experience.openingHours && (
                            <p
                              style={{
                                margin:
                                  "0 0 10px",

                                color:
                                  "#444444",

                                fontSize:
                                  "11px",

                                fontWeight:
                                  600,
                              }}
                            >
                              🕒{" "}
                              {
                                experience.openingHours
                              }
                            </p>
                          )}

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/expedition/${experience.slug}`
                            )
                          }
                          style={{
                            width:
                              "100%",

                            minHeight:
                              "42px",

                            border:
                              "none",

                            borderRadius:
                              "11px",

                            backgroundColor:
                              Theme
                                .Colors
                                .primary,

                            color:
                              "#FFFFFF",

                            fontWeight:
                              800,

                            cursor:
                              "pointer",
                          }}
                        >
                          Ver plan e iniciar
                        </button>
                      </article>
                    </Popup>
                  </Marker>
                );
              }
            )}

            {/* RUTAS HISTÓRICAS Y ACTIVAS */}
            {trackBundles.map(
              ({
                experience,
                track:
                  expeditionTrack,
                routePath,
              }) => {
                if (
                  routePath.length < 2
                ) {
                  return null;
                }

                const hasAbort =
                  expeditionTrack.timeline.some(
                    (item) =>
                      item.type === "abort"
                  );

                const hasFinish =
                  expeditionTrack.timeline.some(
                    (item) =>
                      item.type === "finish"
                  );

                const routeColor =
                  hasAbort &&
                  !hasFinish
                    ? ORANGE
                    : Theme.Colors.primary;

                return (
                  <Polyline
                    key={`track-${experience.experienceId}-${expeditionTrack.sessionId}`}
                    positions={
                      routePath
                    }
                    pathOptions={{
                      color:
                        routeColor,

                      weight: 4,

                      lineCap:
                        "round",

                      lineJoin:
                        "round",

                      opacity:
                        0.88,
                    }}
                  />
                );
              }
            )}

            {/* INICIO, ABANDONO Y FINAL */}
            {trackBundles.map(
              ({
                experience,
                track:
                  expeditionTrack,
                startPoint,
                abortPoint,
                finishPoint,
              }) => (
                <div
                  key={`edges-${experience.experienceId}-${expeditionTrack.sessionId}`}
                >
                  {startPoint && (
                    <CircleMarker
                      center={[
                        startPoint.lat,
                        startPoint.lng,
                      ]}
                      radius={11}
                      pathOptions={{
                        color:
                          "#FFFFFF",

                        weight: 2,

                        fillColor:
                          WINE,

                        fillOpacity:
                          1,
                      }}
                    >
                      <Popup
                        minWidth={210}
                      >
                        <TimelinePopup
                          title="🚀 Inicio del recorrido"
                          experienceTitle={
                            experience.title
                          }
                          buttonColor={
                            WINE
                          }
                          onOpen={() =>
                            openTimelineCard(
                              experience,
                              expeditionTrack,
                              startPoint
                            )
                          }
                        />
                      </Popup>
                    </CircleMarker>
                  )}

                  {abortPoint &&
                    !finishPoint && (
                      <CircleMarker
                        center={[
                          abortPoint.lat,
                          abortPoint.lng,
                        ]}
                        radius={10}
                        pathOptions={{
                          color:
                            "#FFFFFF",

                          weight: 2,

                          fillColor:
                            ORANGE,

                          fillOpacity:
                            1,
                        }}
                      >
                        <Popup
                          minWidth={
                            210
                          }
                        >
                          <TimelinePopup
                            title="🟠 Recorrido conservado"
                            experienceTitle={
                              experience.title
                            }
                            buttonColor={
                              ORANGE
                            }
                            onOpen={() =>
                              openTimelineCard(
                                experience,
                                expeditionTrack,
                                abortPoint
                              )
                            }
                          />
                        </Popup>
                      </CircleMarker>
                    )}

                  {finishPoint && (
                    <CircleMarker
                      center={[
                        finishPoint.lat,
                        finishPoint.lng,
                      ]}
                      radius={12}
                      pathOptions={{
                        color:
                          "#FFFFFF",

                        weight: 2,

                        fillColor:
                          WINE,

                        fillOpacity:
                          1,
                      }}
                    >
                      <Popup
                        minWidth={210}
                      >
                        <TimelinePopup
                          title="🏁 Expedición completada"
                          experienceTitle={
                            experience.title
                          }
                          buttonColor={
                            WINE
                          }
                          onOpen={() =>
                            openTimelineCard(
                              experience,
                              expeditionTrack,
                              finishPoint
                            )
                          }
                        />
                      </Popup>
                    </CircleMarker>
                  )}
                </div>
              )
            )}

            {/* RECUERDOS DE TODAS LAS SESIONES */}
            {trackBundles.flatMap(
              ({
                experience,
                track:
                  expeditionTrack,
                memoryNodes,
              }) =>
                memoryNodes.map(
                  (
                    memory,
                    index
                  ) => (
                    <CircleMarker
                      key={
                        memory.id ||
                        `memory-${experience.experienceId}-${expeditionTrack.sessionId}-${index}`
                      }
                      center={[
                        memory.lat,
                        memory.lng,
                      ]}
                      radius={11}
                      pathOptions={{
                        color:
                          "#FFFFFF",

                        weight: 2,

                        fillColor:
                          Theme.Colors
                            .primary,

                        fillOpacity:
                          1,
                      }}
                    >
                      <Popup
                        minWidth={210}
                      >
                        <TimelinePopup
                          title="📸 Recuerdo guardado"
                          experienceTitle={
                            experience.title
                          }
                          buttonColor={
                            Theme.Colors
                              .primary
                          }
                          onOpen={() =>
                            openTimelineCard(
                              experience,
                              expeditionTrack,
                              memory
                            )
                          }
                        />
                      </Popup>
                    </CircleMarker>
                  )
                )
            )}
          </MapContainer>
        </div>
      </section>

      <MemoryCardModal
        open={
          selectedCard !== null
        }
        data={selectedCard}
        onClose={
          closeMemoryCard
        }
        onShare={(data) =>
          shareEngine.shareMemory(
            data
          )
        }
      />
    </>
  );
}

type TimelinePopupProps = {
  title: string;
  experienceTitle: string;
  buttonColor: string;
  onOpen: () => void;
};

function TimelinePopup({
  title,
  experienceTitle,
  buttonColor,
  onOpen,
}: TimelinePopupProps) {
  return (
    <div
      style={{
        padding: "7px",

        color: "#161616",

        textAlign: "center",
      }}
    >
      <strong>
        {title}
      </strong>

      <p
        style={{
          margin:
            "7px 0 11px",

          fontSize: "12px",

          color: "#666666",
        }}
      >
        {experienceTitle}
      </p>

      <button
        type="button"
        onClick={onOpen}
        style={{
          width: "100%",

          minHeight: "38px",

          border: "none",

          borderRadius:
            "10px",

          backgroundColor:
            buttonColor,

          color: "#FFFFFF",

          fontWeight: 700,

          cursor: "pointer",
        }}
      >
        Ver Memory Card
      </button>
    </div>
  );
}

export default MapView;