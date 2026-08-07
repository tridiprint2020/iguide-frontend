import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  moods,
} from "../data/moods";

import {
  getRecommendationOpener,
} from "../hospes/dialog";

import {
  Theme,
} from "../styles/theme";

import {
  useJourney,
} from "../context/JourneyContext";

import {
  catalog,
} from "../data/catalog";

import type {
  Experience,
} from "../types/experience";

function HospesPrompt() {
  const [
    selectedResponse,
    setSelectedResponse,
  ] = useState<string | null>(
    null
  );

  const [
    hoveredIndex,
    setHoveredIndex,
  ] = useState<number | null>(
    null
  );

  const navigate =
    useNavigate();

  const {
    journey,
    startWalking,
  } = useJourney();

  const recommendedExp =
    useMemo<Experience | null>(() => {
      if (!selectedResponse) {
        return null;
      }

      const match =
        catalog.find(
          (experience) => {
            const tags =
              experience.tags ?? [];

            const category =
              "category" in experience
                ? String(
                    experience.category ??
                      ""
                  )
                : "";

            return (
              category ===
                selectedResponse ||
              tags.includes(
                selectedResponse
              )
            );
          }
        );

      return (
        match ??
        catalog.find(
          (experience) =>
            experience.isActive !==
            false
        ) ??
        null
      );
    }, [
      selectedResponse,
    ]);

  const activeExperience =
    journey.state === "WALKING"
      ? journey.experience
      : null;

  function handleStartHospesJourney() {
    if (!recommendedExp) {
      navigate("/explorer");
      return;
    }

    /*
     * IMPORTANTE:
     * startWalking ocurre directamente dentro
     * del gesto del usuario.
     *
     * Esto activa:
     * - JourneyContext
     * - GPS
     * - Timeline
     * - sonido preparado
     * - tracking
     *
     * NO navegamos.
     *
     * Al seguir en Home, App.tsx detectará
     * journey.state === "WALKING" y mostrará
     * ActiveJourneyBubble automáticamente.
     */
    startWalking(
      recommendedExp
    );
  }

  function handleOpenActiveJourney() {
    navigate("/journey");
  }

  return (
    <div
      style={{
        width: "100%",
        marginTop: "24px",
        padding: "16px",
        boxSizing: "border-box",
        borderRadius: "18px",
        border:
          "1px solid rgba(255,0,255,0.14)",
        background:
          "linear-gradient(145deg, rgba(20,16,28,0.98), rgba(8,10,20,0.98))",
        boxShadow:
          "0 18px 44px rgba(0,0,0,0.24)",
      }}
    >
      {/* =====================================================
          MISIÓN YA ACTIVA
      ===================================================== */}

      {activeExperience ? (
        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                flexShrink: 0,
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                borderRadius:
                  "16px",
                border:
                  "1px solid rgba(255,0,255,0.42)",
                background:
                  "rgba(255,0,255,0.12)",
                boxShadow:
                  "0 0 22px rgba(255,0,255,0.25)",
                color:
                  "#FF00FF",
                fontSize:
                  "22px",
              }}
            >
              ◉
            </div>

            <div
              style={{
                minWidth: 0,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color:
                    "#FF00FF",
                  fontSize:
                    "11px",
                  fontWeight:
                    900,
                  letterSpacing:
                    "0.12em",
                  textTransform:
                    "uppercase",
                }}
              >
                Misión activa
              </p>

              <h3
                style={{
                  margin:
                    "4px 0 0",
                  color:
                    "#FFFFFF",
                  fontSize:
                    "18px",
                  lineHeight:
                    1.2,
                }}
              >
                {
                  activeExperience.title
                }
              </h3>
            </div>
          </div>

          <p
            style={{
              margin: 0,
              color:
                "rgba(255,255,255,0.76)",
              fontSize:
                "14px",
              lineHeight:
                1.55,
            }}
          >
            Qué bueno que
            comenzaste. Hospes ya
            está acompañando tu
            recorrido y te avisará
            cuando llegues.
          </p>

          <button
            type="button"
            onClick={
              handleOpenActiveJourney
            }
            style={{
              width: "100%",
              minHeight:
                "48px",
              border: "none",
              borderRadius:
                "14px",
              background:
                "linear-gradient(135deg, #FF00FF, #D600C9)",
              color: "#FFFFFF",
              fontSize:
                "14px",
              fontWeight:
                800,
              cursor:
                "pointer",
              boxShadow:
                "0 8px 22px rgba(255,0,255,0.22)",
            }}
          >
            Ver recorrido →
          </button>
        </div>
      ) : (
        <>
          {/* =================================================
              ELECCIÓN DE MOOD
          ================================================= */}

          {!selectedResponse && (
            <>
              <p
                style={{
                  width:
                    "100%",
                  margin:
                    "0 0 16px",
                  color:
                    "#A0A0A0",
                  fontSize:
                    "12px",
                  fontWeight:
                    700,
                  textAlign:
                    "center",
                  letterSpacing:
                    "0.08em",
                  textTransform:
                    "uppercase",
                }}
              >
                ¿Qué te provoca
                ahora?
              </p>

              <div
                style={{
                  width:
                    "100%",
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  justifyContent:
                    "center",
                  gap: "10px",
                  boxSizing:
                    "border-box",
                }}
              >
                {moods.map(
                  (
                    mood,
                    index
                  ) => {
                    const isHovered =
                      hoveredIndex ===
                      index;

                    return (
                      <button
                        key={
                          mood.id
                        }
                        type="button"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          setSelectedResponse(
                            mood.id
                          );
                        }}
                        onMouseEnter={() =>
                          setHoveredIndex(
                            index
                          )
                        }
                        onMouseLeave={() =>
                          setHoveredIndex(
                            null
                          )
                        }
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          gap:
                            "7px",
                          padding:
                            "9px 15px",
                          boxSizing:
                            "border-box",
                          borderRadius:
                            "999px",
                          border:
                            `1px solid ${Theme.Colors.primary}`,
                          backgroundColor:
                            isHovered
                              ? "rgba(255,0,255,0.16)"
                              : "rgba(255,0,255,0.035)",
                          color:
                            "#FFFFFF",
                          fontSize:
                            "13px",
                          fontWeight:
                            650,
                          cursor:
                            "pointer",
                          transform:
                            isHovered
                              ? "translateY(-2px)"
                              : "translateY(0)",
                          boxShadow:
                            isHovered
                              ? "0 7px 20px rgba(255,0,255,0.24)"
                              : "none",
                          transition:
                            "all 0.18s ease",
                        }}
                      >
                        <span>
                          {
                            mood.icon
                          }
                        </span>

                        <span>
                          {
                            mood.title
                          }
                        </span>
                      </button>
                    );
                  }
                )}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/hospes"
                    )
                  }
                  style={{
                    padding:
                      "9px 15px",
                    borderRadius:
                      "999px",
                    border:
                      "1px dashed rgba(255,255,255,0.22)",
                    backgroundColor:
                      "transparent",
                    color:
                      "#A0A0A0",
                    fontSize:
                      "13px",
                    cursor:
                      "pointer",
                  }}
                >
                  Más opciones
                </button>
              </div>
            </>
          )}

          {/* =================================================
              RECOMENDACIÓN
          ================================================= */}

          {selectedResponse &&
            recommendedExp && (
              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "14px",
                  padding:
                    "15px",
                  borderRadius:
                    "16px",
                  border:
                    "1px solid rgba(255,0,255,0.20)",
                  background:
                    "linear-gradient(145deg, rgba(255,0,255,0.07), rgba(14,16,28,0.9))",
                }}
              >
                <div>
                  <span
                    style={{
                      display:
                        "block",
                      marginBottom:
                        "5px",
                      color:
                        "#FF00FF",
                      fontSize:
                        "10px",
                      fontWeight:
                        900,
                      letterSpacing:
                        "0.13em",
                      textTransform:
                        "uppercase",
                    }}
                  >
                    Hospes recomienda
                  </span>

                  <h3
                    style={{
                      margin: 0,
                      color:
                        "#FFFFFF",
                      fontSize:
                        "20px",
                    }}
                  >
                    {
                      recommendedExp.title
                    }
                  </h3>
                </div>

                <p
                  style={{
                    margin: 0,
                    color:
                      "rgba(255,255,255,0.70)",
                    fontSize:
                      "14px",
                    lineHeight:
                      1.5,
                  }}
                >
                  {
                    getRecommendationOpener()
                  }
                </p>

                <button
                  type="button"
                  onClick={
                    handleStartHospesJourney
                  }
                  style={{
                    width:
                      "100%",
                    minHeight:
                      "50px",
                    border:
                      "none",
                    borderRadius:
                      "14px",
                    background:
                      "linear-gradient(135deg, #FF00FF, #D900B8)",
                    color:
                      "#FFFFFF",
                    fontSize:
                      "14px",
                    fontWeight:
                      850,
                    cursor:
                      "pointer",
                    boxShadow:
                      "0 8px 24px rgba(255,0,255,0.26)",
                  }}
                >
                  Comenzar misión →
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedResponse(
                      null
                    )
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      "rgba(255,255,255,0.48)",
                    fontSize:
                      "12px",
                    cursor:
                      "pointer",
                  }}
                >
                  Elegir otra
                </button>
              </div>
            )}
        </>
      )}
    </div>
  );
}

export default HospesPrompt;