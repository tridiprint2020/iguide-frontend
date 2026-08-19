import {
  useEffect,
  useMemo,
  useRef,
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

import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
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
  Share2,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  catalog,
} from "../data/catalog";

import {
  getMemoryCardDescriptor,
  getListingRatingLabel,
} from "../engine/experiencePresentation";

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
  loadReturnPoint,
} from "../engine/returnPointEngine";

import {
  Theme,
} from "../styles/theme";

import logoIG from "../assets/branding/logo-dark-bg.png";

import UserLocationLayer from "../components/maps/UserLocationLayer";
import ExperienceMapCard from "../components/maps/ExperienceMapCard";
import IguideMapPinStyles from "../components/maps/IguideMapPinStyles";
import MemoryPreviewModal from "../components/sharing/MemoryPreviewModal";

import {
  createIguidePin,
} from "../components/maps/iguideMapPins";

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
import { tx } from "../i18n";

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
const CYAN = "#42E8F5";

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
    )?.label
      ? tx(TYPE_FILTERS.find((filter) => filter.type === type)!.label)
      : type
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
  const [searchParams] = useSearchParams();
  const foodNearbyMode =
    searchParams.get("nearby") === "food";
  const focusReturnPointMode =
    searchParams.get("return") === "1";
  const {
    journey,
    startWalking,
  } = useJourney();

  const [activeFilters, setActiveFilters] =
    useState<ExperienceType[]>(() =>
      foodNearbyMode
        ? ["restaurant", "cafe"]
        : []
    );

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

  const [returnPoint] =
    useState(() => loadReturnPoint());

  const mapRef =
    useRef<LeafletMap | null>(null);

  const mapSectionRef =
    useRef<HTMLElement | null>(null);

  const markerRefs = useRef(
    new Map<
      string,
      LeafletMarker
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
    const isRemoving =
      activeFilters.includes(type);

    const nextFilters = isRemoving
      ? activeFilters.filter(
          (activeType) =>
            activeType !== type
        )
      : [
          ...activeFilters,
          type,
        ];

    setActiveFilters(nextFilters);

    if (!isRemoving) {
      const matchingExperiences =
        activeCatalog.filter(
          (experience) =>
            nextFilters.includes(
              experience.type
            )
        );

      window.setTimeout(() => {
        const map = mapRef.current;

        if (
          map &&
          matchingExperiences.length === 1
        ) {
          map.flyTo(
            [
              matchingExperiences[0]
                .latitude,
              matchingExperiences[0]
                .longitude,
            ],
            17,
            {
              animate: true,
              duration: 0.45,
            }
          );
        } else if (
          map &&
          matchingExperiences.length > 1
        ) {
          map.fitBounds(
            matchingExperiences.map(
              (experience) =>
                [
                  experience.latitude,
                  experience.longitude,
                ] as [number, number]
            ),
            {
              padding: [28, 28],
              maxZoom: 16,
              animate: true,
            }
          );
        }

        if (
          window.matchMedia(
            "(max-width: 700px)"
          ).matches
        ) {
          mapSectionRef.current
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
        }
      }, 90);
    }
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

  const latestJourney =
    useMemo<{
      experience: Experience;
      track: ExpeditionTrack;
    } | null>(() => {
      let latest: {
        experience: Experience;
        track: ExpeditionTrack;
      } | null = null;

      for (const experience of activeCatalog) {
        const sessions = loadAllTrackSessions(
          experience.experienceId
        );

        for (const session of sessions) {
          if (
            session.timeline.length > 0 &&
            (!latest || session.startedAt > latest.track.startedAt)
          ) {
            latest = {
              experience,
              track: session,
            };
          }
        }
      }

      return latest;
    }, [activeCatalog]);

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
        tx(
          "Ya tienes una misión activa: {{title}}. Continúala o abandónala antes de iniciar otra.",
          { title: activeExperience.title }
        )
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

  function focusReturnPoint() {
    if (!returnPoint) {
      return;
    }

    mapRef.current?.flyTo(
      [returnPoint.lat, returnPoint.lng],
      18,
      {
        animate: true,
        duration: 0.55,
      }
    );
  }

  useEffect(() => {
    if (
      !focusReturnPointMode ||
      !returnPoint
    ) {
      return;
    }

    const focusTimer =
      window.setTimeout(() => {
        mapRef.current?.flyTo(
          [
            returnPoint.lat,
            returnPoint.lng,
          ],
          18,
          {
            animate: true,
            duration: 0.55,
          }
        );

        mapSectionRef.current
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 220);

    return () => {
      window.clearTimeout(
        focusTimer
      );
    };
  }, [
    focusReturnPointMode,
    returnPoint,
  ]);

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

  function openLatestJourneyCard() {
    if (!latestJourney) {
      return;
    }

    setSelectedExperience(
      latestJourney.experience
    );
    setActiveMemory(
      MemoryCardEngine.build(
        latestJourney.experience,
        latestJourney.track
      )
    );
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
          {tx("Inicio")}
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
          {tx("Tu ciudad, a tu manera")}
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
          {foodNearbyMode
            ? tx("¿Dónde comer algo rico cerca?")
            : tx("Explora cerca de ti")}
        </h1>

        <p
          style={{
            margin: "8px 0 0",
            color:
              Theme.Colors.textSoft,
            fontSize: "13px",
          }}
        >
          {foodNearbyMode
            ? tx("Mostramos restaurantes y cafés para elegir desde tu ubicación.")
            : tx("Busca por nombre, filtra e inicia una misión.")}
        </p>
      </header>

      <section
        style={{
          width: "100%",
          maxWidth: "760px",
          boxSizing: "border-box",
          margin: "0 auto 9px",
          padding: "8px 9px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderRadius: "14px",
          border: "1px solid rgba(66,232,245,0.18)",
          background:
            "linear-gradient(145deg, rgba(66,232,245,0.08), rgba(255,32,206,0.05))",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "32px",
            height: "32px",
            flex: "0 0 auto",
            display: "grid",
            placeItems: "center",
            borderRadius: "11px",
            color: "#42E8F5",
            background: "rgba(66,232,245,0.10)",
            border: "1px solid rgba(66,232,245,0.24)",
          }}
        >
          <House size={17} />
        </span>

        <div
          style={{
            minWidth: 0,
            flex: 1,
            textAlign: "left",
          }}
        >
          <strong
            style={{
              display: "block",
              overflow: "hidden",
              fontSize: "10px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {returnPoint
              ? tx("Tu punto de regreso está guardado")
              : tx("Guarda tu punto de regreso desde Perfil")}
          </strong>

          <span
            style={{
              display: "block",
              marginTop: "1px",
              overflow: "hidden",
              color: "rgba(255,255,255,0.56)",
              fontSize: "8px",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {tx("Puedes cambiar este punto después desde Perfil.")}
          </span>
        </div>

        {returnPoint && (
          <button
            type="button"
            onClick={focusReturnPoint}
            style={{
              minHeight: "34px",
              flex: "0 0 auto",
              padding: "6px 8px",
              borderRadius: "10px",
              border: "1px solid rgba(66,232,245,0.22)",
              background: "rgba(66,232,245,0.06)",
              color: "#42E8F5",
              fontSize: "9px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {tx("Ver casita")}
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            navigate("/perfil")
          }
          style={{
            minHeight: "34px",
            flex: "0 0 auto",
            padding: "6px 8px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.05)",
            color: "#FFFFFF",
            fontSize: "9px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {returnPoint
            ? tx("Editar en Perfil")
            : tx("Configurar en Perfil")}
        </button>
      </section>

      <section
        aria-label={tx("Buscar en el mapa")}
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
            placeholder={tx("Buscar Don Juko, París, café, museo...")}
            aria-label={tx("Buscar lugar por nombre o categoría")}
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
              aria-label={tx("Limpiar búsqueda")}
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
                          letterSpacing:
                            "0.04em",
                        }}
                      >
                        {getMemoryCardDescriptor(
                          experience.placeCategory ??
                            experience.type,
                          experience.listingStatus
                        )}
                      </small>

                      <small
                        style={{
                          display: "block",
                          marginTop: "2px",
                          color: "#39E7FF",
                          fontSize: "10px",
                          fontWeight: 700,
                        }}
                      >
                        {getListingRatingLabel(
                          experience.rating
                        )}
                      </small>
                    </span>

                    <span
                      style={{
                        color: MAGENTA,
                        fontWeight: 850,
                      }}
                    >
                      {tx("Ver")} →
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
                {tx("Todavía no encontramos ese lugar.")}
              </div>
            )}
          </div>
        )}
      </section>

      <section
        aria-label={tx("Filtros rápidos del mapa")}
        style={{
          maxWidth: "1080px",
          margin: "0 auto 7px",
          display: "flex",
          flexWrap: "nowrap",
          justifyContent: "flex-start",
          gap: "6px",
          overflowX: "auto",
          padding: "1px 1px 3px",
          scrollbarWidth: "none",
        }}
      >
        <QuickFilterButton
          active={onlyUnvisited}
          icon={Sparkles}
          label={tx("Descubrir")}
          onClick={() =>
            setOnlyUnvisited(
              (current) => !current
            )
          }
        />

        <QuickFilterButton
          active={onlyFavorites}
          icon={Heart}
          label={tx("Favoritos")}
          onClick={() =>
            setOnlyFavorites(
              (current) => !current
            )
          }
        />

        <QuickFilterButton
          active={showMemories}
          icon={Images}
          label={tx("Recuerdos")}
          onClick={() =>
            setShowMemories(
              (current) => !current
            )
          }
        />

        {latestJourney && (
          <QuickFilterButton
            active={false}
            icon={Share2}
            label={tx("Compartir")}
            onClick={openLatestJourneyCard}
          />
        )}
      </section>

      <section
        aria-label={tx("Categorías del mapa")}
        style={{
          maxWidth: "1080px",
          margin: "0 auto 7px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: "7px",
            overflowX: "auto",
            padding: "1px 1px 4px",
            scrollbarWidth: "none",
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
                    minHeight: "40px",
                    flex: "0 0 auto",
                    padding: "7px 10px",
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
                    whiteSpace: "nowrap",
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
                    {tx(filter.label)}
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
              {tx("Limpiar filtros")}
            </button>
          </div>
        )}
      </section>

      <div
        style={{
          maxWidth: "1240px",
          margin: "0 auto 6px",
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
          {tx("Los lugares solicitados se muestran como pines en el mapa.")}
        </span>

        <span>
          {tx("Mostrando")} {" "}
          <strong
            style={{
              color:
                Theme.Colors.primary,
            }}
          >
            {visibleExperiences.length}
          </strong>{" "}
          {tx("lugares")}
        </span>
      </div>

      <section
        ref={mapSectionRef}
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

          {returnPoint && (
            <Marker
              position={[
                returnPoint.lat,
                returnPoint.lng,
              ]}
              icon={createIguidePin(
                "home",
                tx("Mi hotel / punto de regreso")
              )}
            >
              <Popup minWidth={210}>
                <div
                  style={{
                    padding: "5px",
                    color: "#161616",
                    textAlign: "center",
                  }}
                >
                  <strong>{tx("Mi punto de regreso")}</strong>
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#666666",
                      fontSize: "11px",
                    }}
                  >
                    {tx("Esta casita queda guardada en este celular.")}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

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

              return (
                <Marker
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
                  position={[
                    experience.latitude,
                    experience.longitude,
                  ]}
                  icon={createIguidePin(
                    isCurrentMission
                      ? "mission"
                      : isVisited
                        ? "visited"
                        : "catalog",
                    experience.title
                  )}
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
                        {tx("Recuerdo guardado")}
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
                        {tx("Ver MemoryCard")}
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

      <IguideMapPinStyles />

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
        flex: "0 0 auto",
        padding: "6px 8px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
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
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      <Icon
        size={14}
        strokeWidth={2.1}
      />
      {label}
    </button>
  );
}

export default MapPage;
