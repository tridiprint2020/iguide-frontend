import type {
  LucideIcon,
} from "lucide-react";

import {
  Navigation,
  Radar,
} from "lucide-react";

import NeonIcon from "../ui/NeonIcon";

import {
  tx,
} from "../../i18n";

import {
  NeonTheme,
} from "../../styles/neonTheme";

type ActionTone =
  | "magenta"
  | "cyan";

type QuickAction = {
  id: string;

  title: string;

  subtitle: string;

  icon: LucideIcon;

  tone:
    ActionTone;

  image?: string;

  variant?:
    "default"
    | "map";

  onClick:
    () => void;
};

type Props = {
  actions:
    QuickAction[];
};

function QuickActionsGrid({
  actions,
}: Props) {
  return (
    <section
      aria-label={tx("Acciones rápidas")}
      style={{
        width: "100%",

        display: "grid",

        gridTemplateColumns:
          "repeat(2, minmax(0, 1fr))",

        gap: "10px",
      }}
    >
      {actions.map(
        (action, index) => (
          <QuickActionCard
            key={
              action.id
            }
            action={
              action
            }
            fullWidth={
              actions.length % 2 === 1 &&
              index === actions.length - 1
            }
          />
        )
      )}
    </section>
  );
}

type QuickActionCardProps = {
  action:
    QuickAction;
  fullWidth:
    boolean;
};

function QuickActionCard({
  action,
  fullWidth,
}: QuickActionCardProps) {
  const isCyan =
    action.tone ===
    "cyan";

  const toneColor =
    isCyan
      ? NeonTheme
          .Colors
          .cyan
      : NeonTheme
          .Colors
          .magenta;

  const glowColor =
    isCyan
      ? "rgba(0,230,255,0.28)"
      : "rgba(255,61,232,0.28)";

  const isMap =
    action.variant ===
    "map";

  return (
    <button
      type="button"
      onClick={
        action.onClick
      }
      style={{
        position: "relative",

        gridColumn:
          fullWidth
            ? "1 / -1"
            : undefined,

        width: "100%",

        minWidth: 0,

        minHeight: "160px",

        boxSizing:
          "border-box",

        overflow: "hidden",

        display: "flex",

        flexDirection:
          "column",

        alignItems:
          "flex-start",

        justifyContent:
          "space-between",

        padding: "13px",

        borderRadius:
          "20px",

        border:
          `1px solid ${toneColor}44`,

        background:
          `
            radial-gradient(
              circle at 72% 28%,
              ${glowColor},
              transparent 34%
            ),
            linear-gradient(
              145deg,
              #181A31,
              #0A0B16
            )
          `,

        color:
          "#FFFFFF",

        textAlign:
          "left",

        cursor:
          "pointer",

        boxShadow:
          `
            0 13px 30px rgba(0,0,0,0.29),
            0 0 19px ${glowColor}
          `,

        transition:
          "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      {action.image && (
        <>
          <img
            src={action.image}
            alt=""
            aria-hidden="true"
            loading="eager"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />

          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background:
                `linear-gradient(
                  180deg,
                  rgba(6,7,16,0.08) 0%,
                  rgba(6,7,16,0.30) 38%,
                  rgba(6,7,16,0.93) 100%
                )`,
            }}
          />
        </>
      )}

      <div
        style={{
          position: "relative",
          zIndex: 2,
        }}
      >
        <NeonIcon
          icon={
            action.icon
          }
          tone={
            action.tone
          }
          size={23}
          strokeWidth={
            1.5
          }
          framed
        />
      </div>

      {isMap && (
        <MapDecoration />
      )}

      <div
        style={{
          position:
            "relative",

          zIndex: 2,

          width: "100%",
        }}
      >
        <h2
          style={{
            margin:
              "0 0 5px",

            color:
              "#FFFFFF",

            fontSize:
              "clamp(1rem, 4.2vw, 1.25rem)",

            fontWeight:
              850,

            lineHeight:
              1.04,

            letterSpacing:
              "-0.02em",

            textShadow:
              "0 3px 11px rgba(0,0,0,0.94)",
          }}
        >
          {action.title}
        </h2>

        <p
          style={{
            margin: 0,

            color:
              "rgba(255,255,255,0.80)",

            fontSize:
              "10px",

            lineHeight:
              1.35,

            textShadow:
              "0 2px 8px rgba(0,0,0,0.96)",
          }}
        >
          {
            action.subtitle
          }
        </p>
      </div>
    </button>
  );
}

function MapDecoration() {
  return (
    <div
      aria-hidden="true"
      style={{
        position:
          "absolute",

        inset: 0,

        pointerEvents:
          "none",
      }}
    >
      <div
        style={{
          position:
            "absolute",

          right: "18px",

          top: "31px",

          color:
            NeonTheme
              .Colors
              .cyan,

          filter:
            NeonTheme
              .Glow
              .cyan,
        }}
      >
        <Radar
          size={53}
          strokeWidth={
            1.15
          }
        />
      </div>

      <div
        style={{
          position:
            "absolute",

          right: "35px",

          top: "48px",

          color:
            NeonTheme
              .Colors
              .magenta,

          filter:
            NeonTheme
              .Glow
              .magenta,
        }}
      >
        <Navigation
          size={19}
          strokeWidth={
            1.6
          }
          fill="rgba(255,61,232,0.18)"
        />
      </div>
    </div>
  );
}

export default QuickActionsGrid;
