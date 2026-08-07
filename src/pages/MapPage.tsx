import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import type {
  CircleMarker as LeafletCircleMarker,
  Map as LeafletMap,
} from "leaflet";

import {
  Beer,
  CalendarDays,
  Coffee,
  Footprints,
  Heart,
  Hotel,
  House,
  Images,
  Landmark,
  MapPinned,
  Music2,
  Palette,
  PartyPopper,
  RotateCcw,
  Search,
  Sparkles,
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
  loadUserProfile,
} from "../data/user";

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

import logoIG from "../assets/optimized/logoig.webp";

import UserLocationLayer from "../components/maps/UserLocationLayer";
import ExperienceMapCard from "../components/maps/ExperienceMapCard";
import MemoryPreviewModal from "../components/sharing/MemoryPreviewModal";

import {
  useJourney,
} from "../context/JourneyContext";

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
    type: "bar",
    icon: Beer,
    label: "Bares",
  },
  {
    type: "nightclub",
    icon: Music2,
    label: "Vida nocturna",
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
  {
    type: "event",
    icon: CalendarDays,
    label: "Eventos",
  },
  {
    type: "craft",
    icon: Palette,
    label: "Artesanías",
  },
];

const DEFAULT_CENTER: [number, number] = [
  -12.066,
  -75.21,
];

const MAGENTA = "#FF00FF";
const CYAN = "#00E6FF";

type HistoricalMemory = {
  experience: Experience;
  track: ExpeditionTrack;
  item: TimelineItem;
};

function isActiveJourneyState(
  state: string
): boolean {
  return (
    state !== "IDLE" &&
    state !== "COMPLETED"
  );
}

function getTypeLabel(
  type: ExperienceType
): string {
  return (
    TYPE_FILTERS.find(
      (filter) => filter.type === type
    )?.label ?? type
  );
}

function normalizeSearchValue(
  value: string
): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildExperienceSearchText(
  experience: Experience
): string {
  const searchableExperience =
    experience as Experience & {
      tags?: string[];
      specialty?: string;
      description?: string;
      address?: string;
      neighborhood?: string;
    };

  return normalizeSearchValue(
    [
      experience.title,
      getTypeLabel(experience.type),
      searchableExperience.specialty,
      searchableExperience.description,
      searchableExperience.address,
      searchableExperience.neighborhood,
      ...(searchableExperience.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function MapPage() {
  const navigate = useNavigate();
  const {
    journey,
    startWalking,
  } = useJourney();

  const [activeFilters, setActiveFilters] =
    useState<ExperienceType[]>([]);

  const [onlyFavorites, setOnlyFavorites] =
    useState(false);

  const [onlyUnvisited, setOnlyUnvisited] =
    useState(false);

  /*
   * Los recuerdos se cargan solo cuando el usuario los pide.
   * Esto evita recorrer localStorage completo al abrir el mapa
   * y reduce de forma visible la latencia inicial.
   */
  const [showMemories, setShowMemories] =
    useState(false);

  const [shareOpen, setShareOpen] =
    useState(false);

  const [activeMemory, setActiveMemory] =
    useState<MemoryCardData | null>(null);

  const [selectedExperience, setSelectedExperience] =
    useState<Experience | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const mapRef =
    useRef<LeafletMap | null>(null);

  const markerRefs = useRef(
    new Map<
      string,
      LeafletCircleMarker
    >()
  );

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

  const favoriteIds = useMemo(
    () =>
      new Set(
        user.favorites.map(
          (favorite) =>
            favorite.experienceId
        )
      ),
    [user.favorites]
  );

  const visitedIds = useMemo(
    () =>
      new Set(
        user.visitedExperiences
      ),
    [user.visitedExperiences]
  );

  const activeCatalog = useMemo(
    () =>
      catalog.filter(
        (experience) =>
          experience.isActive !== false
      ),
    []
  );

  const center: [number, number] =
    activeCatalog.length > 0
      ? [
          activeCatalog[0].latitude,
          activeCatalog[0].longitude,
        ]
      : DEFAULT_CENTER;

  function toggleFilter(
    type: ExperienceType
  ) {
    setActiveFilters(
      (currentFilters) => {
        if (
          currentFilters.includes(type)
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
    setOnlyFavorites(false);
    setOnlyUnvisited(false);
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
      return activeCatalog.filter(
        (experience) => {
          const matchesType =
            activeFilters.length === 0 ||
            activeFilters.includes(
              experience.type
            );

          const matchesFavorite =
            !onlyFavorites ||
            favoriteIds.has(
              experience.experienceId
            );

          const matchesUnvisited =
            !onlyUnvisited ||
            !visitedIds.has(
              experience.experienceId
            );

          const normalizedQuery =
            normalizeSearchValue(
              searchQuery
            );

          const matchesSearch =
            normalizedQuery.length === 0 ||
            buildExperienceSearchText(
              experience
            ).includes(
              normalizedQuery
            );

          return (
            matchesType &&
            matchesFavorite &&
            matchesUnvisited &&
            matchesSearch
          );
        }
      );
    }, [
      activeCatalog,
      activeFilters,
      favoriteIds,
      onlyFavorites,
      onlyUnvisited,
      searchQuery,
      visitedIds,
    ]);

  const normalizedSearchQuery =
    normalizeSearchValue(
      searchQuery
    );

  const searchResults = useMemo(
    () => {
      if (!normalizedSearchQuery) {
        return [];
      }

      return activeCatalog
        .filter((experience) =>
          buildExperienceSearchText(
            experience
          ).includes(
            normalizedSearchQuery
          )
        )
        .slice(0, 6);
    }, [
      activeCatalog,
      normalizedSearchQuery,
    ]
  );

  const categoryCounts =
    useMemo(() => {
      const counts =
        new Map<
          ExperienceType,
          number
        >();

      for (const filter of TYPE_FILTERS) {
        const count =
          activeCatalog.filter(
            (experience) =>
              experience.type ===
              filter.type
          ).length;

        counts.set(
          filter.type,
          count
        );
      }

      return counts;
    }, [activeCatalog]);

  const historicalMemories =
    useMemo<HistoricalMemory[]>(() => {
      if (!showMemories) {
        return [];
      }

      const results:
        HistoricalMemory[] = [];

      for (
        const experience of activeCatalog
      ) {
        const sessions =
          loadAllTrackSessions(
            experience.experienceId
          );

        for (const session of sessions) {
          const memories =
            session.timeline.filter(
              (item) =>
                item.type === "memory"
            );

          for (const memory of memories) {
            results.push({
              experience,
              track: session,
              item: memory,
            });
          }
        }
      }

      return results;
    }, [activeCatalog, showMemories]);

  const selectedTrack =
    selectedExperience
      ? loadTrack(
          selectedExperience.experienceId
        )
      : null;

  const currentPath:
    [number, number][] =
    selectedTrack
      ? selectedTrack.timeline
          .filter(
            (item) =>
              item.type !== "memory"
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
            item.type === "memory"
        )
      : [];

  function focusExperienceOnMap(
    experience: Experience
  ) {
    setActiveFilters([]);
    setOnlyFavorites(false);
    setOnlyUnvisited(false);
    setSearchQuery("");
    setSelectedExperience(
      experience
    );

    window.setTimeout(() => {
      mapRef.current?.flyTo(
        [
          experience.latitude,
          experience.longitude,
        ],
        18,
        {
          animate: true,
          duration: 0.55,
        }
      );

      window.setTimeout(() => {
        markerRefs.current
          .get(
            experience.experienceId
          )
          ?.openPopup();
      }, 260);
    }, 0);
  }

  function handleStartMission(
    experience: Experience
  ) {
    const activeExperience =
      journey.experience;

    if (
      activeExperience &&
      isActiveJourneyState(
        journey.state
      ) &&
      activeExperience.experienceId !==
        experience.experienceId
    ) {
      alert(
        `Ya tienes una misión activa: ${activeExperience.title}. Continúala o abandónala antes de iniciar otra.`
      );

      return;
    }

    const missionStarted =
      startWalking(
        experience
      );

    if (missionStarted) {
      navigate("/journey");
    }
  }

  function openHistoricalMemory(
    historicalMemory:
      HistoricalMemory
  ) {
    const cardData =
      MemoryCardEngine
        .buildFromTimelineItem(
          historicalMemory.experience,
          historicalMemory.track,
          historicalMemory.item
        );

    setSelectedExperience(
      historicalMemory.experience
    );

    setActiveMemory(cardData);
    setShareOpen(true);
  }

  const hasActiveFilters =
    activeFilters.length > 0 ||
    onlyFavorites ||
    onlyUnvisited;

  return (
    <main
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding:
          "18px 18px 40px",
        background:
          "radial-gradient(circle at 50% -10%, rgba(255,0,255,0.10), transparent 34%), #090A12",
        color: Theme.Colors.text,
      }}
    >
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
          onClick={() => navigate("/")}
          style={{
            minHeight: "38px",
            padding: "8px 13px",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            borderRadius: "12px",
            border:
              "1px solid rgba(255,255,255,0.11)",
            background:
              "rgba(255,255,255,0.05)",
            color: Theme.Colors.text,
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
            maxHeight: "48px",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      <header
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: "1000px",
          margin: "0 auto 18px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "5px",
            color:
              Theme.Colors.primary,
            fontSize: "10px",
            fontWeight: 850,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <MapPinned size={14} />
          Tu ciudad, a tu manera
        </span>

        <h1
          style={{
            margin: 0,
            color: Theme.Colors.text,
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
            margin: "8px 0 0",
            color:
              Theme.Colors.textSoft,
            fontSize: "13px",
          }}
        >
          Busca por nombre, filtra e inicia una misión.
        </p>
      </header>

      <section
        aria-label="Buscar en el mapa"
        style={{
          position: "relative",
          zIndex: 900,
          width: "100%",
          maxWidth: "760px",
          margin: "0 auto 12px",
        }}
      >
        <div
          style={{
            minHeight: "52px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "0 14px",
            borderRadius: "16px",
            border:
              "1px solid rgba(255,0,255,0.25)",
            background:
              "linear-gradient(145deg, rgba(25,26,48,0.98), rgba(12,13,25,0.98))",
            boxShadow:
              "0 12px 28px rgba(0,0,0,0.24), 0 0 22px rgba(255,0,255,0.07)",
          }}
        >
          <Search
            size={19}
            color={MAGENTA}
            strokeWidth={2.3}
          />

          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Buscar Don Juko, París, café, museo..."
            aria-label="Buscar lugar por nombre o categoría"
            style={{
              flex: 1,
              minWidth: 0,
              height: "48px",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "#FFFFFF",
              fontSize: "14px",
            }}
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() =>
                setSearchQuery("")
              }
              aria-label="Limpiar búsqueda"
              style={{
                width: "32px",
                height: "32px",
                display: "grid",
                placeItems: "center",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.10)",
                background:
                  "rgba(255,255,255,0.05)",
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {normalizedSearchQuery && (
          <div
            style={{
              position: "absolute",
              top: "58px",
              left: 0,
              right: 0,
              overflow: "hidden",
              borderRadius: "16px",
              border:
                "1px solid rgba(255,255,255,0.10)",
              background:
                "rgba(13,14,27,0.98)",
              boxShadow:
                "0 18px 38px rgba(0,0,0,0.46)",
              backdropFilter: "blur(14px)",
            }}
          >
            {searchResults.length > 0 ? (
              searchResults.map(
                (experience) => (
                  <button
                    key={
                      experience.experienceId
                    }
                    type="button"
                    onClick={() =>
                      focusExperienceOnMap(
                        experience
                      )
                    }
                    style={{
                      width: "100%",
                      minHeight: "52px",
                      padding: "10px 13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      border: "none",
                      borderBottom:
                        "1px solid rgba(255,255,255,0.06)",
                      background:
                        "transparent",
                      color: "#FFFFFF",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span>
                      <strong
                        style={{
                          display: "block",
                          fontSize: "13px",
                        }}
                      >
                        {experience.title}
                      </strong>

                      <small
                        style={{
                          display: "block",
                          marginTop: "3px",
                          color:
                            Theme.Colors
                              .textSoft,
                          fontSize: "10px",
                        }}
                      >
                        {getTypeLabel(
                          experience.type
                        )}
                      </small>
                    </span>

                    <span
                      style={{
                        color: MAGENTA,
                        fontWeight: 850,
                      }}
                    >
                      Ver →
                    </span>
                  </button>
                )
              )
            ) : (
              <div
                style={{
                  padding: "14px",
                  color:
                    Theme.Colors.textSoft,
                  fontSize: "12px",
                  textAlign: "center",
                }}
              >
                Todavía no encontramos ese lugar.
              </div>
            )}
          </div>
        )}
      </section>

      <section
        aria-label="Filtros rápidos del mapa"
        style={{
          maxWidth: "1080px",
          margin: "0 auto 10px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        <QuickFilterButton
          active={onlyUnvisited}
          icon={Sparkles}
          label="Por descubrir"
          onClick={() =>
            setOnlyUnvisited(
              (current) => !current
            )
          }
        />

        <QuickFilterButton
          active={onlyFavorites}
          icon={Heart}
          label="Mis favoritos"
          onClick={() =>
            setOnlyFavorites(
              (current) => !current
            )
          }
        />

        <QuickFilterButton
          active={showMemories}
          icon={Images}
          label="Mis recuerdos"
          onClick={() =>
            setShowMemories(
              (current) => !current
            )
          }
        />
      </section>

      <section
        aria-label="Categorías del mapa"
        style={{
          maxWidth: "1080px",
          margin: "0 auto 14px",
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
              const Icon = filter.icon;
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
                  key={filter.type}
                  type="button"
                  onClick={() =>
                    toggleFilter(
                      filter.type
                    )
                  }
                  aria-pressed={isActive}
                  disabled={count === 0}
                  style={{
                    minHeight: "48px",
                    padding: "9px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    gap: "8px",
                    borderRadius: "14px",
                    border: isActive
                      ? `1px solid ${Theme.Colors.primary}`
                      : "1px solid rgba(255,255,255,0.09)",
                    background: isActive
                      ? "linear-gradient(145deg, rgba(255,0,255,0.92), rgba(201,0,97,0.94))"
                      : "linear-gradient(145deg, rgba(25,26,48,0.96), rgba(14,15,29,0.96))",
                    color: "#FFFFFF",
                    opacity:
                      count === 0
                        ? 0.42
                        : 1,
                    fontSize: "12px",
                    fontWeight: 750,
                    cursor:
                      count === 0
                        ? "not-allowed"
                        : "pointer",
                    boxShadow: isActive
                      ? "0 7px 20px rgba(255,0,122,0.23)"
                      : "none",
                    transition:
                      "border-color 0.18s ease, background 0.18s ease, transform 0.18s ease",
                  }}
                >
                  <Icon
                    size={17}
                    strokeWidth={
                      isActive ? 2.5 : 2
                    }
                  />

                  <span>
                    {filter.label}
                  </span>

                  <span
                    style={{
                      minWidth: "20px",
                      height: "20px",
                      display:
                        "inline-flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      borderRadius:
                        "999px",
                      background: isActive
                        ? "rgba(0,0,0,0.18)"
                        : "rgba(255,255,255,0.07)",
                      color: isActive
                        ? "#FFFFFF"
                        : Theme.Colors
                            .textSoft,
                      fontSize: "9px",
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {hasActiveFilters && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              flexWrap: "wrap",
              gap: "9px",
              marginTop: "11px",
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
                (activeType) => (
                  <button
                    key={activeType}
                    type="button"
                    onClick={() =>
                      removeFilter(
                        activeType
                      )
                    }
                    style={{
                      minHeight: "29px",
                      padding:
                        "5px 8px 5px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      borderRadius:
                        "999px",
                      border:
                        "1px solid rgba(255,0,255,0.25)",
                      background:
                        "rgba(255,0,255,0.08)",
                      color:
                        Theme.Colors.primary,
                      fontSize: "10px",
                      fontWeight: 750,
                      cursor: "pointer",
                    }}
                  >
                    {getTypeLabel(
                      activeType
                    )}
                    <X
                      size={13}
                      strokeWidth={2.4}
                    />
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={clearFilters}
              style={{
                minHeight: "32px",
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,255,255,0.10)",
                background:
                  "rgba(255,255,255,0.04)",
                color:
                  Theme.Colors.textSoft,
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={14} />
              Limpiar filtros
            </button>
          </div>
        )}
      </section>

      <div
        style={{
          maxWidth: "1240px",
          margin: "0 auto 8px",
          display: "flex",
          justifyContent:
            "space-between",
          gap: "10px",
          color:
            Theme.Colors.textSoft,
          fontSize: "10px",
        }}
      >
        <span>
          El mapa se centra en tu GPS
          mostrando aproximadamente
          200 m alrededor.
        </span>

        <span>
          Mostrando{" "}
          <strong
            style={{
              color:
                Theme.Colors.primary,
            }}
          >
            {visibleExperiences.length}
          </strong>{" "}
          lugares
        </span>
      </div>

      <section
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1240px",
          height:
            "clamp(470px, 67vh, 720px)",
          margin: "0 auto",
          overflow: "hidden",
          borderRadius: "22px",
          border:
            "1px solid rgba(255,255,255,0.07)",
          boxShadow:
            "0 15px 38px rgba(0,0,0,0.42), 0 0 30px rgba(255,0,255,0.05)",
        }}
      >
        <MapContainer
          ref={mapRef}
          center={center}
          zoom={18}
          preferCanvas
          zoomControl
          scrollWheelZoom
          doubleClickZoom
          touchZoom
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={20}
          />

          <UserLocationLayer
            initialZoom={18}
            radiusMeters={200}
          />

          {visibleExperiences.map(
            (experience) => {
              const isVisited =
                visitedIds.has(
                  experience.experienceId
                );

              const isCurrentMission =
                journey.experience
                  ?.experienceId ===
                  experience.experienceId &&
                isActiveJourneyState(
                  journey.state
                );

              const pinColor =
                isCurrentMission
                  ? CYAN
                  : MAGENTA;

              return (
                <CircleMarker
                  key={
                    experience.experienceId
                  }
                  ref={(marker) => {
                    if (marker) {
                      markerRefs.current.set(
                        experience.experienceId,
                        marker
                      );
                    } else {
                      markerRefs.current.delete(
                        experience.experienceId
                      );
                    }
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedExperience(
                        experience
                      );

                      mapRef.current?.flyTo(
                        [
                          experience.latitude,
                          experience.longitude,
                        ],
                        18,
                        {
                          animate: true,
                          duration: 0.45,
                        }
                      );
                    },
                  }}
                  center={[
                    experience.latitude,
                    experience.longitude,
                  ]}
                  radius={
                    isCurrentMission
                      ? 12
                      : 9
                  }
                  pathOptions={{
                    color: "#FFFFFF",
                    weight: 2,
                    fillColor: pinColor,
                    fillOpacity: 0.96,
                  }}
                >
                  <Popup minWidth={270}>
                    <ExperienceMapCard
                      experience={experience}
                      isVisited={isVisited}
                      isCurrentMission={
                        isCurrentMission
                      }
                      primaryActionLabel={
                        isCurrentMission
                          ? "Continuar misión →"
                          : "Iniciar misión →"
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
                </CircleMarker>
              );
            }
          )}

          {showMemories &&
            historicalMemories.map(
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
                    historicalMemory.item
                      .lat,
                    historicalMemory.item
                      .lng,
                  ]}
                  radius={7}
                  pathOptions={{
                    color: "#FFFFFF",
                    weight: 2,
                    fillColor: CYAN,
                    fillOpacity: 1,
                  }}
                >
                  <Popup minWidth={200}>
                    <div
                      style={{
                        padding: "5px",
                        color: "#161616",
                        textAlign: "center",
                      }}
                    >
                      <strong>
                        Recuerdo guardado
                      </strong>

                      <p
                        style={{
                          margin:
                            "6px 0 10px",
                          color: "#666666",
                          fontSize: "11px",
                        }}
                      >
                        {
                          historicalMemory
                            .experience.title
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
                          width: "100%",
                          minHeight: "37px",
                          border: "none",
                          borderRadius: "9px",
                          backgroundColor:
                            Theme.Colors
                              .primary,
                          color: "#FFFFFF",
                          fontSize: "11px",
                          fontWeight: 750,
                          cursor: "pointer",
                        }}
                      >
                        Ver MemoryCard
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            )}
        </MapContainer>

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 500,
            padding: "7px 10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            borderRadius: "12px",
            background:
              "rgba(12,12,14,0.77)",
            border:
              "1px solid rgba(255,255,255,0.10)",
            color: "#FFFFFF",
            boxShadow:
              "0 6px 18px rgba(0,0,0,0.24)",
            backdropFilter: "blur(9px)",
            pointerEvents: "none",
          }}
        >
          <img
            src={logoIG}
            alt=""
            style={{
              width: "23px",
              height: "23px",
              objectFit: "contain",
            }}
          />

          <span
            style={{
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
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
        memoryData={activeMemory}
        experienceContext={
          selectedExperience
        }
        mapContext={{
          center: selectedExperience
            ? [
                selectedExperience.latitude,
                selectedExperience.longitude,
              ]
            : center,
          path: currentPath,
          memories: currentMemories,
        }}
      />
    </main>
  );
}

type QuickFilterButtonProps = {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
};

function QuickFilterButton({
  active,
  icon: Icon,
  label,
  onClick,
}: QuickFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        minHeight: "38px",
        padding: "7px 11px",
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        borderRadius: "999px",
        border: active
          ? "1px solid rgba(255,61,232,0.48)"
          : "1px solid rgba(255,255,255,0.10)",
        background: active
          ? "linear-gradient(145deg, rgba(255,61,232,0.20), rgba(20,21,40,0.96))"
          : "rgba(255,255,255,0.045)",
        color: active
          ? "#FF6EEF"
          : "rgba(255,255,255,0.72)",
        boxShadow: active
          ? "0 0 18px rgba(255,0,255,0.12)"
          : "none",
        fontSize: "11px",
        fontWeight: 750,
        cursor: "pointer",
      }}
    >
      <Icon
        size={15}
        strokeWidth={2.1}
      />
      {label}
    </button>
  );
}

export default MapPage;
