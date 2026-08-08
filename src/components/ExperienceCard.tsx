import {
  useState,
} from "react";

import {
  Car,
  Gauge,
  LoaderCircle,
  MapPin,
  Route,
} from "lucide-react";

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
import { tx } from "../i18n";

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
        position:
          "relative",

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
          position:
            "absolute",

          top:
            "12px",

          right:
            "12px",

          zIndex:
            5,
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

                top:
                  "100%",

                left:
                  0,

                zIndex:
                  20,

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
              {tx(getPlaceHint(
                expedition
              ))}
            </div>
          )}
      </div>

      {expedition.type ===
        "expedition" && (
        <div
          style={{
            display:
              "flex",

            flexWrap:
              "wrap",

            gap:
              "8px",

            marginBottom:
              "14px",
          }}
        >
          <MetaChip
            icon={MapPin}
            text={
              expedition.distance
            }
          />

          <MetaChip
            icon={Car}
            text={
              expedition.driveTime
            }
          />

          <MetaChip
            icon={Gauge}
            text={
              difficultyLabels[
                expedition.difficulty
              ]
            }
          />
        </div>
      )}

      <button
        type="button"
        onClick={
          handleStart
        }
        disabled={
          isStarting
        }
        style={{
          width:
            "100%",

          minHeight:
            "62px",

          display:
            "grid",

          gridTemplateColumns:
            "44px minmax(0, 1fr)",

          alignItems:
            "center",

          gap:
            "11px",

          padding:
            "9px 14px",

          border:
            "1px solid rgba(255,255,255,0.14)",

          borderRadius:
            "17px",

          background:
            isStarting
              ? "linear-gradient(145deg, rgba(255,61,232,0.58), rgba(125,0,110,0.72))"
              : "linear-gradient(145deg, #FF3DE8 0%, #D4008D 58%, #7D006E 100%)",

          color:
            "#FFFFFF",

          cursor:
            isStarting
              ? "wait"
              : "pointer",

          opacity:
            isStarting
              ? 0.78
              : 1,

          textAlign:
            "left",

          boxShadow:
            "0 12px 28px rgba(255,0,184,0.26), 0 0 18px rgba(255,0,255,0.12)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width:
              "42px",

            height:
              "42px",

            display:
              "grid",

            placeItems:
              "center",

            borderRadius:
              "14px",

            background:
              "rgba(8,9,18,0.24)",

            border:
              "1px solid rgba(255,255,255,0.16)",
          }}
        >
          {isStarting ? (
            <LoaderCircle
              size={23}
              strokeWidth={1.8}
            />
          ) : (
            <Route
              size={23}
              strokeWidth={1.8}
            />
          )}
        </span>

        <span
          style={{
            minWidth:
              0,
          }}
        >
          <strong
            style={{
              display:
                "block",

              fontSize:
                "14px",

              lineHeight:
                1.15,

              fontWeight:
                900,
            }}
          >
            {isStarting
              ? tx("Buscando GPS…")
              : tx("Comenzar exploración")}
          </strong>

          <span
            style={{
              display:
                "block",

              marginTop:
                "4px",

              color:
                "rgba(255,255,255,0.74)",

              fontSize:
                "10px",

              fontWeight:
                650,
            }}
          >
            {tx("Registrar ruta, recuerdos y llegada")}
          </span>
        </span>
      </button>
    </article>
  );
}

type MetaChipProps = {
  icon: typeof MapPin;
  text: string;
};

function MetaChip({
  icon: Icon,
  text,
}: MetaChipProps) {
  return (
    <span
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        gap:
          "6px",

        minHeight:
          "30px",

        padding:
          "5px 9px",

        borderRadius:
          "999px",

        background:
          "rgba(255,255,255,0.045)",

        border:
          "1px solid rgba(255,255,255,0.07)",

        color:
          Theme.Colors.textSoft,

        fontSize:
          "11px",

        fontWeight:
          700,
      }}
    >
      <Icon
        size={14}
        strokeWidth={1.8}
        color={
          Theme.Colors.primary
        }
      />

      {text}
    </span>
  );
}

export default ExperienceCard;
