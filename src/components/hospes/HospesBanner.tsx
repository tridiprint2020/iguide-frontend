import type {
  HospesMessage,
} from "../../types/hospes";

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
};

function ProgressTimeline({
  level,
  xp,
  xpToNextLevel,
  progressPercent,
  visitedCount,
  totalCount,
  onClick,
}: ProgressData & {
  onClick?: () => void;
}) {
  const normalizedProgress =
    Math.max(
      0,
      Math.min(
        100,
        progressPercent
      )
    );

  const activeDotCount =
    Math.min(
      4,
      Math.max(
        0,
        Math.ceil(
          normalizedProgress / 25
        )
      )
    );

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: "100%",

        padding: "11px 9px",

        border:
          "1px solid rgba(255,0,255,0.24)",

        borderRadius: "14px",

        background:
          "linear-gradient(180deg, rgba(255,0,255,0.10), rgba(255,255,255,0.025))",

        color: "#FFFFFF",

        cursor: onClick
          ? "pointer"
          : "default",

        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          gap: "6px",
        }}
      >
        <span
          style={{
            color:
              "rgba(255,255,255,0.56)",

            fontSize: "8px",

            fontWeight: 800,

            letterSpacing: "0.08em",

            textTransform:
              "uppercase",
          }}
        >
          Nivel
        </span>

        <strong
          style={{
            color: "#FF00FF",

            fontSize: "17px",
          }}
        >
          {level}
        </strong>
      </div>

      <div
        style={{
          marginTop: "8px",

          fontSize: "9px",

          color:
            "rgba(255,255,255,0.72)",
        }}
      >
        {xp} XP
      </div>

      <div
        style={{
          width: "100%",
          height: "4px",

          marginTop: "5px",

          overflow: "hidden",

          borderRadius: "999px",

          background:
            "rgba(255,255,255,0.09)",
        }}
      >
        <div
          style={{
            width:
              `${normalizedProgress}%`,

            height: "100%",

            borderRadius: "999px",

            backgroundColor:
              "#FF00FF",
          }}
        />
      </div>

      <div
        style={{
          marginTop: "4px",

          fontSize: "8px",

          color:
            "rgba(255,255,255,0.44)",
        }}
      >
        {xpToNextLevel} XP restantes
      </div>

      <div
        style={{
          display: "flex",

          alignItems: "center",

          marginTop: "10px",
        }}
      >
        {[0, 1, 2, 3].map(
          (dotIndex) => {
            const isActive =
              dotIndex <
              activeDotCount;

            return (
              <div
                key={dotIndex}
                style={{
                  display: "flex",

                  flex: dotIndex < 3
                    ? 1
                    : "initial",

                  alignItems:
                    "center",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",

                    flexShrink: 0,

                    borderRadius:
                      "50%",

                    backgroundColor:
                      isActive
                        ? "#FF00FF"
                        : "#4A4A4A",

                    boxShadow:
                      isActive
                        ? "0 0 8px rgba(255,0,255,0.65)"
                        : "none",
                  }}
                />

                {dotIndex < 3 && (
                  <span
                    style={{
                      width:
                        "100%",

                      height:
                        "1px",

                      backgroundColor:
                        dotIndex <
                        activeDotCount - 1
                          ? "#FF00FF"
                          : "#454545",
                    }}
                  />
                )}
              </div>
            );
          }
        )}
      </div>

      <div
        style={{
          marginTop: "8px",

          display: "flex",

          justifyContent:
            "space-between",

          gap: "4px",

          fontSize: "8px",

          color:
            "rgba(255,255,255,0.58)",
        }}
      >
        <span>
          {visitedCount}/{totalCount}
        </span>

        <span>
          {normalizedProgress}%
        </span>
      </div>
    </button>
  );
}

export default function HospesBanner({
  message,
  onAction,
  progress,
  onProgressClick,
}: Props) {
  const canShowAction =
    Boolean(message.action) &&
    Boolean(onAction);

  return (
    <section
      style={{
        width: "100%",
        maxWidth: "100%",

        boxSizing: "border-box",

        overflow: "hidden",

        background: "#111111",

        border:
          "1px solid rgba(255,255,255,0.08)",

        borderRadius: "20px",

        padding: "14px",

        display: "grid",

        gridTemplateColumns:
          progress
            ? "minmax(0, 1fr) 88px"
            : "minmax(0, 1fr)",

        gap: "10px",

        alignItems: "stretch",

        boxShadow:
          "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          minWidth: 0,

          display: "grid",

          gridTemplateColumns:
            "42px minmax(0, 1fr)",

          gap: "11px",

          alignItems: "start",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: "42px",
            height: "42px",

            borderRadius: "50%",

            backgroundColor:
              "rgba(255,255,255,0.05)",

            display: "flex",

            alignItems: "center",

            justifyContent:
              "center",

            fontSize: "24px",
          }}
        >
          {message.icon}
        </div>

        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: message.color,

              fontWeight: 800,

              marginBottom: "5px",

              fontSize: "12px",

              lineHeight: 1.2,

              overflowWrap:
                "anywhere",
            }}
          >
            {message.title}
          </div>

          <div
            style={{
              color: "#E8E8E8",

              lineHeight: 1.42,

              fontSize: "11px",

              overflowWrap:
                "anywhere",
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

                  minHeight: "36px",

                  marginTop: "10px",

                  padding:
                    "7px 10px",

                  border: "none",

                  borderRadius:
                    "10px",

                  backgroundColor:
                    message.color,

                  color: "#FFFFFF",

                  fontSize: "10px",

                  fontWeight: 800,

                  cursor: "pointer",

                  whiteSpace:
                    "normal",

                  overflowWrap:
                    "anywhere",
                }}
              >
                {
                  message.action
                    .label
                }{" "}
                →
              </button>
            )}
        </div>
      </div>

      {progress && (
        <ProgressTimeline
          {...progress}
          onClick={
            onProgressClick
          }
        />
      )}
    </section>
  );
}