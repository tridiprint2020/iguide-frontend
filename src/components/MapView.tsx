import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Share2,
} from "lucide-react";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
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
  getTimelineRouteSegments,
  loadAllTrackSessions,
} from "../engine/trackingEngine";

import {
  MemoryCardEngine,
} from "../engine/memoryCardEngine";

import {
  shareEngine,
} from "../engine/shareEngine";

import {
  useJourney,
} from "../context/JourneyContext";

import {
  Theme,
} from "../styles/theme";

import MemoryCardModal from "./sharing/MemoryCardModal";
import ExperienceMapCard from "./maps/ExperienceMapCard";
import IguideMapPinStyles from "./maps/IguideMapPinStyles";
import QhapaqNanLayer from "./maps/QhapaqNanLayer";
import UserLocationLayer from "./maps/UserLocationLayer";

import {
  createIguidePin,
} from "./maps/iguideMapPins";

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
import { tx } from "../i18n";

interface Props {
  track: ExpeditionTrack | null;
}

type TrackBundle = {
  experience: Experience;
  track: ExpeditionTrack;
  routeSegments: [number, number][][];
  startPoint: TimelineItem | null;
  abortPoint: TimelineItem | null;
  finishPoint: TimelineItem | null;
  memoryNodes: TimelineItem[];
};

const DEFAULT_CENTER: [number, number] = [
  -12.06513,
  -75.20486,
];

const DEFAULT_ZOOM = 15;
const MAP_VIEW_STORAGE_KEY =
  "iguide_explorer_map_view";
const MAX_VISIBLE_ROUTE_POINTS = 110;

type SavedMapView = {
  center: [number, number];
  zoom: number;
};

function loadSavedMapView(): SavedMapView | null {
  try {
    const raw =
      localStorage.getItem(
        MAP_VIEW_STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw) as
        Partial<SavedMapView>;

    if (
      !Array.isArray(parsed.center) ||
      parsed.center.length !== 2 ||
      typeof parsed.center[0] !== "number" ||
      typeof parsed.center[1] !== "number" ||
      typeof parsed.zoom !== "number"
    ) {
      return null;
    }

    return {
      center: [
        parsed.center[0],
        parsed.center[1],
      ],
      zoom: Math.min(
        20,
        Math.max(12, parsed.zoom)
      ),
    };
  } catch {
    return null;
  }
}

function simplifyRoutePath(
  path: [number, number][],
  maxPoints =
    MAX_VISIBLE_ROUTE_POINTS
): [number, number][] {
  if (path.length <= maxPoints) {
    return path;
  }

  const lastIndex =
    path.length - 1;

  const simplified:
    [number, number][] = [];

  for (
    let index = 0;
    index < maxPoints;
    index += 1
  ) {
    const sourceIndex =
      Math.round(
        (index / (maxPoints - 1)) *
          lastIndex
      );

    const point =
      path[sourceIndex];

    if (
      simplified.length === 0 ||
      simplified[
        simplified.length - 1
      ][0] !== point[0] ||
      simplified[
        simplified.length - 1
      ][1] !== point[1]
    ) {
      simplified.push(point);
    }
  }

  return simplified;
}

function MapViewPersistence() {
  useMapEvents({
    moveend(event) {
      const map =
        event.target;

      const center =
        map.getCenter();

      const savedView:
        SavedMapView = {
        center: [
          center.lat,
          center.lng,
        ],
        zoom:
          map.getZoom(),
      };

      localStorage.setItem(
        MAP_VIEW_STORAGE_KEY,
        JSON.stringify(savedView)
      );
    },
  });

  return null;
}

/**
 * Captura la instancia real de Leaflet en un ref mutable
 * para que los handlers de click de los markers (definidos
 * en MapView, fuera del árbol de contexto de MapContainer)
 * puedan llamar flyTo/fitBounds sin necesidad de prop drilling.
 */
function MapInstanceBinder({
  mapRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  return null;
}

const MAGENTA = "#FF00FF";
const ORANGE = "#FF8A00";

function findLastTimelineItem(
  timeline: TimelineItem[],
  type: TimelineItem["type"]
): TimelineItem | null {
  for (
    let index = timeline.length - 1;
    index >= 0;
    index -= 1
  ) {
    if (timeline[index].type === type) {
      return timeline[index];
    }
  }
  return null;
}

function MapView({ track }: Props) {
  const navigate = useNavigate();
  const {
    journey,
    startWalking,
  } = useJourney();
  const [selectedCard, setSelectedCard] =
    useState<MemoryCardData | null>(null);
  const [showQhapaqNan, setShowQhapaqNan] =
    useState(false);
  const [user, setUser] =
    useState(() => loadUserProfile());

  useEffect(() => {
    function syncUser() {
      setUser(loadUserProfile());
    }

    window.addEventListener(
      "iguide-user-updated",
      syncUser
    );

    return () => {
      window.removeEventListener(
        "iguide-user-updated",
        syncUser
      );
    };
  }, []);

  const mapInstanceRef =
    useRef<L.Map | null>(null);

  const savedMapView =
    useMemo(
      () => loadSavedMapView(),
      []
    );

  function handleStartMission(
    experience: Experience
  ) {
    const activeExperience =
      journey.experience;

    const hasActiveJourney =
      journey.state !== "IDLE" &&
      journey.state !== "COMPLETED" &&
      journey.state !== "ABORTED";

    if (
      activeExperience &&
      hasActiveJourney &&
      activeExperience.experienceId !==
        experience.experienceId
    ) {
      alert(
        `Ya tienes una misión activa: ${activeExperience.title}. Continúala o abandónala antes de iniciar otra.`
      );

      return;
    }

    const missionStarted =
      startWalking(experience);

    if (missionStarted) {
      navigate("/journey");
    }
  }

  const trackBundles =
    useMemo<TrackBundle[]>(() => {
      const bundles: TrackBundle[] = [];

      for (const experience of catalog) {
        const storedSessions =
          loadAllTrackSessions(
            experience.experienceId
          );

        for (const persistedTrack of storedSessions) {
          const routeSegments =
            getTimelineRouteSegments(
              persistedTrack.timeline
            )
              .map(
                (segment) =>
                  simplifyRoutePath(
                    segment
                  )
              )
              .filter(
                (segment) =>
                  segment.length >= 2
              );

          bundles.push({
            experience,
            track: persistedTrack,
            routeSegments,
            startPoint:
              persistedTrack.timeline.find(
                (item) => item.type === "start"
              ) ?? null,
            abortPoint:
              findLastTimelineItem(
                persistedTrack.timeline,
                "abort"
              ),
            finishPoint:
              findLastTimelineItem(
                persistedTrack.timeline,
                "finish"
              ),
            memoryNodes:
              persistedTrack.timeline.filter(
                (item) => item.type === "memory"
              ),
          });
        }
      }

      return bundles;
    }, [track]);

  const latestTrackBundle =
    useMemo(
      () =>
        trackBundles.reduce<TrackBundle | null>(
          (latest, candidate) =>
            !latest ||
            candidate.track.startedAt > latest.track.startedAt
              ? candidate
              : latest,
          null
        ),
      [trackBundles]
    );

  const activePath =
    track?.timeline.filter(
      (item) =>
        item.type === "start" ||
        item.type === "walk" ||
        item.type === "abort" ||
        item.type === "finish"
    ) ?? [];

  const mapCenter: [number, number] =
    activePath.length > 0
      ? [
          activePath[
            activePath.length - 1
          ].lat,
          activePath[
            activePath.length - 1
          ].lng,
        ]
      : savedMapView?.center ??
        DEFAULT_CENTER;

  const initialZoom =
    activePath.length > 0
      ? 17
      : savedMapView?.zoom ??
        DEFAULT_ZOOM;

  /*
   * 3) RECORRIDO ACTIVO: ZOOM MÁXIMO ~150 m
   *
   * mapCenter/initialZoom solo controlan la vista INICIAL
   * de MapContainer (es de solo lectura tras el montaje).
   * Para que el mapa siga el recorrido mientras llegan nuevos
   * puntos GPS, ajustamos la vista en vivo a través del ref.
   */
  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || activePath.length === 0) {
      return;
    }

    if (activePath.length === 1) {
      map.setView(
        [
          activePath[0].lat,
          activePath[0].lng,
        ],
        18,
        { animate: true }
      );
      return;
    }

    const bounds = L.latLngBounds(
      activePath.map(
        (point) =>
          [point.lat, point.lng] as [
            number,
            number,
          ]
      )
    );

    map.fitBounds(bounds, {
      padding: [18, 18],
      maxZoom: 18,
      animate: true,
    });
    // Solo recalculamos cuando cambia la cantidad de nodos
    // o la sesión activa, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activePath.length,
    track?.sessionId,
  ]);

  function openTimelineCard(
    experience: Experience,
    expeditionTrack: ExpeditionTrack,
    item: TimelineItem
  ) {
    setSelectedCard(
      MemoryCardEngine.buildFromTimelineItem(
        experience,
        expeditionTrack,
        item
      )
    );
  }

  function openLatestJourneyCard() {
    if (!latestTrackBundle) {
      return;
    }

    setSelectedCard(
      MemoryCardEngine.build(
        latestTrackBundle.experience,
        latestTrackBundle.track
      )
    );
  }

  function flyToExperience(
    experience: Experience
  ) {
    mapInstanceRef.current?.flyTo(
      [
        experience.latitude,
        experience.longitude,
      ],
      17,
      {
        animate: true,
        duration: 0.8,
      }
    );
  }

  return (
    <>
      <section
        style={{
          background:
            "linear-gradient(145deg, rgba(24,25,47,0.98), rgba(10,11,22,0.98))",
          border:
            "1px solid rgba(255,61,232,0.15)",
          borderRadius:
            Theme.Radius.large,
          padding: "10px",
          boxShadow:
            "0 18px 42px rgba(0,0,0,0.30), 0 0 24px rgba(255,61,232,0.06)",
          marginTop:
            Theme.Space.md,
          marginLeft: "-6px",
          marginRight: "-6px",
        }}
      >
        <div
          style={{
            position: "relative",
            height: "520px",
            borderRadius:
              Theme.Radius.medium,
            overflow: "hidden",
            backgroundColor: "#F5F7FA",
          }}
        >
          <MapContainer
  center={mapCenter}
  zoom={initialZoom}
  scrollWheelZoom
  zoomControl
  doubleClickZoom
  touchZoom
  preferCanvas
  style={{
    height: "100%",
    width: "100%",
  }}
>
  <MapViewPersistence />

  <MapInstanceBinder
    mapRef={mapInstanceRef}
  />

  <TileLayer
    attribution="&copy; OpenStreetMap contributors &copy; CARTO"
    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    maxZoom={20}
  />

  <UserLocationLayer
    initialZoom={15}
  />

  <QhapaqNanLayer
    visible={showQhapaqNan}
  />

            {catalog.map((experience) => {
              const isVisited =
                user.visitedExperiences?.includes(
                  experience.experienceId
                ) ?? false;

              const isCurrentMission =
                journey.experience
                  ?.experienceId ===
                  experience.experienceId &&
                journey.state !== "IDLE" &&
                journey.state !== "COMPLETED" &&
                journey.state !== "ABORTED";

              return (
                <Marker
                  key={experience.experienceId}
                  position={[
                    experience.latitude,
                    experience.longitude,
                  ]}
                  icon={createIguidePin(
                    isVisited ? "visited" : "catalog",
                    experience.title
                  )}
                  eventHandlers={{
                    click: () =>
                      flyToExperience(
                        experience
                      ),
                  }}
                >
                  <Popup
                    minWidth={270}
                    className="iguide-premium-popup"
                  >
                    <ExperienceMapCard
                      experience={experience}
                      isVisited={isVisited}
                      isCurrentMission={
                        isCurrentMission
                      }
                      primaryActionLabel={
                        isCurrentMission
                          ? `${tx("Continuar misión")} →`
                          : `${tx("Iniciar misión")} →`
                      }
                      onPrimaryAction={() =>
                        handleStartMission(
                          experience
                        )
                      }
                      onViewDetails={() =>
                        navigate(
                          `/expedition/${experience.slug}`
                        )
                      }
                    />
                  </Popup>
                </Marker>
              );
            })}

            {trackBundles.map(
              ({
                experience,
                track: expeditionTrack,
                routeSegments,
              }) => {
                if (routeSegments.length === 0) {
                  return null;
                }

                return (
                  routeSegments.map(
                    (segment, index) => (
                      <Polyline
                        key={`track-${experience.experienceId}-${expeditionTrack.sessionId}-${index}`}
                        positions={segment}
                        className="iguide-route-line"
                        pathOptions={{
                          color: MAGENTA,
                          weight: 6,
                          lineCap: "round",
                          lineJoin: "round",
                          opacity: 1,
                        }}
                      />
                    )
                  )
                );
              }
            )}

            {trackBundles.flatMap(
              ({
                experience,
                track: expeditionTrack,
                startPoint,
                abortPoint,
                finishPoint,
                memoryNodes,
              }) => {
                const nodes: React.ReactNode[] = [];

                if (startPoint) {
                  nodes.push(
                    <Marker
                      key={`start-${experience.experienceId}-${expeditionTrack.sessionId}`}
                      position={[
                        startPoint.lat,
                        startPoint.lng,
                      ]}
                      icon={createIguidePin(
                        "start",
                        tx("Inicio: {{title}}", { title: experience.title })
                      )}
                    >
                      <Popup
                        minWidth={220}
                        className="iguide-premium-popup"
                      >
                        <TimelinePopup
                          eyebrow={tx("Inicio")}
                          title={tx("Comienzo del recorrido")}
                          experienceTitle={experience.title}
                          tone="magenta"
                          onOpen={() =>
                            openTimelineCard(
                              experience,
                              expeditionTrack,
                              startPoint
                            )
                          }
                        />
                      </Popup>
                    </Marker>
                  );
                }

                if (abortPoint && !finishPoint) {
                  nodes.push(
                    <Marker
                      key={`abort-${experience.experienceId}-${expeditionTrack.sessionId}`}
                      position={[
                        abortPoint.lat,
                        abortPoint.lng,
                      ]}
                      icon={createIguidePin(
                        "abort",
                        tx("Ruta conservada: {{title}}", { title: experience.title })
                      )}
                    >
                      <Popup
                        minWidth={220}
                        className="iguide-premium-popup"
                      >
                        <TimelinePopup
                          eyebrow={tx("Ruta conservada")}
                          title={tx("Recorrido interrumpido")}
                          experienceTitle={experience.title}
                          tone="orange"
                          onOpen={() =>
                            openTimelineCard(
                              experience,
                              expeditionTrack,
                              abortPoint
                            )
                          }
                        />
                      </Popup>
                    </Marker>
                  );
                }

                if (finishPoint) {
                  nodes.push(
                    <Marker
                      key={`finish-${experience.experienceId}-${expeditionTrack.sessionId}`}
                      position={[
                        finishPoint.lat,
                        finishPoint.lng,
                      ]}
                      icon={createIguidePin(
                        "finish",
                        tx("Llegada: {{title}}", { title: experience.title })
                      )}
                    >
                      <Popup
                        minWidth={220}
                        className="iguide-premium-popup"
                      >
                        <TimelinePopup
                          eyebrow={tx("Misión completada")}
                          title={tx("Llegada certificada")}
                          experienceTitle={experience.title}
                          tone="magenta"
                          onOpen={() =>
                            openTimelineCard(
                              experience,
                              expeditionTrack,
                              finishPoint
                            )
                          }
                        />
                      </Popup>
                    </Marker>
                  );
                }

                memoryNodes.forEach((memory, index) => {
                  nodes.push(
                    <Marker
                      key={
                        memory.id ||
                        `memory-${experience.experienceId}-${expeditionTrack.sessionId}-${index}`
                      }
                      position={[
                        memory.lat,
                        memory.lng,
                      ]}
                      icon={createIguidePin(
                        "memory",
                        tx("Recuerdo: {{title}}", { title: experience.title })
                      )}
                    >
                      <Popup
                        minWidth={220}
                        className="iguide-premium-popup"
                      >
                        <TimelinePopup
                          eyebrow={tx("Recuerdo")}
                          title={tx("Momento guardado")}
                          experienceTitle={experience.title}
                          tone="magenta"
                          onOpen={() =>
                            openTimelineCard(
                              experience,
                              expeditionTrack,
                              memory
                            )
                          }
                        />
                      </Popup>
                    </Marker>
                  );
                });

                return nodes;
              }
            )}
          </MapContainer>
        </div>

        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "12px",
            marginBottom: 0,
          }}
        >
          <div>
            <strong
              style={{
                color: Theme.Colors.text,
                fontSize: "14px",
              }}
            >
              {tx("Exploración guardada")}
            </strong>
            <p
              style={{
                margin: "3px 0 0",
                color: Theme.Colors.textSoft,
                fontSize: "10px",
              }}
            >
              {tx("El mapa recuerda tu última posición y nivel de zoom")}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "7px",
            }}
          >
            {latestTrackBundle && (
              <button
                type="button"
                onClick={openLatestJourneyCard}
                style={{
                  minHeight: "38px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "7px 11px",
                  borderRadius: "11px",
                  border: "1px solid rgba(66,232,245,0.34)",
                  background:
                    "linear-gradient(145deg, rgba(66,232,245,0.14), rgba(255,32,206,0.10))",
                  color: "#42E8F5",
                  fontSize: "11px",
                  fontWeight: 850,
                  cursor: "pointer",
                }}
              >
                <Share2 size={15} />
                {tx("Compartir recorrido")}
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setShowQhapaqNan(
                  (current) => !current
                )
              }
              aria-pressed={showQhapaqNan}
              style={{
                minHeight: "38px",
                padding: "7px 11px",
                borderRadius: "11px",
                border: showQhapaqNan
                  ? `1px solid ${ORANGE}`
                  : "1px solid rgba(255,255,255,0.12)",
                backgroundColor: showQhapaqNan
                  ? "rgba(255,138,0,0.15)"
                  : "rgba(255,255,255,0.05)",
                color: showQhapaqNan
                  ? ORANGE
                  : Theme.Colors.text,
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {showQhapaqNan
                ? tx("Ocultar Qhapaq Ñan")
                : tx("Activar Qhapaq Ñan")}
            </button>
          </div>
        </header>


        {showQhapaqNan && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              marginBottom: "9px",
              padding: "7px 9px",
              borderRadius: "9px",
              backgroundColor:
                "rgba(255,138,0,0.09)",
              color: Theme.Colors.textSoft,
              fontSize: "10px",
              lineHeight: 1.35,
            }}
          >
            <span
              style={{
                width: "24px",
                borderTop:
                  `3px dashed ${ORANGE}`,
              }}
            />
            {tx("Camino prehispánico del Valle del Mantaro")}
          </div>
        )}

      </section>

      <MemoryCardModal
        open={selectedCard !== null}
        data={selectedCard}
        onClose={() => setSelectedCard(null)}
        onShare={(data) =>
          shareEngine.shareMemory(data)
        }
      />

      <IguideMapPinStyles />
    </>
  );
}

type TimelinePopupProps = {
  eyebrow: string;
  title: string;
  experienceTitle: string;
  tone: "magenta" | "orange";
  onOpen: () => void;
};

function TimelinePopup({
  eyebrow,
  title,
  experienceTitle,
  tone,
  onOpen,
}: TimelinePopupProps) {
  const accent =
    tone === "orange"
      ? ORANGE
      : MAGENTA;

  return (
    <div
      style={{
        padding: "5px",
        color: "#FFFFFF",
        textAlign: "left",
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: "4px",
          color: accent,
          fontSize: "9px",
          fontWeight: 850,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </span>

      <strong
        style={{
          display: "block",
          fontSize: "15px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </strong>

      <p
        style={{
          margin: "6px 0 11px",
          fontSize: "11px",
          color: "rgba(255,255,255,0.64)",
        }}
      >
        {experienceTitle}
      </p>

      <button
        type="button"
        onClick={onOpen}
        style={{
          width: "100%",
          minHeight: "39px",
          border:
            "1px solid rgba(255,255,255,0.12)",
          borderRadius: "11px",
          background:
            `linear-gradient(145deg, ${accent}, ${
              tone === "orange"
                ? "#D66300"
                : "#D4008D"
            })`,
          color: "#FFFFFF",
          boxShadow:
            `0 7px 18px ${accent}44`,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        {tx("Ver Memory Card")}
      </button>
    </div>
  );
}

export default MapView;
