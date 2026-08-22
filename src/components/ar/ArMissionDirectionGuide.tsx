import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  formatArDistance,
} from "../../engine/arGeoEngine";

import {
  tx,
} from "../../i18n";

type ArMissionDirectionGuideProps = {
  direction: "left" | "right";
  distanceMeters: number;
  onSelect: () => void;
};

export function ArMissionDirectionGuide({
  direction,
  distanceMeters,
  onSelect,
}: ArMissionDirectionGuideProps) {
  const pointsLeft = direction === "left";

  return (
    <button
      type="button"
      aria-label={tx(
        pointsLeft
          ? "Gira a la izquierda hacia tu misión"
          : "Gira a la derecha hacia tu misión"
      )}
      onClick={onSelect}
      style={{
        position: "absolute",
        top: "46%",
        ...(pointsLeft
          ? { left: "10px" }
          : { right: "10px" }),
        zIndex: 21,
        width: "72px",
        minHeight: "72px",
        display: "grid",
        placeItems: "center",
        gap: "2px",
        padding: "8px 5px",
        transform: "translateY(-50%)",
        borderRadius: "18px",
        border:
          "1px solid rgba(255,0,255,0.58)",
        background:
          "rgba(15,5,22,0.86)",
        boxShadow:
          "0 0 24px rgba(255,0,255,0.3)",
        color: "#FFFFFF",
        cursor: "pointer",
        backdropFilter: "blur(10px)",
      }}
    >
      {pointsLeft
        ? (
            <ChevronLeft
              size={27}
              color="#FF62F1"
              aria-hidden="true"
            />
          )
        : (
            <ChevronRight
              size={27}
              color="#FF62F1"
              aria-hidden="true"
            />
          )}
      <strong
        style={{
          fontSize: "8px",
          letterSpacing: "0.08em",
        }}
      >
        {tx("Faro de misión")}
      </strong>
      <span
        style={{
          color: "#39E7FF",
          fontSize: "9px",
          fontWeight: 900,
        }}
      >
        {tx(
          "Misión a {{distance}}",
          {
            distance: formatArDistance(
              distanceMeters
            ),
          }
        )}
      </span>
    </button>
  );
}
