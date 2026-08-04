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
  Theme,
} from "../styles/theme";

import {
  useJourney,
} from "../context/JourneyContext";

import FavoriteButton from "./FavoriteButton";

type Props = {
  expedition: Experience;
};

function ExperienceCard({
  expedition,
}: Props) {
  const [
    showHint,
    setShowHint,
  ] = useState(false);

  const {
    startWalking,
  } = useJourney();

  return (
    <article
      className="ig-hover"
      onClick={() =>
        startWalking(
          expedition
        )
      }
      style={{
        position: "relative",

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

        cursor: "pointer",

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
        onMouseEnter={(
          event
        ) => {
          event.stopPropagation();

          setShowHint(
            true
          );
        }}
        onMouseLeave={() =>
          setShowHint(
            false
          )
        }
        style={{
          position:
            "relative",

          display:
            "inline-block",

          maxWidth:
            "calc(100% - 54px)",
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

        {showHint && (
          <div
            style={{
              position:
                "absolute",

              top: "100%",

              left: 0,

              marginTop:
                "4px",

              backgroundColor:
                "#FFFFFF",

              color:
                "#1A202C",

              borderLeft:
                `3px solid ${Theme.Colors.secondary}`,

              borderRadius:
                "8px",

              padding:
                "8px 12px",

              fontSize:
                "12px",

              whiteSpace:
                "nowrap",

              boxShadow:
                Theme.Shadows.card,

              zIndex: 20,
            }}
          >
            ✦{" "}
            {expedition.type ===
              "expedition" &&
              getPlaceHint(
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

          fontSize:
            "13px",

          color:
            Theme.Colors.textSoft,

          marginBottom:
            Theme.Space.sm,
        }}
      >
        {expedition.type ===
          "expedition" && (
          <span>
            📍{" "}
            {expedition.distance}
          </span>
        )}

        {expedition.type ===
          "expedition" && (
          <span>
            🚗{" "}
            {expedition.driveTime}
          </span>
        )}

        {expedition.type ===
          "expedition" && (
          <span>
            ⭐{" "}
            {
              difficultyLabels[
                expedition.difficulty
              ]
            }
          </span>
        )}
      </div>

      <span
        style={{
          display:
            "inline-block",

          color:
            Theme.Colors.primary,

          fontSize:
            "13px",

          fontWeight: 600,
        }}
      >
        Iniciar paseo →
      </span>
    </article>
  );
}

export default ExperienceCard;