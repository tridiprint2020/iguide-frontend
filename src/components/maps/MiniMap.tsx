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

          borderRadius:
            Theme.Radius.medium,

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          backgroundColor:
            theme === "dark"
              ? "#0C0C0F"
              : "#F4F4F5",

          border:
            "1px dashed rgba(255,255,255,0.08)",

          color:
            "#71717A",

          fontSize:
            "10px",
        }}
      >
        Sin recorrido registrado
      </div>
    );
  }

  const hasFinish =
    nodes.some(
      (node) =>
        node.type === "finish"
    );

  const hasAbort =
    nodes.some(
      (node) =>
        node.type === "abort"
    );

  const endColor =
    hasFinish
      ? "#41E28A"
      : hasAbort
        ? "#FF8A00"
        : Theme.Colors.primary;

  const memoryNodes =
    nodes.filter(
      (node) =>
        node.type === "memory"
    );

  return (
    <div
      className="iguide-minimap"
      style={{
        height,

        position:
          "relative",

        overflow:
          "hidden",

        borderRadius:
          "14px",

        border:
          theme === "dark"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.08)",

        backgroundColor:
          theme === "dark"
            ? "#09090B"
            : "#FFFFFF",

        cursor:
          interactive
            ? "grab"
            : "default",
      }}
    >
      {/* Fondo */}
      <div
        aria-hidden="true"
        style={{
          position:
            "absolute",

          inset: 0,

          opacity:
            theme === "dark"
              ? 0.18
              : 0.30,

          backgroundImage:
            theme === "dark"
              ? "radial-gradient(rgba(255,255,255,0.20) 1px, transparent 1px)"
              : "radial-gradient(rgba(0,0,0,0.10) 1px, transparent 1px)",

          backgroundSize:
            "14px 14px",
        }}
      />

      {/* Línea principal */}
      <div
        aria-hidden="true"
        style={{
          position:
            "absolute",

          left:
            "10%",

          right:
            "10%",

          top:
            "50%",

          height:
            "4px",

          borderRadius:
            "999px",

          background:
            `linear-gradient(90deg, ${Theme.Colors.primary}, ${endColor})`,

          transform:
            "translateY(-50%) rotate(-3deg)",

          boxShadow:
            `0 0 13px ${Theme.Colors.primary}55`,
        }}
      />

      {/* Inicio */}
      <div
        aria-hidden="true"
        style={{
          position:
            "absolute",

          left:
            "8%",

          top:
            "50%",

          width:
            "12px",

          height:
            "12px",

          transform:
            "translateY(-50%)",

          borderRadius:
            "50%",

          backgroundColor:
            "#6D163E",

          border:
            "2px solid #FFFFFF",

          zIndex: 3,
        }}
      />

      {/* Recuerdos */}
      {memoryNodes.map(
        (node, index) => {
          const progress =
            (index + 1) /
            (memoryNodes.length + 1);

          const left =
            10 + progress * 78;

          const verticalOffset =
            index % 2 === 0
              ? -7
              : 5;

          return (
            <div
              key={`${node.lat}-${node.lng}-${index}`}
              aria-hidden="true"
              style={{
                position:
                  "absolute",

                left:
                  `${left}%`,

                top:
                  `calc(50% + ${verticalOffset}px)`,

                width:
                  "10px",

                height:
                  "10px",

                transform:
                  "translate(-50%, -50%)",

                borderRadius:
                  "50%",

                backgroundColor:
                  Theme.Colors.primary,

                border:
                  "2px solid #FFFFFF",

                zIndex: 3,

                boxShadow:
                  "0 0 8px rgba(255,0,122,0.55)",
              }}
            />
          );
        }
      )}

      {/* Final, abandono o ruta activa */}
      <div
        aria-hidden="true"
        style={{
          position:
            "absolute",

          right:
            "8%",

          top:
            "50%",

          width:
            "14px",

          height:
            "14px",

          transform:
            "translateY(-50%)",

          borderRadius:
            "50%",

          backgroundColor:
            endColor,

          border:
            "2px solid #FFFFFF",

          zIndex: 3,

          boxShadow:
            `0 0 10px ${endColor}66`,
        }}
      />
    </div>
  );
}