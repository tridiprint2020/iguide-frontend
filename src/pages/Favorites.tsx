import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  catalog,
} from "../data/catalog";

import {
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

import {
  Theme,
} from "../styles/theme";

type FilterId =
  | "all"
  | FavoriteReaction;

const reactionLabels: Record<
  FavoriteReaction,
  {
    icon: string;
    label: string;
  }
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

const filters: Array<{
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

function Favorites() {
  const navigate =
    useNavigate();

  const [
    profile,
    setProfile,
  ] = useState<UserProfile>(
    () =>
      loadUserProfile()
  );

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<FilterId>(
    "all"
  );

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

    return () => {
      window.removeEventListener(
        "iguide-user-updated",
        syncProfile
      );
    };
  }, []);

  const visibleFavorites =
    useMemo(() => {
      if (
        activeFilter ===
        "all"
      ) {
        return profile.favorites;
      }

      return profile.favorites.filter(
        (favorite) =>
          favorite.reaction ===
          activeFilter
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
          experience:
            (typeof catalog)[number];
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
        > =>
          item !== null
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

    setProfile(
      updated
    );
  }

  function handleRemove(
    experienceId: string
  ) {
    const updated =
      removeFavorite(
        experienceId
      );

    setProfile(
      updated
    );
  }

  return (
    <div
      style={{
        minHeight:
          "100vh",

        backgroundColor:
          Theme.Colors.background,

        color:
          Theme.Colors.text,
      }}
    >
      <Sidebar />

      <main
        style={{
          marginLeft:
            "64px",

          width:
            "calc(100% - 64px)",

          boxSizing:
            "border-box",

          padding:
            "24px 16px 48px",
        }}
      >
        <div
          style={{
            maxWidth:
              "760px",

            margin:
              "0 auto",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            style={{
              border:
                "none",

              background:
                "transparent",

              color:
                Theme.Colors.textSoft,

              cursor:
                "pointer",

              marginBottom:
                "14px",
            }}
          >
            ← Inicio
          </button>

          <h1
            style={{
              margin:
                "0 0 6px",

              fontFamily:
                Theme.Typography.title,

              fontSize:
                "30px",
            }}
          >
            Mis lugares
          </h1>

          <p
            style={{
              margin:
                "0 0 20px",

              color:
                Theme.Colors.textSoft,

              lineHeight: 1.5,
            }}
          >
            Guarda lo que quieres
            conocer y clasifica tus
            mejores descubrimientos.
          </p>

          <div
            style={{
              display:
                "flex",

              gap:
                "8px",

              overflowX:
                "auto",

              paddingBottom:
                "8px",

              marginBottom:
                "20px",
            }}
          >
            {filters.map(
              (filter) => {
                const active =
                  activeFilter ===
                  filter.id;

                return (
                  <button
                    key={
                      filter.id
                    }
                    type="button"
                    onClick={() =>
                      setActiveFilter(
                        filter.id
                      )
                    }
                    style={{
                      flexShrink: 0,

                      border:
                        active
                          ? `1px solid ${Theme.Colors.primary}`
                          : "1px solid rgba(255,255,255,0.10)",

                      borderRadius:
                        Theme.Radius.pill,

                      padding:
                        "8px 13px",

                      backgroundColor:
                        active
                          ? "rgba(255,0,122,0.16)"
                          : Theme.Colors.surface,

                      color:
                        active
                          ? Theme.Colors.primary
                          : Theme.Colors.text,

                      fontWeight:
                        active
                          ? 800
                          : 600,

                      cursor:
                        "pointer",
                    }}
                  >
                    {
                      filter.label
                    }
                  </button>
                );
              }
            )}
          </div>

          {favoriteExperiences.length ===
          0 ? (
            <section
              style={{
                backgroundColor:
                  Theme.Colors.surface,

                border:
                  "1px solid rgba(255,255,255,0.07)",

                borderRadius:
                  Theme.Radius.large,

                padding:
                  "32px 20px",

                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize:
                    "42px",

                  marginBottom:
                    "12px",
                }}
              >
                ♡
              </div>

              <h2
                style={{
                  margin:
                    "0 0 8px",
                }}
              >
                Todavía no hay lugares
                en esta colección
              </h2>

              <p
                style={{
                  color:
                    Theme.Colors.textSoft,

                  lineHeight:
                    1.5,
                }}
              >
                Explora Huancayo y toca
                el corazón cuando
                encuentres algo que
                quieras conocer.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/explorer"
                  )
                }
                style={{
                  marginTop:
                    "12px",

                  minHeight:
                    "44px",

                  padding:
                    "10px 18px",

                  border:
                    "none",

                  borderRadius:
                    Theme.Radius.medium,

                  backgroundColor:
                    Theme.Colors.primary,

                  color:
                    "#FFFFFF",

                  fontWeight:
                    800,

                  cursor:
                    "pointer",
                }}
              >
                Explorar lugares →
              </button>
            </section>
          ) : (
            <div
              style={{
                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "16px",
              }}
            >
              {favoriteExperiences.map(
                ({
                  favorite,
                  experience,
                }) => {
                  const meta =
                    reactionLabels[
                      favorite.reaction
                    ];

                  return (
                    <section
                      key={
                        experience.experienceId
                      }
                      style={{
                        borderRadius:
                          Theme.Radius.large,

                        backgroundColor:
                          Theme.Colors.surface,

                        padding:
                          "12px",

                        border:
                          "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <ExperienceCard
                        expedition={
                          experience
                        }
                      />

                      <div
                        style={{
                          marginTop:
                            "12px",

                          paddingTop:
                            "12px",

                          borderTop:
                            "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "center",

                            gap:
                              "8px",

                            marginBottom:
                              "10px",
                          }}
                        >
                          <strong
                            style={{
                              fontSize:
                                "13px",
                            }}
                          >
                            Tu valoración
                          </strong>

                          <span
                            style={{
                              color:
                                Theme.Colors.primary,

                              fontSize:
                                "12px",

                              fontWeight:
                                800,
                            }}
                          >
                            {
                              meta.icon
                            }{" "}
                            {
                              meta.label
                            }
                          </span>
                        </div>

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
                          {(
                            [
                              "recommended",
                              "loved",
                              "must_try",
                            ] as FavoriteReaction[]
                          ).map(
                            (
                              reaction
                            ) => {
                              const option =
                                reactionLabels[
                                  reaction
                                ];

                              const active =
                                favorite.reaction ===
                                reaction;

                              return (
                                <button
                                  key={
                                    reaction
                                  }
                                  type="button"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    updateReaction(
                                      experience.experienceId,
                                      reaction
                                    );
                                  }}
                                  style={{
                                    minHeight:
                                      "44px",

                                    border:
                                      active
                                        ? `1px solid ${Theme.Colors.primary}`
                                        : "1px solid rgba(255,255,255,0.10)",

                                    borderRadius:
                                      "11px",

                                    backgroundColor:
                                      active
                                        ? "rgba(255,0,122,0.16)"
                                        : "rgba(255,255,255,0.04)",

                                    color:
                                      active
                                        ? Theme.Colors.primary
                                        : Theme.Colors.text,

                                    cursor:
                                      "pointer",

                                    fontSize:
                                      "11px",

                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {
                                    option.icon
                                  }
                                  <br />
                                  {
                                    option.label
                                  }
                                </button>
                              );
                            }
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            handleRemove(
                              experience.experienceId
                            );
                          }}
                          style={{
                            width:
                              "100%",

                            marginTop:
                              "9px",

                            padding:
                              "8px",

                            border:
                              "none",

                            background:
                              "transparent",

                            color:
                              Theme.Colors.textSoft,

                            cursor:
                              "pointer",

                            fontSize:
                              "12px",
                          }}
                        >
                          Quitar de Mis lugares
                        </button>
                      </div>
                    </section>
                  );
                }
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Favorites;