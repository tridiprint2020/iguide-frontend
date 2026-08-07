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
import ExperienceMapCard from "./maps/ExperienceMapCard";
import QhapaqNanLayer from "./maps/QhapaqNanLayer";
import UserLocationLayer from "./maps/UserLocationLayer";

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
  routePath: [number, number][];
  startPoint: TimelineItem | null;
  abortPoint: TimelineItem | null;
  finishPoint: TimelineItem | null;
  memoryNodes: TimelineItem[];
};

type PinKind =
  | "catalog"
  | "visited"
  | "start"
  | "memory"
  | "finish"
  | "abort";

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

const pinCache =
  new Map<string, L.DivIcon>();

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
const CYAN = "#00E6FF";
const ORANGE = "#FF8A00";

function escapeHtml(
  value: string
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function createIguidePin(
  kind: PinKind,
  title: string
): L.DivIcon {
  const cacheKey =
    `${kind}:${title}`;

  const cached =
    pinCache.get(cacheKey);

  if (cached) {
    return cached;
  }
  const isAbort =
    kind === "abort";

  const isCatalog =
    kind === "catalog";

  const isMemory =
    kind === "memory";

  const isVisited =
    kind === "visited";

  const isStart =
    kind === "start";

  const isFinish =
    kind === "finish";

  const size =
    isStart || isFinish
      ? 52
      : isAbort || isVisited
        ? 44
        : isMemory
          ? 32
          : 40;

 const color =
  isAbort
    ? ORANGE
    : isCatalog
      ? MAGENTA
      : CYAN;

  const safeTitle =
    escapeHtml(title);

  const symbol = isStart
    ? `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M11 25V7l14 9-14 9Z"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round"
        />
      </svg>
    `
    : isFinish || isVisited
      ? `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="m9 16 4.5 4.5L23 11"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      `
      : isAbort
        ? `
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M10 10 22 22M22 10 10 22"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        `
        : isMemory
          ? `
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <rect
                x="7"
                y="10"
                width="18"
                height="14"
                rx="3"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />

              <path
                d="m12 10 1.5-3h5L20 10"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
              />

              <circle
                cx="16"
                cy="17"
                r="4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
          `
          : `
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path
                d="
                  M16 29
                  C16 29 25 21.2 25 12.5
                  C25 7.25 20.97 3 16 3
                  C11.03 3 7 7.25 7 12.5
                  C7 21.2 16 29 16 29Z
                "
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linejoin="round"
              />

              <circle
                cx="16"
                cy="12.5"
                r="5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              />

              <path
                d="
                  M16 8.7
                  L17.2 11
                  L19.8 11.4
                  L17.9 13.2
                  L18.4 15.8
                  L16 14.6
                  L13.6 15.8
                  L14.1 13.2
                  L12.2 11.4
                  L14.8 11
                  Z
                "
                fill="currentColor"
              />
            </svg>
          `;

  const html = `
    <div
      class="
        iguide-neon-pin
        iguide-neon-pin--${kind}
      "
      title="${safeTitle}"
      style="
        --pin-color: ${color};
        --pin-size: ${size}px;
      "
    >
      <span class="iguide-neon-pin__halo"></span>

      <span class="iguide-neon-pin__icon">
        ${symbol}
      </span>

      ${
        isStart || isFinish
          ? `
            <span class="iguide-neon-pin__pulse"></span>
          `
          : ""
      }
    </div>
  `;

  const icon =
    L.divIcon({
      html,

      className:
        "iguide-leaflet-div-icon",

      iconSize: [
        size,
        size,
      ],

      iconAnchor: [
        size / 2,
        size / 2,
      ],

      popupAnchor: [
        0,
        -(size / 2) - 8,
      ],
    });

  pinCache.set(
    cacheKey,
    icon
  );

  return icon;
}

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

  const trackBundles =
    useMemo<TrackBundle[]>(() => {
      const bundles: TrackBundle[] = [];

      for (const experience of catalog) {
        const storedSessions =
          loadAllTrackSessions(
            experience.experienceId
          );

        for (const persistedTrack of storedSessions) {
          const routeNodes =
            persistedTrack.timeline.filter(
              (item) =>
                item.type === "start" ||
                item.type === "walk" ||
                item.type === "abort" ||
                item.type === "finish"
            );

          const routePath =
            simplifyRoutePath(
              routeNodes.map(
                (point) =>
                  [
                    point.lat,
                    point.lng,
                  ] as [number, number]
              )
            );

          bundles.push({
            experience,
            track: persistedTrack,
            routePath,
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
                      primaryActionLabel="Ver misión →"
                      onPrimaryAction={() =>
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
                routePath,
              }) => {
                if (routePath.length < 2) {
                  return null;
                }

                return (
                  <Polyline
                    key={`track-${experience.experienceId}-${expeditionTrack.sessionId}`}
                    positions={routePath}
                    className="iguide-route-line"
                    pathOptions={{
                      color: MAGENTA,
                      weight: 6,
                      lineCap: "round",
                      lineJoin: "round",
                      opacity: 1,
                    }}
                  />
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
                        `Inicio: ${experience.title}`
                      )}
                    >
                      <Popup
                        minWidth={220}
                        className="iguide-premium-popup"
                      >
                        <TimelinePopup
                          eyebrow="Inicio"
                          title="Comienzo del recorrido"
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
                        `Ruta conservada: ${experience.title}`
                      )}
                    >
                      <Popup
                        minWidth={220}
                        className="iguide-premium-popup"
                      >
                        <TimelinePopup
                          eyebrow="Ruta conservada"
                          title="Recorrido interrumpido"
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
                        `Llegada: ${experience.title}`
                      )}
                    >
                      <Popup
                        minWidth={220}
                        className="iguide-premium-popup"
                      >
                        <TimelinePopup
                          eyebrow="Misión completada"
                          title="Llegada certificada"
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
                        `Recuerdo: ${experience.title}`
                      )}
                    >
                      <Popup
                        minWidth={220}
                        className="iguide-premium-popup"
                      >
                        <TimelinePopup
                          eyebrow="Recuerdo"
                          title="Momento guardado"
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
              Exploración guardada
            </strong>
            <p
              style={{
                margin: "3px 0 0",
                color: Theme.Colors.textSoft,
                fontSize: "10px",
              }}
            >
              El mapa recuerda tu última posición y nivel de zoom
            </p>
          </div>

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
              ? "Ocultar Qhapaq Ñan"
              : "Activar Qhapaq Ñan"}
          </button>
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
            Camino prehispánico del Valle del Mantaro
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

     <style>
  {`
    .iguide-leaflet-div-icon {
      background: transparent !important;
      border: none !important;
    }

    .iguide-neon-pin {
      position: relative;

      width: var(--pin-size);
      height: var(--pin-size);

      display: grid;
      place-items: center;

      color: var(--pin-color);

      isolation: isolate;

      pointer-events: auto;
    }

    .iguide-neon-pin__halo {
      position: absolute;

      inset: 13%;

      z-index: 1;

      border-radius: 50%;

      background:
        color-mix(
          in srgb,
          var(--pin-color) 32%,
          transparent
        );

      filter: blur(5px);

      opacity: 0.62;

      transition:
        opacity 0.18s ease,
        transform 0.18s ease;
    }

    .iguide-neon-pin__icon {
      position: relative;

      z-index: 3;

      width: 100%;
      height: 100%;

      display: grid;
      place-items: center;

      color:
        color-mix(
          in srgb,
          var(--pin-color) 78%,
          white
        );

      filter:
  drop-shadow(
    0 0 2px
    rgba(0,0,0,0.95)
  )
  drop-shadow(
    0 0 3px
    rgba(255,255,255,0.95)
  )
  drop-shadow(
    0 0 7px
    var(--pin-color)
  )
  drop-shadow(
    0 0 16px
    color-mix(
      in srgb,
      var(--pin-color) 88%,
      transparent
    )
  )
  drop-shadow(
    0 0 16px
    color-mix(
      in srgb,
      var(--pin-color) 48%,
      transparent
    )
  );

      transition:
        transform 0.18s ease,
        filter 0.18s ease;
    }

    .iguide-neon-pin__icon svg {
      width: 100%;
      height: 100%;

      overflow: visible;
    }

    .iguide-neon-pin:hover
    .iguide-neon-pin__icon {
      transform:
        translateY(-2px)
        scale(1.08);

      filter:
        drop-shadow(
          0 0 3px
          rgba(255,255,255,0.90)
        )
        drop-shadow(
          0 0 7px
          var(--pin-color)
        )
        drop-shadow(
          0 0 15px
          color-mix(
            in srgb,
            var(--pin-color) 82%,
            transparent
          )
        )
        drop-shadow(
          0 0 16px
          color-mix(
            in srgb,
            var(--pin-color) 45%,
            transparent
          )
        );
    }

    .iguide-neon-pin:hover
    .iguide-neon-pin__halo {
      opacity: 1;

      transform:
        scale(1.15);
    }

    .iguide-neon-pin__pulse {
      position: absolute;

      inset: 4%;

      z-index: 0;

      border:
        1px solid
        color-mix(
          in srgb,
          var(--pin-color) 75%,
          transparent
        );

      border-radius: 50%;

      opacity: 0.7;

      animation:
        iguideNeonPinPulse
        2.2s ease-out
        infinite;

      pointer-events: none;
    }

    .iguide-neon-pin--memory
    .iguide-neon-pin__icon {
      width: 86%;
      height: 86%;
    }

    .iguide-neon-pin--catalog
    .iguide-neon-pin__halo {
      background:
        rgba(0,230,255,0.24);
    }

    .iguide-neon-pin--abort
    .iguide-neon-pin__halo {
      background:
        rgba(255,138,0,0.26);
    }

    .iguide-neon-pin--visited
    .iguide-neon-pin__icon,
    .iguide-neon-pin--finish
    .iguide-neon-pin__icon {
      filter:
        drop-shadow(
          0 0 3px
          rgba(255,255,255,0.90)
        )
        drop-shadow(
          0 0 7px
          rgba(255,0,255,0.98)
        )
        drop-shadow(
          0 0 13px
          rgba(255,0,255,0.70)
        );
    }

    .iguide-route-line {
      filter:
        drop-shadow(
          0 0 3px
          rgba(255,0,255,0.92)
        )
        drop-shadow(
          0 0 8px
          rgba(255,0,255,0.48)
        );

      stroke-linecap: round;
      stroke-linejoin: round;
    }

    @keyframes iguideNeonPinPulse {
      0% {
        transform: scale(0.72);
        opacity: 0.72;
      }

      75% {
        transform: scale(1.35);
        opacity: 0;
      }

      100% {
        transform: scale(1.35);
        opacity: 0;
      }
    }
  `}
</style>
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
        Ver Memory Card
      </button>
    </div>
  );
}

export default MapView;
