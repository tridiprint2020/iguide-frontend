import MemoryCard from "../MemoryCard";
import type { MemoryCardData } from "../../types/memoryCard";

type Props = {
  open: boolean;
  data: MemoryCardData | null;
  onClose: () => void;
  onShare: (data: MemoryCardData) => void;
};

export default function MemoryCardModal({
  open,
  data,
  onClose,
  onShare,
}: Props) {
  if (!open || !data) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Memory Card de ${data.title}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        backgroundColor: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflowY: "auto",
        padding:
          "max(24px, env(safe-area-inset-top)) 14px max(36px, env(safe-area-inset-bottom))",
      }}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "390px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        {/* Barra superior independiente del mapa */}
        <header
          style={{
            width: "100%",
            minHeight: "52px",
            borderRadius: "18px",
            backgroundColor: "#151515",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px 10px 16px",
            boxSizing: "border-box",
            boxShadow: "0 16px 40px rgba(0,0,0,0.32)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 800,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {data.title}
            </p>

            <p
              style={{
                margin: "2px 0 0",
                color: "#A1A1AA",
                fontSize: "11px",
              }}
            >
              Recuerdo de tu Línea de Exploración
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Memory Card"
            style={{
              width: "38px",
              height: "38px",
              flexShrink: 0,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.10)",
              backgroundColor: "#242424",
              color: "#FFFFFF",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <MemoryCard
            data={data}
            onShare={() => onShare(data)}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            minHeight: "50px",
            borderRadius: "15px",
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "#151515",
            color: "#FFFFFF",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Volver al mapa
        </button>
      </section>
    </div>
  );
}