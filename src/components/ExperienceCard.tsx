import {
  useState,
} from "react";

import type {
  Experience,
} from "../types/experience";

import {
  difficultyLabels,
} from "../types/difficulty";

import {
  getPlaceHint,
} from "../engine/noriEngine";

import {
  useJourney,
} from "../context/JourneyContext";

import FavoriteButton from "./FavoriteButton";

import {
  Theme,
} from "../styles/theme";

type Props = {
  expedition: Experience;

  onStarted?: () => void;
};

function ExperienceCard({
  expedition,
  onStarted,
}: Props) {
  const [
    showHint,
    setShowHint,
  ] = useState(false);

  const [
    isStarting,
    setIsStarting,
  ] = useState(false);

  const {
    startWalking,
  } = useJourney();

  function handleStart() {
    if (isStarting) {
      return;
    }

    setIsStarting(true);

    try {
      startWalking(
        expedition
      );

      onStarted?.();
    } finally {
      /*
       * La obtención del GPS es asíncrona.
       * Liberamos el botón después de un breve
       * margen para impedir múltiples pulsaciones.
       */
      window.setTimeout(
        () =>
          setIsStarting(false),
        1800
      );
    }
  }

  return (
    <article
      className="ig-hover"
      style={{
        position: "relative",

        boxSizing:
          "border-box",

        border:
          `1px solid ${Theme.Colors.textSoft}22`,

        borderRadius:
          Theme.Radius.medium,

        padding:
          Theme.Space.md,

        background:
          Theme.Colors.surface,

        color:
          Theme.Colors.text,

        transition:
          "transform 0.2s, box-shadow 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",

          top: "12px",

          right: "12px",

          zIndex: 5,
        }}
      >
        <FavoriteButton
          experienceId={
            expedition.experienceId
          }
          compact
        />
      </div>

      <div
        onMouseEnter={() =>
          setShowHint(true)
        }
        onMouseLeave={() =>
          setShowHint(false)
        }
        style={{
          position:
            "relative",

          display:
            "inline-block",

          maxWidth:
            "calc(100% - 58px)",
        }}
      >
        <h2
          style={{
            margin:
              "0 0 8px",

            fontFamily:
              Theme.Typography.title,

            fontSize:
              "20px",

            color:
              Theme.Colors.text,
          }}
        >
          {expedition.title}
        </h2>

        {showHint &&
          expedition.type ===
            "expedition" && (
            <div
              style={{
                position:
                  "absolute",

                top: "100%",

                left: 0,

                zIndex: 20,

                marginTop:
                  "4px",

                maxWidth:
                  "240px",

                padding:
                  "8px 12px",

                borderRadius:
                  "8px",

                borderLeft:
                  `3px solid ${Theme.Colors.primary}`,

                backgroundColor:
                  "#FFFFFF",

                color:
                  "#1A202C",

                boxShadow:
                  Theme.Shadows.card,

                fontSize:
                  "12px",

                whiteSpace:
                  "normal",
              }}
            >
              ✦{" "}
              {getPlaceHint(
                expedition
              )}
            </div>
          )}
      </div>

      <div
        style={{
          display: "flex",

          flexWrap: "wrap",

          gap:
            Theme.Space.sm,

          marginBottom:
            "14px",

          color:
            Theme.Colors.textSoft,

          fontSize:
            "13px",
        }}
      >
        {expedition.type ===
          "expedition" && (
          <>
            <span>
              📍{" "}
              {expedition.distance}
            </span>

            <span>
              🚗{" "}
              {expedition.driveTime}
            </span>

            <span>
              ⭐{" "}
              {
                difficultyLabels[
                  expedition.difficulty
                ]
              }
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={isStarting}
        style={{
          width: "100%",

          minHeight: "44px",

          padding:
            "10px 14px",

          border: "none",

          borderRadius:
            Theme.Radius.medium,

          backgroundColor:
            Theme.Colors.primary,

          color:
            "#FFFFFF",

          fontSize: "13px",

          fontWeight: 800,

          cursor:
            isStarting
              ? "wait"
              : "pointer",

          opacity:
            isStarting
              ? 0.68
              : 1,

          boxShadow:
            "0 6px 16px rgba(255,0,122,0.26)",
        }}
      >
        {isStarting
          ? "Buscando GPS…"
          : "🧭 Iniciar recorrido →"}
      </button>
    </article>
  );
}

export default ExperienceCard;