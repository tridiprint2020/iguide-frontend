import type { HospesMessage } from "../../types/hospes";

type Props = {
  message: HospesMessage;
  onAction?: () => void;
};

export default function HospesBanner({
  message,
  onAction,
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
        padding: "16px",

        display: "grid",
        gridTemplateColumns: "46px minmax(0, 1fr)",
        gap: "13px",
        alignItems: "start",

        marginBottom: "20px",
        boxShadow:
          "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "50%",
          backgroundColor:
            "rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "27px",
        }}
      >
        {message.icon}
      </div>

      <div
        style={{
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        <div
          style={{
            color: message.color,
            fontWeight: 800,
            marginBottom: "6px",
            fontSize: "14px",
            lineHeight: 1.25,
            overflowWrap: "anywhere",
          }}
        >
          {message.title}
        </div>

        <div
          style={{
            color: "#E8E8E8",
            lineHeight: 1.5,
            fontSize: "13px",
            overflowWrap: "anywhere",
            wordBreak: "normal",
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
                minHeight: "42px",
                marginTop: "13px",
                padding: "9px 12px",

                border: "none",
                borderRadius: "12px",
                backgroundColor:
                  message.color,
                color: "#FFFFFF",

                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",

                whiteSpace: "normal",
                overflowWrap: "anywhere",
              }}
            >
              {message.action.label} →
            </button>
          )}
      </div>
    </section>
  );
}