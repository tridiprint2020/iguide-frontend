import {
  CalendarPlus,
  Save,
  Share2,
} from "lucide-react";
import {
  tx,
} from "../../i18n";

type ItineraryPlanActionsProps = {
  busy: boolean;
  saveFeedback: {
    status: "saved" | "error";
    message: string;
  } | null;
  onSave: () => void;
  onShare: () => Promise<void>;
  onAddToCalendar: () => void;
};

const ACTION_STYLE = {
  minHeight: "42px",
  padding: "8px 10px",
  borderRadius: "12px",
  border:
    "1px solid rgba(57,231,255,0.18)",
  background:
    "rgba(57,231,255,0.07)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 800,
} as const;

export function ItineraryPlanActions({
  busy,
  saveFeedback,
  onSave,
  onShare,
  onAddToCalendar,
}: ItineraryPlanActionsProps) {
  return (
    <section
      aria-label={tx(
        "Acciones del itinerario"
      )}
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(3, minmax(0, 1fr))",
        gap: "7px",
        margin: "-8px 0 18px",
      }}
    >
      <button
        type="button"
        disabled={busy}
        onClick={onSave}
        style={{
          ...ACTION_STYLE,
          cursor: busy
            ? "wait"
            : "pointer",
          opacity: busy ? 0.55 : 1,
        }}
      >
        <Save
          size={15}
          aria-hidden="true"
          style={{
            display: "block",
            margin: "0 auto 4px",
          }}
        />
        {saveFeedback?.status === "saved"
          ? tx("Guardado ✓")
          : tx("Guardar")}
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={() => void onShare()}
        style={{
          ...ACTION_STYLE,
          cursor: busy
            ? "wait"
            : "pointer",
          opacity: busy ? 0.55 : 1,
        }}
      >
        <Share2
          size={15}
          aria-hidden="true"
          style={{
            display: "block",
            margin: "0 auto 4px",
          }}
        />
        {tx("Compartir")}
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={onAddToCalendar}
        style={{
          ...ACTION_STYLE,
          cursor: busy
            ? "wait"
            : "pointer",
          opacity: busy ? 0.55 : 1,
        }}
      >
        <CalendarPlus
          size={15}
          aria-hidden="true"
          style={{
            display: "block",
            margin: "0 auto 4px",
          }}
        />
        {tx("Calendario")}
      </button>

      {saveFeedback && (
        <p
          role={
            saveFeedback.status === "error"
              ? "alert"
              : "status"
          }
          aria-live="polite"
          style={{
            gridColumn: "1 / -1",
            margin: "1px 0 0",
            padding: "9px 11px",
            borderRadius: "11px",
            border:
              saveFeedback.status === "saved"
                ? "1px solid rgba(57,231,255,0.2)"
                : "1px solid rgba(255,101,220,0.24)",
            background:
              saveFeedback.status === "saved"
                ? "rgba(57,231,255,0.08)"
                : "rgba(255,0,200,0.08)",
            color:
              saveFeedback.status === "saved"
                ? "#9AF4FF"
                : "#FFB4EB",
            fontSize: "10px",
            fontWeight: 750,
            lineHeight: 1.4,
            textAlign: "center",
          }}
        >
          {saveFeedback.message}
        </p>
      )}
    </section>
  );
}
