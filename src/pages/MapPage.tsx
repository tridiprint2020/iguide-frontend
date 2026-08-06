import {
  useMemo,
  useState,
} from "react";

import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import {
  Coffee,
  Footprints,
  Hotel,
  House,
  Landmark,
  MapPinned,
  PartyPopper,
  RotateCcw,
  Utensils,
  X,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  catalog,
} from "../data/catalog";

import {
  loadAllTrackSessions,
  loadTrack,
} from "../engine/trackingEngine";

import {
  MemoryCardEngine,
} from "../engine/memoryCardEngine";

import {
  Theme,
} from "../styles/theme";

import logoIG from "../assets/optimized/logoIG.webp";

import MemoryPreviewModal from "../components/sharing/MemoryPreviewModal";

import type {
  Experience,
  ExperienceType,
} from "../types/experience";

import type {
  ExpeditionTrack,
  TimelineItem,
} from "../types/tracking/tracking";

import type {
  MemoryCardData,
} from "../types/memoryCard";

type TypeFilter = {
  type: ExperienceType;
  icon: LucideIcon;
  label: string;
};

const TYPE_FILTERS: TypeFilter[] = [
  {
    type: "expedition",
    icon: Footprints,
    label: "Expediciones",
  },
  {
    type: "restaurant",
    icon: Utensils,
    label: "Restaurantes",
  },
  {
    type: "cafe",
    icon: Coffee,
    label: "Cafés",
  },
  {
    type: "hotel",
    icon: Hotel,
    label: "Hoteles",
  },
  {
    type: "museum",
    icon: Landmark,
    label: "Museos",
  },
  {
    type: "festival",
    icon: PartyPopper,
    label: "Festividades",
  },
];

const DEFAULT_CENTER: [
  number,
  number,
] = [
  -12.066,
  -75.21,
];

type HistoricalMemory = {
  experience: Experience;
  track: ExpeditionTrack;
  item: TimelineItem;
};

function MapPage() {
  const navigate =
    useNavigate();

  /*
   * Array vacío significa:
   * mostrar todas las categorías.
   */
  const [
    activeFilters,
    setActiveFilters,
  ] = useState<
    ExperienceType[]
  >([]);

  const [
    shareOpen,
    setShareOpen,
  ] = useState(false);

  const [
    activeMemory,
    setActiveMemory,
  ] =
    useState<MemoryCardData | null>(
      null
    );

  const [
    selectedExperience,
    setSelectedExperience,
  ] =
    useState<Experience | null>(
      null
    );

  /*
   * La ciudad se deriva del catálogo.
   * En Lima, Cusco, París o cualquier
   * futura ciudad se adaptará automáticamente.
   */
  const currentCity =
    catalog.find(
      (experience) =>
        experience.isActive !== false
    )?.city ?? "tu ciudad";

  const center:
    [number, number] =
    catalog.length > 0
      ? [
          catalog[0].latitude,
          catalog[0].longitude,
        ]
      : DEFAULT_CENTER;

  function toggleFilter(
    type: ExperienceType
  ) {
    setActiveFilters(
      (currentFilters) => {
        if (
          currentFilters.includes(
            type
          )
        ) {
          return currentFilters.filter(
            (activeType) =>
              activeType !== type
          );
        }

        return [
          ...currentFilters,
          type,
        ];
      }
    );
  }

  function clearFilters() {
    setActiveFilters([]);
  }

  function removeFilter(
    type: ExperienceType
  ) {
    setActiveFilters(
      (currentFilters) =>
        currentFilters.filter(
          (activeType) =>
            activeType !== type
        )
    );
  }

  const visibleExperiences =
    useMemo(() => {
      const activeCatalog =
        catalog.filter(
          (experience) =>
            experience.isActive !==
            false
        );

      if (
        activeFilters.length === 0
      ) {
        return activeCatalog;
      }

      return activeCatalog.filter(
        (experience) =>
          activeFilters.includes(
            experience.type
          )
      );
    }, [activeFilters]);

  /*
   * Contadores visibles por categoría.
   */
  const categoryCounts =
    useMemo(() => {
      const counts =
        new Map<
          ExperienceType,
          number
        >();

      for (const filter of TYPE_FILTERS) {
        const count =
          catalog.filter(
            (experience) =>
              experience.isActive !==
                false &&
              experience.type ===
                filter.type
          ).length;

        counts.set(
          filter.type,
          count
        );
      }

      return counts;
    }, []);

  /*
   * Recupera recuerdos de sesiones activas,
   * completadas y abandonadas.
   *
   * Así el mapa global no pierde recuerdos
   * cuando ya no existe un puntero activo.
   */
  const historicalMemories =
    useMemo<
      HistoricalMemory[]
    >(() => {
      const results:
        HistoricalMemory[] = [];

      for (
        const experience of catalog
      ) {
        const sessions =
          loadAllTrackSessions(
            experience.experienceId
          );

        for (
          const session of sessions
        ) {
          const memories =
            session.timeline.filter(
              (item) =>
                item.type ===
                "memory"
            );

          for (
            const memory of memories
          ) {
            results.push({
              experience,
              track: session,
              item: memory,
            });
          }
        }
      }

      return results;
    }, []);

  const selectedTrack =
    selectedExperience
      ? loadTrack(
          selectedExperience
            .experienceId
        )
      : null;

  const currentPath:
    [number, number][] =
    selectedTrack
      ? selectedTrack.timeline
          .filter(
            (item) =>
              item.type !==
              "memory"
          )
          .map(
            (item) => [
              item.lat,
              item.lng,
            ]
          )
      : [];

  const currentMemories =
    selectedTrack
      ? selectedTrack.timeline.filter(
          (item) =>
            item.type ===
            "memory"
        )
      : [];

  function openExperienceCard(
    experience: Experience
  ) {
    const experiencePhoto =
      experience.image ??
      experience.coverImage;

    const localData:
      MemoryCardData = {
      title:
        experience.title,

      placeLabel:
        experience.title,

      city:
        experience.city,

      date:
        "Disponible ahora",

      note:
        experience.description,

      photo:
        experiencePhoto,

      primaryInterest:
        experience.interests?.[0],

      center: [
        experience.latitude,
        experience.longitude,
      ],

      path: [],

      stats: {
        totalPhotos: 0,
        totalNotes: 0,
        totalMemories: 0,
        totalDistanceKm: 0,
        durationSeconds: 0,
      },

      mapBackground: {
        center: [
          experience.latitude,
          experience.longitude,
        ],

        path: [],

        memories: [],
      },
    };

    setSelectedExperience(
      experience
    );

    setActiveMemory(
      localData
    );

    setShareOpen(true);
  }

  function openHistoricalMemory(
    historicalMemory:
      HistoricalMemory
  ) {
    const cardData =
      MemoryCardEngine
        .buildFromTimelineItem(
          historicalMemory
            .experience,

          historicalMemory.track,

          historicalMemory.item
        );

    setSelectedExperience(
      historicalMemory
        .experience
    );

    setActiveMemory(
      cardData
    );

    setShareOpen(true);
  }

  return (
    <main
      style={{
        minHeight: "100vh",

        boxSizing: "border-box",

        padding:
          "18px 18px 40px",

        backgroundColor:
          Theme.Colors.background,

        color:
          Theme.Colors.text,
      }}
    >
      {/* NAVEGACIÓN SUPERIOR */}
      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          gap: "12px",

          maxWidth: "1240px",

          margin: "0 auto 12px",
        }}
      >
        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
          style={{
            minHeight: "38px",

            padding:
              "8px 13px",

            display: "flex",

            alignItems: "center",

            gap: "7px",

            borderRadius:
              "12px",

            border:
              "1px solid rgba(255,255,255,0.11)",

            background:
              "rgba(255,255,255,0.05)",

            color:
              Theme.Colors.text,

            fontSize: "12px",

            fontWeight: 700,

            cursor: "pointer",
          }}
        >
          <House
            size={16}
            strokeWidth={2.1}
          />

          Inicio
        </button>

        <img
          src={logoIG}
          alt="I.GUIDE"
          style={{
            width: "67px",

            maxHeight:
              "48px",

            objectFit:
              "contain",

            display: "block",
          }}
        />
      </div>

      {/* ENCABEZADO GLOBAL */}
      <header
        style={{
          display: "flex",

          flexDirection:
            "column",

          alignItems: "center",

          maxWidth:
            "1000px",

          margin:
            "0 auto 20px",

          textAlign:
            "center",
        }}
      >
        <span
          style={{
            display: "flex",

            alignItems:
              "center",

            gap: "6px",

            marginBottom:
              "5px",

            color:
              Theme.Colors.primary,

            fontSize:
              "10px",

            fontWeight:
              850,

            letterSpacing:
              "0.12em",

            textTransform:
              "uppercase",
          }}
        >
          <MapPinned
            size={14}
          />

          Feel the City
        </span>

        <h1
          style={{
            margin: 0,

            color:
              Theme.Colors.text,

            fontFamily:
              Theme.Typography.title,

            fontSize:
              "clamp(2rem, 6vw, 3.25rem)",

            lineHeight: 1.05,
          }}
        >
          Explora cerca de ti
        </h1>

        <p
          style={{
            margin:
              "8px 0 0",

            color:
              Theme.Colors.textSoft,

            fontSize:
              "13px",
          }}
        >
          Descubre{" "}
          <strong
            style={{
              color:
                Theme.Colors.primary,
            }}
          >
            {currentCity}
          </strong>{" "}
          como un local
        </p>
      </header>

      {/* FILTROS MULTISELECCIÓN */}
      <section
        aria-label="Filtros del mapa"
        style={{
          maxWidth: "1080px",

          margin:
            "0 auto 14px",
        }}
      >
        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(132px, 1fr))",

            gap: "9px",
          }}
        >
          {TYPE_FILTERS.map(
            (filter) => {
              const Icon =
                filter.icon;

              const isActive =
                activeFilters.includes(
                  filter.type
                );

              const count =
                categoryCounts.get(
                  filter.type
                ) ?? 0;

              return (
                <button
                  key={
                    filter.type
                  }
                  type="button"
                  onClick={() =>
                    toggleFilter(
                      filter.type
                    )
                  }
                  aria-pressed={
                    isActive
                  }
                  style={{
                    minHeight:
                      "48px",

                    padding:
                      "9px 10px",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    gap: "8px",

                    borderRadius:
                      "14px",

                    border:
                      isActive
                        ? `1px solid ${Theme.Colors.primary}`
                        : "1px solid rgba(255,255,255,0.09)",

                    background:
                      isActive
                        ? "linear-gradient(145deg, rgba(255,0,255,0.92), rgba(201,0,97,0.94))"
                        : "#161616",

                    color:
                      "#FFFFFF",

                    fontSize:
                      "12px",

                    fontWeight:
                      750,

                    cursor:
                      "pointer",

                    boxShadow:
                      isActive
                        ? "0 7px 20px rgba(255,0,122,0.23)"
                        : "none",

                    transition:
                      "border-color 0.18s ease, background 0.18s ease, transform 0.18s ease",
                  }}
                >
                  <Icon
                    size={17}
                    strokeWidth={
                      isActive
                        ? 2.5
                        : 2
                    }
                  />

                  <span>
                    {filter.label}
                  </span>

                  <span
                    style={{
                      minWidth:
                        "20px",

                      height:
                        "20px",

                      display:
                        "inline-flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      borderRadius:
                        "999px",

                      background:
                        isActive
                          ? "rgba(0,0,0,0.18)"
                          : "rgba(255,255,255,0.07)",

                      color:
                        isActive
                          ? "#FFFFFF"
                          : Theme.Colors
                              .textSoft,

                      fontSize:
                        "9px",

                      fontWeight:
                        800,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* CHIPS ACTIVOS Y LIMPIEZA */}
        {activeFilters.length >
          0 && (
          <div
            style={{
              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              flexWrap: "wrap",

              gap: "9px",

              marginTop:
                "11px",
            }}
          >
            <div
              style={{
                display: "flex",

                flexWrap: "wrap",

                gap: "7px",
              }}
            >
              {activeFilters.map(
                (activeType) => {
                  const filter =
                    TYPE_FILTERS.find(
                      (item) =>
                        item.type ===
                        activeType
                    );

                  if (!filter) {
                    return null;
                  }

                  return (
                    <button
                      key={
                        activeType
                      }
                      type="button"
                      onClick={() =>
                        removeFilter(
                          activeType
                        )
                      }
                      style={{
                        minHeight:
                          "29px",

                        padding:
                          "5px 8px 5px 10px",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "5px",

                        borderRadius:
                          "999px",

                        border:
                          "1px solid rgba(255,0,255,0.25)",

                        background:
                          "rgba(255,0,255,0.08)",

                        color:
                          Theme.Colors
                            .primary,

                        fontSize:
                          "10px",

                        fontWeight:
                          750,

                        cursor:
                          "pointer",
                      }}
                    >
                      {filter.label}

                      <X
                        size={13}
                        strokeWidth={
                          2.4
                        }
                      />
                    </button>
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={
                clearFilters
              }
              style={{
                minHeight:
                  "32px",

                padding:
                  "6px 10px",

                display:
                  "flex",

                alignItems:
                  "center",

                gap: "6px",

                borderRadius:
                  "10px",

                border:
                  "1px solid rgba(255,255,255,0.10)",

                background:
                  "rgba(255,255,255,0.04)",

                color:
                  Theme.Colors
                    .textSoft,

                fontSize:
                  "10px",

                fontWeight:
                  700,

                cursor:
                  "pointer",
              }}
            >
              <RotateCcw
                size={14}
              />

              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      {/* RESUMEN */}
      <div
        style={{
          maxWidth: "1240px",

          margin:
            "0 auto 8px",

          color:
            Theme.Colors.textSoft,

          fontSize:
            "10px",

          textAlign:
            "right",
        }}
      >
        Mostrando{" "}
        <strong
          style={{
            color:
              Theme.Colors.primary,
          }}
        >
          {
            visibleExperiences.length
          }
        </strong>{" "}
        lugares
      </div>

      {/* MAPA */}
      <section
        style={{
          position: "relative",

          width: "100%",

          maxWidth: "1240px",

          height:
            "clamp(470px, 67vh, 720px)",

          margin: "0 auto",

          overflow: "hidden",

          borderRadius:
            "22px",

          border:
            "1px solid rgba(255,255,255,0.07)",

          boxShadow:
            "0 15px 38px rgba(0,0,0,0.42)",
        }}
      >
        <MapContainer
          center={center}
          zoom={12}
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

          {/* LUGARES */}
          {visibleExperiences.map(
            (experience) => (
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
                  minWidth={220}
                >
                  <div
                    style={{
                      padding:
                        "5px",

                      color:
                        "#161616",

                      textAlign:
                        "center",
                    }}
                  >
                    <strong
                      style={{
                        display:
                          "block",

                        marginBottom:
                          "5px",

                        fontSize:
                          "15px",
                      }}
                    >
                      {
                        experience.title
                      }
                    </strong>

                    <p
                      style={{
                        margin:
                          "0 0 10px",

                        color:
                          "#666666",

                        fontSize:
                          "11px",

                        lineHeight:
                          1.4,
                      }}
                    >
                      {
                        experience.description
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        openExperienceCard(
                          experience
                        )
                      }
                      style={{
                        width:
                          "100%",

                        minHeight:
                          "38px",

                        border:
                          "none",

                        borderRadius:
                          "10px",

                        backgroundColor:
                          Theme.Colors
                            .primary,

                        color:
                          "#FFFFFF",

                        fontSize:
                          "11px",

                        fontWeight:
                          750,

                        cursor:
                          "pointer",
                      }}
                    >
                      Ver detalles →
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          )}

          {/* RECUERDOS HISTÓRICOS */}
          {historicalMemories.map(
            (
              historicalMemory,
              index
            ) => (
              <CircleMarker
                key={
                  historicalMemory
                    .item.id ??
                  `memory-${historicalMemory.experience.experienceId}-${historicalMemory.track.sessionId}-${index}`
                }
                center={[
                  historicalMemory
                    .item.lat,
                  historicalMemory
                    .item.lng,
                ]}
                radius={9}
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
                  minWidth={200}
                >
                  <div
                    style={{
                      padding:
                        "5px",

                      color:
                        "#161616",

                      textAlign:
                        "center",
                    }}
                  >
                    <strong>
                      Recuerdo guardado
                    </strong>

                    <p
                      style={{
                        margin:
                          "6px 0 10px",

                        color:
                          "#666666",

                        fontSize:
                          "11px",
                      }}
                    >
                      {
                        historicalMemory
                          .experience
                          .title
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        openHistoricalMemory(
                          historicalMemory
                        )
                      }
                      style={{
                        width:
                          "100%",

                        minHeight:
                          "37px",

                        border:
                          "none",

                        borderRadius:
                          "9px",

                        backgroundColor:
                          Theme.Colors
                            .primary,

                        color:
                          "#FFFFFF",

                        fontSize:
                          "11px",

                        fontWeight:
                          750,

                        cursor:
                          "pointer",
                      }}
                    >
                      Ver Memory Card
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            )
          )}
        </MapContainer>

        {/* MARCA DISCRETA */}
        <div
          aria-hidden="true"
          style={{
            position:
              "absolute",

            top:
              "12px",

            right:
              "12px",

            zIndex:
              500,

            padding:
              "7px 10px",

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "6px",

            borderRadius:
              "12px",

            background:
              "rgba(12,12,14,0.77)",

            border:
              "1px solid rgba(255,255,255,0.10)",

            color:
              "#FFFFFF",

            boxShadow:
              "0 6px 18px rgba(0,0,0,0.24)",

            backdropFilter:
              "blur(9px)",

            pointerEvents:
              "none",
          }}
        >
          <img
            src={logoIG}
            alt=""
            style={{
              width:
                "23px",

              height:
                "23px",

              objectFit:
                "contain",
            }}
          />

          <span
            style={{
              fontSize:
                "9px",

              fontWeight:
                800,

              letterSpacing:
                "0.07em",

              textTransform:
                "uppercase",
            }}
          >
            I.GUIDE
          </span>
        </div>
      </section>

      <MemoryPreviewModal
        isOpen={shareOpen}
        onClose={() =>
          setShareOpen(false)
        }
        memoryData={
          activeMemory
        }
        experienceContext={
          selectedExperience
        }
        mapContext={{
          center:
            selectedExperience
              ? [
                  selectedExperience
                    .latitude,

                  selectedExperience
                    .longitude,
                ]
              : center,

          path:
            currentPath,

          memories:
            currentMemories,
        }}
      />
    </main>
  );
}

export default MapPage;