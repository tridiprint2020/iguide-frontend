import {
  Clock3,
  MapPin,
  Star,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  Experience,
  ExperienceType,
} from "../../types/experience";

import FavoriteButton from "../FavoriteButton";
import { tx } from "../../i18n";
import {
  getMemoryCardDescriptor,
  getListingRatingLabel,
} from "../../engine/experiencePresentation";

type Props = {
  experience: Experience;
  isVisited?: boolean;
  isCurrentMission?: boolean;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onViewDetails?: () => void;
};

const TYPE_LABELS: Record<
  ExperienceType,
  string
> = {
  expedition: "Expedición",
  restaurant: "Restaurante",
  cafe: "Café",
  bar: "Bar",
  nightclub: "Vida nocturna",
  hotel: "Hotel",
  museum: "Museo",
  festival: "Festividad",
  craft: "Artesanía",
  event: "Evento",
};

function ExperienceMapCard({
  experience,
  isVisited = false,
  isCurrentMission = false,
  primaryActionLabel,
  onPrimaryAction,
  onViewDetails,
}: Props) {
  const [imageUnavailable, setImageUnavailable] =
    useState(false);

  const imageSource =
    imageUnavailable
      ? experience.coverImage
      : experience.image ||
        experience.coverImage;

  const isBrandImage =
    imageSource === experience.coverImage ||
    /logo(?:ig|-iguide)/i.test(
      imageSource
    );

  const openingHours =
    "openingHours" in experience
      ? experience.openingHours
      : null;

  return (
    <article
      style={{
        width: "246px",
        boxSizing: "border-box",
        color: "#13131A",
      }}
    >
      <header
        style={{
          display: "grid",
          gridTemplateColumns:
            "62px minmax(0, 1fr) 36px",
          alignItems: "start",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "62px",
            height: "58px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            border:
              "1px solid rgba(0,185,203,0.20)",
            borderRadius: "14px",
            background:
              "linear-gradient(145deg, #FFFFFF, #F3FBFC)",
          }}
        >
          <img
            src={imageSource}
            alt={tx("Imagen de {{title}}", { title: experience.title })}
            loading="lazy"
            onError={() =>
              setImageUnavailable(true)
            }
            style={{
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              objectFit:
                isBrandImage
                  ? "contain"
                  : "cover",
              padding:
                isBrandImage
                  ? "7px"
                  : 0,
            }}
          />
        </div>

        <div
          style={{
            minWidth: 0,
            paddingTop: "1px",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              color: "#009FB1",
              fontSize: "9px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.09em",
            }}
          >
            {tx(TYPE_LABELS[experience.type])}
          </p>

          <h3
            style={{
              margin: 0,
              overflow: "hidden",
              color: "#13131A",
              fontSize: "16px",
              lineHeight: 1.14,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {experience.title}
          </h3>

          <p
            style={{
              margin: "4px 0 0",
              color: "#8A2BE2",
              fontSize: "9px",
              fontWeight: 800,
              letterSpacing: "0.06em",
            }}
          >
            {getMemoryCardDescriptor(
              experience.placeCategory ??
                experience.type,
              experience.listingStatus
            )}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "4px 8px",
              marginTop: "6px",
              color: "#626372",
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <MapPin
                size={11}
                color="#00AFC2"
              />
              {experience.city}
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Star
                size={11}
                color="#FF3DE8"
                fill="#FF3DE8"
              />
              {getListingRatingLabel(
                experience.rating
              )}
            </span>
          </div>
        </div>

        <FavoriteButton
          experienceId={
            experience.experienceId
          }
          compact
          surface="light"
        />
      </header>

      <p
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 3,
          overflow: "hidden",
          margin: "11px 0 9px",
          color: "rgba(19,19,26,0.70)",
          fontSize: "10.5px",
          lineHeight: 1.42,
        }}
      >
        {experience.description}
      </p>

      {(openingHours ||
        experience.estimatedVisitMinutes) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "10px",
          }}
        >
          {openingHours && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 7px",
                border:
                  "1px solid rgba(0,185,203,0.18)",
                borderRadius: "999px",
                background:
                  "rgba(0,230,255,0.08)",
                color: "#007F90",
                fontSize: "9px",
                fontWeight: 800,
              }}
            >
              <Clock3 size={11} />
              {openingHours}
            </span>
          )}

          {experience.estimatedVisitMinutes && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 7px",
                borderRadius: "999px",
                background: "#F4F4F8",
                color: "#676878",
                fontSize: "9px",
                fontWeight: 800,
              }}
            >
              {experience.estimatedVisitMinutes} min
            </span>
          )}

          {isVisited && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 7px",
                borderRadius: "999px",
                background:
                  "rgba(255,61,232,0.09)",
                color: "#C00082",
                fontSize: "9px",
                fontWeight: 850,
              }}
            >
              ✓ {tx("Visitado")}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onPrimaryAction}
        style={{
          width: "100%",
          minHeight: "42px",
          border: "none",
          borderRadius: "12px",
          background:
            isCurrentMission
              ? "linear-gradient(145deg, #00D8EE, #009FB1)"
              : "linear-gradient(145deg, #FF3DE8, #D4008D)",
          color: "#FFFFFF",
          boxShadow:
            isCurrentMission
              ? "0 8px 22px rgba(0,210,230,0.22)"
              : "0 8px 22px rgba(255,0,184,0.25)",
          fontSize: "12px",
          fontWeight: 850,
          cursor: "pointer",
        }}
      >
        {primaryActionLabel}
      </button>

      {onViewDetails && (
        <button
          type="button"
          onClick={onViewDetails}
          style={{
            width: "100%",
            minHeight: "37px",
            marginTop: "7px",
            border:
              "1px solid rgba(0,185,203,0.24)",
            borderRadius: "11px",
            background:
              "rgba(0,230,255,0.06)",
            color: "#007F90",
            fontSize: "11px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {tx("Ver detalles")}
        </button>
      )}
    </article>
  );
}

export default ExperienceMapCard;
