import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ArrowRight,
  Bookmark,
  Compass,
  Flame,
  Heart,
  House,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  catalog,
} from "../data/catalog";

import {
  getFavoriteReactions,
  loadUserProfile,
  removeFavorite,
  setFavoriteReaction,
} from "../data/user";

import type {
  FavoriteReaction,
  UserFavorite,
  UserProfile,
} from "../types/user/user";

import ExperienceCard from "../components/ExperienceCard";
import Sidebar from "../components/Sidebar";

import logoIG from "../assets/branding/logo-dark-bg.png";

import {
  Theme,
} from "../styles/theme";
import { tx } from "../i18n";

type FilterId =
  | "all"
  | FavoriteReaction;

type ReactionMeta = {
  icon: string;
  label: string;
};

const REACTION_LABELS: Record<
  FavoriteReaction,
  ReactionMeta
> = {
  saved: {
    icon: "♡",
    label: "Guardado",
  },
  recommended: {
    icon: "👍",
    label: "Recomendable",
  },
  loved: {
    icon: "❤️",
    label: "Me encantó",
  },
  must_try: {
    icon: "🔥",
    label: "Imperdible",
  },
};

const FILTERS: Array<{
  id: FilterId;
  label: string;
}> = [
  {
    id: "all",
    label: "Todos",
  },
  {
    id: "saved",
    label: "Guardados",
  },
  {
    id: "recommended",
    label: "Recomendables",
  },
  {
    id: "loved",
    label: "Me encantaron",
  },
  {
    id: "must_try",
    label: "Imperdibles",
  },
];

const REACTION_OPTIONS: FavoriteReaction[] = [
  "recommended",
  "loved",
  "must_try",
];

function Favorites() {
  const navigate = useNavigate();

  const [profile, setProfile] =
    useState<UserProfile>(() =>
      loadUserProfile()
    );

  const [activeFilter, setActiveFilter] =
    useState<FilterId>("all");

  useEffect(() => {
    function syncProfile() {
      setProfile(
        loadUserProfile()
      );
    }

    window.addEventListener(
      "iguide-user-updated",
      syncProfile
    );

    window.addEventListener(
      "storage",
      syncProfile
    );

    return () => {
      window.removeEventListener(
        "iguide-user-updated",
        syncProfile
      );

      window.removeEventListener(
        "storage",
        syncProfile
      );
    };
  }, []);

  const reactionCounts = useMemo(() => {
    return profile.favorites.reduce(
      (counts, favorite) => {
        getFavoriteReactions(
          favorite
        ).forEach((reaction) => {
          counts[reaction] += 1;
        });
        return counts;
      },
      {
        saved: 0,
        recommended: 0,
        loved: 0,
        must_try: 0,
      } as Record<FavoriteReaction, number>
    );
  }, [profile.favorites]);

  const visibleFavorites = useMemo(() => {
    if (activeFilter === "all") {
      return profile.favorites;
    }

    return profile.favorites.filter(
      (favorite) =>
        getFavoriteReactions(
          favorite
        ).includes(activeFilter)
    );
  }, [
    activeFilter,
    profile.favorites,
  ]);

  const favoriteExperiences =
    visibleFavorites
      .map(
        (
          favorite
        ): {
          favorite: UserFavorite;
          experience: (typeof catalog)[number];
        } | null => {
          const experience =
            catalog.find(
              (item) =>
                item.experienceId ===
                favorite.experienceId
            );

          if (!experience) {
            return null;
          }

          return {
            favorite,
            experience,
          };
        }
      )
      .filter(
        (
          item
        ): item is NonNullable<
          typeof item
        > => item !== null
      );

  function updateReaction(
    experienceId: string,
    reaction: FavoriteReaction
  ) {
    const updated =
      setFavoriteReaction(
        experienceId,
        reaction
      );

    setProfile(updated);
  }

  function handleRemove(
    experienceId: string
  ) {
    const updated =
      removeFavorite(
        experienceId
      );

    setProfile(updated);
  }

  const hasFavorites =
    profile.favorites.length > 0;

  const isFilteredEmpty =
    hasFavorites &&
    favoriteExperiences.length === 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 52% 0%, rgba(255,0,255,0.12), transparent 30%), radial-gradient(circle at 100% 28%, rgba(0,230,255,0.08), transparent 24%), #0D0E13",
        color: Theme.Colors.text,
      }}
    >
      <Sidebar />

      <main
        style={{
          minHeight: "100vh",
          marginLeft: "64px",
          width: "calc(100% - 64px)",
          boxSizing: "border-box",
          padding: "16px 14px 44px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "620px",
            margin: "0 auto",
          }}
        >
          {/* CABECERA COHERENTE CON PERFIL */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              style={{
                minHeight: "40px",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 13px",
                borderRadius: "12px",
                border:
                  "1px solid rgba(255,255,255,0.10)",
                background:
                  "rgba(255,255,255,0.06)",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 750,
                cursor: "pointer",
              }}
            >
              <House
                size={16}
                strokeWidth={2.2}
              />
            {tx("Inicio")}
            </button>

            <img
              src={logoIG}
              alt="I.GUIDE"
              style={{
                width: "68px",
                maxHeight: "46px",
                display: "block",
                objectFit: "contain",
              }}
            />
          </header>

          {/* IDENTIDAD DE LA COLECCIÓN */}
          <section
            style={{
              position: "relative",
              overflow: "hidden",
              marginBottom: "16px",
              padding: "18px",
              borderRadius: "22px",
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
              border:
                "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                "0 16px 35px rgba(0,0,0,0.22)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                width: "150px",
                height: "150px",
                right: "-55px",
                top: "-75px",
                borderRadius: "50%",
                background:
                  "rgba(255,0,255,0.12)",
                filter: "blur(4px)",
              }}
            />

            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: "68px",
                  height: "68px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "22px",
                  background:
                    "linear-gradient(145deg, #FF00FF, #C60073)",
                  color: "#FFFFFF",
                  boxShadow:
                    "0 10px 28px rgba(255,0,122,0.30)",
                }}
              >
                <Heart
                  size={31}
                  strokeWidth={2}
                />
              </div>

              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    color:
                      Theme.Colors.primary,
                    fontSize: "9px",
                    fontWeight: 850,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {tx("Tu mapa emocional")}
                </span>

                <h1
                  style={{
                    margin: 0,
                    color: "#FFFFFF",
                    fontFamily:
                      Theme.Typography.title,
                    fontSize:
                      "clamp(1.7rem, 7vw, 2.35rem)",
                    lineHeight: 1.05,
                  }}
                >
                  {tx("Mis lugares")}
                </h1>

                <p
                  style={{
                    margin: "7px 0 0",
                    color:
                      Theme.Colors.textSoft,
                    fontSize: "12px",
                    lineHeight: 1.45,
                  }}
                >
                  {tx("Lugares que quieres vivir, recomendar o repetir.")}
                </p>
              </div>
            </div>
          </section>

          {/* RESUMEN VISUAL */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "9px",
              marginBottom: "16px",
            }}
          >
            <CollectionStat
              icon={<Bookmark size={17} />}
              value={`${profile.favorites.length}`}
              label={tx("Guardados")}
            />

            <CollectionStat
              icon={<Heart size={17} />}
              value={`${reactionCounts.loved}`}
              label={tx("Amados")}
            />

            <CollectionStat
              icon={<Flame size={17} />}
              value={`${reactionCounts.must_try}`}
              label={tx("Imperdibles")}
            />
          </section>

          {/* FILTROS */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "8px",
              marginBottom: "14px",
              scrollbarWidth: "none",
            }}
          >
            {FILTERS.map((filter) => {
              const active =
                activeFilter === filter.id;

              const count =
                filter.id === "all"
                  ? profile.favorites.length
                  : reactionCounts[filter.id];

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      filter.id
                    )
                  }
                  style={{
                    flexShrink: 0,
                    minHeight: "38px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 12px",
                    borderRadius:
                      Theme.Radius.pill,
                    border: active
                      ? `1px solid ${Theme.Colors.primary}`
                      : "1px solid rgba(255,255,255,0.10)",
                    background: active
                      ? "linear-gradient(145deg, rgba(255,0,255,0.18), rgba(21,22,35,0.98))"
                      : "rgba(255,255,255,0.045)",
                    color: active
                      ? Theme.Colors.primary
                      : Theme.Colors.text,
                    fontWeight: active
                      ? 800
                      : 650,
                    cursor: "pointer",
                  }}
                >
                  {tx(filter.label)}

                  <span
                    style={{
                      minWidth: "18px",
                      height: "18px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "999px",
                      background:
                        "rgba(255,255,255,0.08)",
                      color: "inherit",
                      fontSize: "9px",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {!hasFavorites ? (
            <EmptyCollection
              title={tx("Tu colección empieza en la calle")}
              description={tx("Explora Huancayo y guarda ese lugar que un local sí recomendaría.")}
              actionLabel={tx("Descubrir lugares locales")}
              onAction={() =>
                navigate("/explorer")
              }
            />
          ) : isFilteredEmpty ? (
            <EmptyCollection
              title={tx("Aún no hay lugares aquí")}
              description={tx("Prueba otra colección o sigue explorando para sumar nuevos descubrimientos.")}
              actionLabel={tx("Ver todos")}
              onAction={() =>
                setActiveFilter("all")
              }
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {favoriteExperiences.map(
                ({
                  favorite,
                  experience,
                }) => {
                  const meta =
                    REACTION_LABELS[
                      favorite.reaction
                    ];

                  return (
                    <section
                      key={
                        experience.experienceId
                      }
                      style={{
                        overflow: "hidden",
                        borderRadius: "22px",
                        background:
                          "linear-gradient(145deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))",
                        border:
                          "1px solid rgba(255,255,255,0.08)",
                        boxShadow:
                          "0 16px 32px rgba(0,0,0,0.20)",
                      }}
                    >
                      <div
                        style={{
                          padding: "12px",
                        }}
                      >
                        <ExperienceCard
                          expedition={
                            experience
                          }
                        />
                      </div>

                      <div
                        style={{
                          padding:
                            "13px 14px 14px",
                          borderTop:
                            "1px solid rgba(255,255,255,0.07)",
                          background:
                            "rgba(8,9,16,0.42)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "10px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "7px",
                              color: "#FFFFFF",
                              fontSize: "12px",
                              fontWeight: 800,
                            }}
                          >
                            <Sparkles
                              size={15}
                              color={
                                Theme.Colors.primary
                              }
                            />
                            {tx("Tu vínculo local")}
                          </div>

                          <span
                            style={{
                              color:
                                Theme.Colors.primary,
                              fontSize: "11px",
                              fontWeight: 850,
                            }}
                          >
                            {meta.icon} {tx(meta.label)}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(3, minmax(0, 1fr))",
                            gap: "7px",
                          }}
                        >
                          {REACTION_OPTIONS.map(
                            (reaction) => {
                              const option =
                                REACTION_LABELS[
                                  reaction
                                ];

                              const active =
                                getFavoriteReactions(
                                  favorite
                                ).includes(reaction);

                              return (
                                <button
                                  key={reaction}
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateReaction(
                                      experience.experienceId,
                                      reaction
                                    );
                                  }}
                                  style={{
                                    minHeight: "52px",
                                    padding: "7px 5px",
                                    borderRadius: "13px",
                                    border: active
                                      ? `1px solid ${Theme.Colors.primary}`
                                      : "1px solid rgba(255,255,255,0.09)",
                                    background: active
                                      ? "linear-gradient(145deg, rgba(255,0,255,0.18), rgba(20,21,34,0.98))"
                                      : "rgba(255,255,255,0.035)",
                                    color: active
                                      ? Theme.Colors.primary
                                      : Theme.Colors.text,
                                    cursor: "pointer",
                                    fontSize: "10px",
                                    fontWeight: 750,
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "block",
                                      marginBottom: "3px",
                                      fontSize: "16px",
                                    }}
                                  >
                                    {option.icon}
                                  </span>

                                  {tx(option.label)}
                                </button>
                              );
                            }
                          )}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(0, 1fr) 46px",
                            gap: "8px",
                            marginTop: "10px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/expedition/${experience.slug}`
                              )
                            }
                            style={{
                              minHeight: "44px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "7px",
                              border: "none",
                              borderRadius: "13px",
                              background:
                                "linear-gradient(145deg, #FF00FF, #E0008A)",
                              color: "#FFFFFF",
                              fontSize: "11px",
                              fontWeight: 850,
                              cursor: "pointer",
                              boxShadow:
                                "0 8px 22px rgba(255,0,122,0.22)",
                            }}
                          >
                            {tx("Vivir esta misión")}
                            <ArrowRight
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemove(
                                experience.experienceId
                              );
                            }}
                            aria-label={tx("Quitar {{title}} de favoritos", { title: experience.title })}
                            title={tx("Quitar de favoritos")}
                            style={{
                              minHeight: "44px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "13px",
                              border:
                                "1px solid rgba(255,255,255,0.09)",
                              background:
                                "rgba(255,255,255,0.04)",
                              color:
                                Theme.Colors.textSoft,
                              cursor: "pointer",
                            }}
                          >
                            <Trash2
                              size={17}
                              strokeWidth={1.8}
                            />
                          </button>
                        </div>
                      </div>
                    </section>
                  );
                }
              )}
            </div>
          )}

          {hasFavorites && (
            <section
              style={{
                marginTop: "16px",
                padding: "17px",
                borderRadius: "20px",
                background:
                  "linear-gradient(145deg, rgba(0,230,255,0.08), rgba(255,255,255,0.03))",
                border:
                  "1px solid rgba(0,230,255,0.16)",
                textAlign: "center",
              }}
            >
              <Compass
                size={23}
                color="#00E6FF"
              />

              <h2
                style={{
                  margin: "8px 0 5px",
                  color: "#FFFFFF",
                  fontSize: "16px",
                }}
              >
                {tx("Tu ciudad todavía tiene secretos")}
              </h2>

              <p
                style={{
                  margin: "0 0 13px",
                  color:
                    Theme.Colors.textSoft,
                  fontSize: "11px",
                  lineHeight: 1.5,
                }}
              >
                {tx("Sigue guardando lugares que te hagan sentir más local.")}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/explorer")
                }
                style={{
                  width: "100%",
                  minHeight: "44px",
                  border: "none",
                  borderRadius: "13px",
                  background:
                    "rgba(0,230,255,0.12)",
                  color: "#00E6FF",
                  fontSize: "11px",
                  fontWeight: 850,
                  cursor: "pointer",
                }}
              >
                {tx("Encontrar otro lugar")} →
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

type CollectionStatProps = {
  icon: ReactNode;
  value: string;
  label: string;
};

function CollectionStat({
  icon,
  value,
  label,
}: CollectionStatProps) {
  return (
    <article
      style={{
        minWidth: 0,
        minHeight: "92px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 6px",
        borderRadius: "17px",
        background: Theme.Colors.surface,
        border:
          "1px solid rgba(255,255,255,0.07)",
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          color: Theme.Colors.primary,
        }}
      >
        {icon}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: "7px",
          color: "#FFFFFF",
          fontSize: "19px",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",
          marginTop: "2px",
          color: Theme.Colors.textSoft,
          fontSize: "9px",
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    </article>
  );
}

type EmptyCollectionProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

function EmptyCollection({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyCollectionProps) {
  return (
    <section
      style={{
        padding: "30px 20px",
        borderRadius: "22px",
        background:
          "linear-gradient(145deg, rgba(255,0,255,0.08), rgba(255,255,255,0.035))",
        border:
          "1px solid rgba(255,0,255,0.15)",
        textAlign: "center",
        boxShadow:
          "0 16px 34px rgba(0,0,0,0.18)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "60px",
          height: "60px",
          margin: "0 auto 13px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "20px",
          background:
            "linear-gradient(145deg, #FF00FF, #C60073)",
          color: "#FFFFFF",
          boxShadow:
            "0 10px 28px rgba(255,0,122,0.25)",
        }}
      >
        <Heart
          size={28}
          strokeWidth={2}
        />
      </div>

      <h2
        style={{
          margin: "0 0 7px",
          color: "#FFFFFF",
          fontSize: "18px",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          maxWidth: "360px",
          margin: "0 auto 15px",
          color: Theme.Colors.textSoft,
          fontSize: "11px",
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>

      <button
        type="button"
        onClick={onAction}
        style={{
          width: "100%",
          minHeight: "46px",
          border: "none",
          borderRadius: "13px",
          background:
            "linear-gradient(145deg, #FF00FF, #E0008A)",
          color: "#FFFFFF",
          fontSize: "12px",
          fontWeight: 850,
          cursor: "pointer",
          boxShadow:
            "0 9px 24px rgba(255,0,122,0.24)",
        }}
      >
        {actionLabel} →
      </button>
    </section>
  );
}

export default Favorites;
