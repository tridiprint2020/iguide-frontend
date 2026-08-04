import { Theme } from "../../styles/theme";

type MapNode = {
  lat: number;
  lng: number;
  type:
    | "start"
    | "walk"
    | "memory"
    | "abort"
    | "finish";
};

interface MiniMapProps {
  nodes: MapNode[];
  height?: string | number;
  interactive?: boolean;
  theme?: "light" | "dark" | "minimal";
}

export function MiniMap({
  nodes,
  height = "160px",
  interactive = false,
  theme = "dark",
}: MiniMapProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div
        style={{
          height,
          backgroundColor:
            theme === "dark"
              ? "#0C0C0F"
              : "#F4F4F5",
          borderRadius: Theme.Radius.medium,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border:
            theme === "dark"
              ? "1px dashed rgba(255,255,255,0.08)"
              : "1px dashed rgba(0,0,0,0.12)",
          color:
            theme === "dark"
              ? "#71717A"
              : "#71717A",
          fontSize: "11px",
          fontFamily: "monospace",
        }}
      >
        📍 Sin registros de geolocalización
      </div>
    );
  }

  const finishNode = [...nodes]
    .reverse()
    .find(
      (node) => node.type === "finish"
    );

  const abortNode = [...nodes]
    .reverse()
    .find(
      (node) => node.type === "abort"
    );

  const memoryCount = nodes.filter(
    (node) => node.type === "memory"
  ).length;

  const isCompleted = Boolean(finishNode);

  const isAbandoned = Boolean(
    abortNode && !finishNode
  );

  const statusColor = isCompleted
    ? "#41E28A"
    : isAbandoned
      ? "#FF8A00"
      : Theme.Colors.primary;

  const statusLabel = isCompleted
    ? "🏁 COMPLETADO"
    : isAbandoned
      ? "🟠 CONSERVADO"
      : "🧭 EN CURSO";

  return (
    <div
      className="iguide-minimap"
      style={{
        height,
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        border:
          theme === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.08)",
        backgroundColor:
          theme === "dark"
            ? "#09090B"
            : "#FFFFFF",
        cursor: interactive
          ? "grab"
          : "default",
      }}
    >
      {/* Fondo discreto */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity:
            theme === "dark"
              ? 0.22
              : 0.38,
          backgroundImage:
            theme === "dark"
              ? "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)"
              : "radial-gradient(rgba(0,0,0,0.10) 1px, transparent 1px)",
          backgroundSize: "15px 15px",
        }}
      />

      {/* Ruta visual resumida */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "13%",
          right: "13%",
          top: "52%",
          height: "4px",
          borderRadius: "999px",
          backgroundColor:
            statusColor,
          opacity: 0.88,
          transform:
            "rotate(-4deg)",
          boxShadow: `0 0 12px ${statusColor}55`,
        }}
      />

      {/* Punto inicial */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "10%",
          top: "46%",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor:
            Theme.Colors.primary,
          border: "2px solid #FFFFFF",
          zIndex: 2,
          boxShadow:
            "0 0 10px rgba(255,0,122,0.35)",
        }}
      />

      {/* Punto final o abandono */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "10%",
          top: "41%",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          backgroundColor:
            statusColor,
          border: "2px solid #FFFFFF",
          zIndex: 2,
          boxShadow: `0 0 10px ${statusColor}55`,
        }}
      />

      {/* Estado superior único */}
      <div
        style={{
          position: "absolute",
          top: "9px",
          right: "9px",
          zIndex: 3,
          padding: "4px 8px",
          borderRadius: "999px",
          backgroundColor:
            "rgba(9,9,11,0.88)",
          border: `1px solid ${statusColor}55`,
          color: statusColor,
          fontSize: "9px",
          fontWeight: 800,
          fontFamily: "monospace",
          letterSpacing: "0.03em",
        }}
      >
        {statusLabel}
      </div>

      {/* Inicio superior izquierdo */}
      <div
        style={{
          position: "absolute",
          top: "9px",
          left: "9px",
          zIndex: 3,
          padding: "4px 8px",
          borderRadius: "999px",
          backgroundColor:
            "rgba(9,9,11,0.88)",
          border:
            "1px solid rgba(255,0,122,0.30)",
          color:
            Theme.Colors.primary,
          fontSize: "9px",
          fontWeight: 800,
          fontFamily: "monospace",
        }}
      >
        🚀 INICIO
      </div>

      {/* Resumen inferior */}
      <div
        style={{
          position: "absolute",
          bottom: "9px",
          left: "9px",
          right: "9px",
          zIndex: 3,
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "8px",
          padding: "5px 8px",
          borderRadius: "9px",
          backgroundColor:
            "rgba(9,9,11,0.88)",
          border:
            "1px solid rgba(255,255,255,0.06)",
          color: "#D4D4D8",
          fontSize: "9px",
          fontFamily: "monospace",
        }}
      >
        <span>🧭 Ruta registrada</span>

        <span>
          🔮 {memoryCount}{" "}
          {memoryCount === 1
            ? "recuerdo"
            : "recuerdos"}
        </span>
      </div>
    </div>
  );
}