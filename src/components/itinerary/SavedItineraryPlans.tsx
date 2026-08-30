import {
  FolderOpen,
  Trash2,
} from "lucide-react";
import {
  getAppLanguage,
  tx,
} from "../../i18n";
import type {
  SavedItineraryPlan,
} from "../../types/itinerary";

type SavedItineraryPlansProps = {
  plans: SavedItineraryPlan[];
  onOpen: (
    plan: SavedItineraryPlan
  ) => void;
  onDelete: (
    plan: SavedItineraryPlan
  ) => void;
};

function formatPlanDate(
  value: string
): string {
  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12
  ).toLocaleDateString(
    getAppLanguage() === "en"
      ? "en-US"
      : "es-PE",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
    }
  );
}

function formatHour(
  hour: number
): string {
  return new Date(
    2026,
    0,
    1,
    hour,
    0
  ).toLocaleTimeString(
    getAppLanguage() === "en"
      ? "en-US"
      : "es-PE",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

export function SavedItineraryPlans({
  plans,
  onOpen,
  onDelete,
}: SavedItineraryPlansProps) {
  if (plans.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={tx("Mis planes")}
      style={{
        marginBottom: "16px",
        padding: "14px",
        borderRadius: "18px",
        background:
          "rgba(255,255,255,0.035)",
        border:
          "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <strong
        style={{
          display: "block",
          marginBottom: "10px",
          color: "#FFFFFF",
          fontSize: "13px",
        }}
      >
        {tx("Mis planes")}
      </strong>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "7px",
        }}
      >
        {plans.map((plan) => (
          <article
            key={plan.id}
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) auto auto",
              alignItems: "center",
              gap: "7px",
              padding: "9px 10px",
              borderRadius: "12px",
              background:
                "rgba(57,231,255,0.045)",
              border:
                "1px solid rgba(57,231,255,0.1)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <strong
                style={{
                  display: "block",
                  overflow: "hidden",
                  color: "#FFFFFF",
                  fontSize: "11px",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {formatPlanDate(
                  plan.snapshot.selectedDate
                )} · {formatHour(
                  plan.snapshot.selectedHour
                )}
              </strong>
              <span
                style={{
                  display: "block",
                  marginTop: "3px",
                  color:
                    "rgba(255,255,255,0.5)",
                  fontSize: "9px",
                }}
              >
                {tx("{{count}} paradas", {
                  count:
                    plan.snapshot.stops.length,
                })}
              </span>
            </div>

            <button
              type="button"
              aria-label={tx("Abrir plan")}
              title={tx("Abrir plan")}
              onClick={() => onOpen(plan)}
              style={{
                width: "34px",
                height: "34px",
                display: "grid",
                placeItems: "center",
                borderRadius: "10px",
                border:
                  "1px solid rgba(57,231,255,0.2)",
                background:
                  "rgba(57,231,255,0.09)",
                color: "#39E7FF",
                cursor: "pointer",
              }}
            >
              <FolderOpen
                size={15}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              aria-label={tx("Eliminar plan")}
              title={tx("Eliminar plan")}
              onClick={() => onDelete(plan)}
              style={{
                width: "34px",
                height: "34px",
                display: "grid",
                placeItems: "center",
                borderRadius: "10px",
                border:
                  "1px solid rgba(255,101,220,0.18)",
                background:
                  "rgba(255,0,200,0.07)",
                color: "#FF65DC",
                cursor: "pointer",
              }}
            >
              <Trash2
                size={15}
                aria-hidden="true"
              />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
