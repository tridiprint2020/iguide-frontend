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
        {tx("Guardar")}
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
    </section>
  );
}
