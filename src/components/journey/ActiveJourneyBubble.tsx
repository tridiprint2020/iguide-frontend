import {
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useJourney,
} from "../../context/JourneyContext";

export default function ActiveJourneyBubble() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    journey,
    abandonJourney,
  } = useJourney();

  const [
    expanded,
    setExpanded,
  ] = useState(false);

  const experience =
    journey.experience;

  const hasActiveJourney =
    experience !== null &&
    journey.state !== "IDLE" &&
    journey.state !== "COMPLETED";

  if (
    !hasActiveJourney ||
    !experience
  ) {
    return null;
  }

  /*
   * Después del guard clause, TypeScript sabe
   * que activeExperience nunca puede ser null.
   */
  const activeExperience =
    experience;

  const isJourneyScreen =
    location.pathname ===
    "/journey";

  function handleContinueJourney() {
    setExpanded(false);
    navigate("/journey");
  }

  function handleGoHome() {
    setExpanded(false);
    navigate("/");
  }

  function handleAbandon() {
    const confirmed =
      window.confirm(
        `¿Abandonar definitivamente la ruta hacia ${activeExperience.title}?\n\nEl recorrido registrado permanecerá en tu historial.`
      );

    if (!confirmed) {
      return;
    }

    abandonJourney();
    setExpanded(false);
    navigate("/explorer");
  }

  return (
    <>
      {expanded && (
        <div
          role="dialog"
          aria-label="Controles de misión activa"
          style={{
            position: "fixed",
            right: "16px",
            bottom: "158px",
            zIndex: 10001,

            width:
              "min(270px, calc(100vw - 32px))",

            boxSizing:
              "border-box",

            padding: "14px",

            borderRadius:
              "20px",

            background:
              "rgba(14,14,16,0.97)",

            border:
              "1px solid rgba(255,255,255,0.10)",

            boxShadow:
              "0 18px 50px rgba(0,0,0,0.52)",

            backdropFilter:
              "blur(18px)",
          }}
        >
          <div
            style={{
              marginBottom:
                "12px",
            }}
          >
            <span
              style={{
                display:
                  "block",

                color:
                  "#FF00FF",

                fontSize:
                  "10px",

                fontWeight:
                  800,

                letterSpacing:
                  "0.08em",

                textTransform:
                  "uppercase",
              }}
            >
              Misión activa
            </span>

            <strong
              style={{
                display:
                  "block",

                marginTop:
                  "3px",

                color:
                  "#FFFFFF",

                fontSize:
                  "16px",
              }}
            >
              {
                activeExperience.title
              }
            </strong>

            <span
              style={{
                display:
                  "block",

                marginTop:
                  "3px",

                color:
                  "rgba(255,255,255,0.58)",

                fontSize:
                  "11px",
              }}
            >
              {
                journey.timeline
                  .length
              }{" "}
              eventos registrados
            </span>
          </div>

          <div
            style={{
              display: "flex",

              flexDirection:
                "column",

              gap: "8px",
            }}
          >
            {!isJourneyScreen && (
              <button
                type="button"
                onClick={
                  handleContinueJourney
                }
                style={{
                  minHeight:
                    "44px",

                  border:
                    "none",

                  borderRadius:
                    "12px",

                  backgroundColor:
                    "#FF00FF",

                  color:
                    "#FFFFFF",

                  fontWeight:
                    800,

                  cursor:
                    "pointer",
                }}
              >
                🧭 Volver al recorrido
              </button>
            )}

            <button
              type="button"
              onClick={
                handleGoHome
              }
              style={{
                minHeight:
                  "42px",

                borderRadius:
                  "12px",

                border:
                  "1px solid rgba(255,255,255,0.12)",

                background:
                  "rgba(255,255,255,0.05)",

                color:
                  "#FFFFFF",

                fontWeight:
                  700,

                cursor:
                  "pointer",
              }}
            >
              🏠 Ir al inicio
            </button>

            <button
              type="button"
              onClick={
                handleAbandon
              }
              style={{
                minHeight:
                  "42px",

                borderRadius:
                  "12px",

                border:
                  "1px solid rgba(255,138,0,0.35)",

                background:
                  "rgba(255,138,0,0.10)",

                color:
                  "#FFB15C",

                fontWeight:
                  700,

                cursor:
                  "pointer",
              }}
            >
              ⛔ Abandonar definitivamente
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          setExpanded(
            (current) =>
              !current
          )
        }
        aria-label={`Controles de la misión hacia ${activeExperience.title}`}
        title={`Misión activa: ${activeExperience.title}`}
        style={{
          position: "fixed",
          right: "18px",
          bottom: "84px",
          zIndex: 10002,

          width: "64px",
          height: "64px",

          borderRadius:
            "50%",

          border:
            "3px solid rgba(255,255,255,0.92)",

          background:
            "linear-gradient(145deg, #FF007A 0%, #C90061 100%)",

          color:
            "#FFFFFF",

          boxShadow:
            "0 10px 30px rgba(255,0,122,0.42)",

          cursor:
            "pointer",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          padding: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize:
              "27px",

            lineHeight: 1,
          }}
        >
          {expanded
            ? "×"
            : "🧭"}
        </span>

        {!expanded && (
          <>
            <span
              aria-hidden="true"
              style={{
                position:
                  "absolute",

                top: "-2px",
                right: "-2px",

                width:
                  "17px",

                height:
                  "17px",

                borderRadius:
                  "50%",

                backgroundColor:
                  "#41E28A",

                border:
                  "3px solid #FFFFFF",
              }}
            />

            <span
              aria-hidden="true"
              className="active-journey-pulse"
            />
          </>
        )}
      </button>

      {!expanded && (
        <div
          style={{
            position:
              "fixed",

            right:
              "18px",

            bottom:
              "52px",

            zIndex:
              10000,

            maxWidth:
              "190px",

            padding:
              "6px 10px",

            borderRadius:
              "999px",

            backgroundColor:
              "rgba(10,10,10,0.92)",

            color:
              "#FFFFFF",

            fontSize:
              "11px",

            fontWeight:
              700,

            textAlign:
              "center",

            boxShadow:
              "0 5px 18px rgba(0,0,0,0.28)",

            whiteSpace:
              "nowrap",

            overflow:
              "hidden",

            textOverflow:
              "ellipsis",
          }}
        >
          Misión activa ·{" "}
          {
            activeExperience.title
          }
        </div>
      )}

      <style>
        {`
          @keyframes activeJourneyPulse {
            0% {
              transform: scale(0.82);
              opacity: 0.75;
            }

            70% {
              transform: scale(1.55);
              opacity: 0;
            }

            100% {
              transform: scale(1.55);
              opacity: 0;
            }
          }

          .active-journey-pulse {
            position: absolute;
            inset: -7px;
            border: 3px solid rgba(255, 0, 122, 0.65);
            border-radius: 50%;
            pointer-events: none;
            animation: activeJourneyPulse 1.8s ease-out infinite;
          }
        `}
      </style>
    </>
  );
}