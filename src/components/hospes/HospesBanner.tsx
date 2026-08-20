import {
  ArrowRight,
  TrendingUp,
} from "lucide-react";

import type {
  HospesMessage,
} from "../../types/hospes";

import NoriCompass from "../nori/NoriCompass";
import type {
  NoriMotionState,
} from "../nori/NoriCompass";

import {
  tx,
} from "../../i18n";

type ProgressData = {
  level: number;
  xp: number;
  xpToNextLevel: number;
  progressPercent: number;
  visitedCount: number;
  totalCount: number;
};

type Props = {
  message: HospesMessage;

  onAction?: () => void;

  progress?: ProgressData;

  onProgressClick?: () => void;

  noriState?: NoriMotionState;
};

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

export default function HospesBanner({
  message,
  onAction,
  progress,
  onProgressClick,
  noriState = "idle",
}: Props) {
  const canShowAction =
    Boolean(message.action) &&
    Boolean(onAction);

  const progressValue =
    progress
      ? clamp(
          progress.progressPercent,
          0,
          100
        )
      : 0;

  return (
    <section
      style={{
        position: "relative",

        width: "100%",
        maxWidth: "100%",

        boxSizing: "border-box",
        overflow: "hidden",

        padding: "16px",

        borderRadius: "22px",

        border:
          "1px solid rgba(255,61,232,0.22)",

        background: `
          radial-gradient(
            circle at 10% 12%,
            rgba(255,61,232,0.17),
            transparent 32%
          ),
          radial-gradient(
            circle at 92% 88%,
            rgba(0,230,255,0.09),
            transparent 35%
          ),
          linear-gradient(
            145deg,
            rgba(24,25,47,0.98),
            rgba(9,10,21,0.99)
          )
        `,

        boxShadow: `
          0 18px 42px rgba(0,0,0,0.34),
          0 0 26px rgba(255,61,232,0.08)
        `,
      }}
    >
      {/* Brillo superior decorativo */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",

          top: "-42px",
          left: "26px",

          width: "120px",
          height: "84px",

          borderRadius: "50%",

          background:
            "rgba(255,61,232,0.15)",

          filter: "blur(34px)",

          pointerEvents: "none",
        }}
      />

      {/* MENSAJE PRINCIPAL */}
      <div
        style={{
          position: "relative",
          zIndex: 2,

          display: "grid",

          gridTemplateColumns:
            "54px minmax(0, 1fr)",

          gap: "13px",

          alignItems: "start",
        }}
      >
        <div
          style={{
            position: "relative",

            width: "54px",
            height: "54px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <NoriCompass
            state={noriState}
            size={54}
            label={tx("Hospes · brújula de I.GUIDE")}
          />
        </div>

        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              marginBottom: "7px",

              color: "#FF3DE8",

              fontSize: "13px",
              fontWeight: 850,
              lineHeight: 1.25,

              letterSpacing: "0.025em",

              overflowWrap: "anywhere",

              textShadow:
                "0 0 12px rgba(255,61,232,0.32)",
            }}
          >
            {message.title}
          </div>

          <div
            style={{
              color:
                "rgba(255,255,255,0.88)",

              fontSize: "12px",
              lineHeight: 1.5,

              overflowWrap: "anywhere",
            }}
          >
            {message.message}
          </div>

          {canShowAction &&
            message.action && (
              <button
                type="button"
                onClick={onAction}
                style={{
                  width: "100%",
                  minHeight: "44px",

                  marginTop: "14px",
                  padding: "10px 13px",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  gap: "7px",

                  border:
                    "1px solid rgba(255,255,255,0.12)",

                  borderRadius: "13px",

                  background:
                    "linear-gradient(145deg, #FF3DE8, #D4008D)",

                  color: "#FFFFFF",

                  boxShadow:
                    "0 9px 24px rgba(255,61,232,0.27)",

                  fontSize: "12px",
                  fontWeight: 850,

                  cursor: "pointer",
                }}
              >
                {message.action.label}

                <ArrowRight
                  size={16}
                  strokeWidth={2.2}
                />
              </button>
            )}
        </div>
      </div>

      {/* PROGRESO COMPACTO */}
      {progress && (
        <button
          type="button"
          onClick={onProgressClick}
          disabled={!onProgressClick}
          aria-label={tx("Abrir mi progreso")}
          style={{
            position: "relative",
            zIndex: 2,

            width: "100%",

            marginTop: "15px",
            padding: "11px 12px",

            display: "block",

            borderRadius: "15px",

            border:
              "1px solid rgba(0,230,255,0.14)",

            background:
              "rgba(255,255,255,0.035)",

            color: "#FFFFFF",

            textAlign: "left",

            cursor:
              onProgressClick
                ? "pointer"
                : "default",

            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems: "center",
              justifyContent:
                "space-between",

              gap: "10px",

              marginBottom: "8px",
            }}
          >
            <div
              style={{
                display: "flex",

                alignItems: "center",

                gap: "7px",
              }}
            >
              <TrendingUp
                size={15}
                strokeWidth={2.1}
                color="#00E6FF"
                style={{
                  filter:
                    "drop-shadow(0 0 6px rgba(0,230,255,0.66))",
                }}
              />

              <span
                style={{
                  color:
                    "rgba(255,255,255,0.76)",

                  fontSize: "10px",
                  fontWeight: 750,

                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {tx("Progreso local")}
              </span>
            </div>

            <strong
              style={{
                color: "#00E6FF",

                fontSize: "11px",

                textShadow:
                  "0 0 8px rgba(0,230,255,0.38)",
              }}
            >
              {tx("Nivel {{level}}", {
                level: progress.level,
              })}
            </strong>
          </div>

          <div
            style={{
              width: "100%",
              height: "6px",

              overflow: "hidden",

              borderRadius: "999px",

              background:
                "rgba(255,255,255,0.09)",
            }}
          >
            <div
              style={{
                width:
                  `${progressValue}%`,

                height: "100%",

                borderRadius: "999px",

                background:
                  "linear-gradient(90deg, #00E6FF, #3B82F6)",

                boxShadow:
                  "0 0 10px rgba(0,230,255,0.48)",

                transition:
                  "width 0.35s ease",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              gap: "10px",

              marginTop: "7px",

              color:
                "rgba(255,255,255,0.52)",

              fontSize: "9px",
            }}
          >
            <span>
              {tx("{{visited}}/{{total}} descubrimientos", {
                visited: progress.visitedCount,
                total: progress.totalCount,
              })}
            </span>

            <span>
              {tx("{{xp}} XP · {{remaining}} para subir", {
                xp: progress.xp,
                remaining: progress.xpToNextLevel,
              })}
            </span>
          </div>
        </button>
      )}
    </section>
  );
}
