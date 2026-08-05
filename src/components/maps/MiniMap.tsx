import {
  Theme,
} from "../../styles/theme";

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
  nodes:
    MapNode[];

  height?:
    string | number;

  interactive?:
    boolean;

  theme?:
    | "light"
    | "dark"
    | "minimal";
}

export function MiniMap({
  nodes,
  height = "72px",
  interactive = false,
  theme = "dark",
}: MiniMapProps) {
  if (
    !nodes ||
    nodes.length === 0
  ) {
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
            theme === "dark"
              ? "1px solid rgba(255,255,255,0.07)"
              : "1px solid rgba(0,0,0,0.08)",

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

  const isAbandoned =
    hasAbort &&
    !hasFinish;

  const memoryNodes =
    nodes.filter(
      (node) =>
        node.type === "memory"
    );

  return (
    <div
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
            ? "1px solid rgba(255,255,255,0.07)"
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
      {/* Línea siempre magenta */}
      <div
        aria-hidden="true"
        style={{
          position:
            "absolute",

          left: "11%",

          right: "11%",

          top: "50%",

          height: "4px",

          transform:
            "translateY(-50%)",

          borderRadius:
            "999px",

          backgroundColor:
            Theme.Colors.primary,

          boxShadow:
            "0 0 10px rgba(255,0,122,0.32)",
        }}
      />

      {/* Inicio grande magenta */}
      <div
        aria-hidden="true"
        style={{
          position:
            "absolute",

          left: "8%",

          top: "50%",

          width: "15px",

          height: "15px",

          transform:
            "translateY(-50%)",

          borderRadius:
            "50%",

          backgroundColor:
            Theme.Colors.primary,

          border:
            "3px solid #FFFFFF",

          boxSizing:
            "border-box",

          zIndex: 3,
        }}
      />

      {/* Recuerdos pequeños magenta */}
      {memoryNodes.map(
        (
          node,
          index
        ) => {
          const progress =
            (index + 1) /
            (memoryNodes.length + 1);

          const left =
            12 +
            progress * 74;

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
                  "50%",

                width:
                  "8px",

                height:
                  "8px",

                transform:
                  "translate(-50%, -50%)",

                borderRadius:
                  "50%",

                backgroundColor:
                  Theme.Colors.primary,

                border:
                  "2px solid #FFFFFF",

                boxSizing:
                  "border-box",

                zIndex: 3,
              }}
            />
          );
        }
      )}

      {/* Llegada magenta; abandono naranja */}
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
            "17px",

          height:
            "17px",

          transform:
            "translateY(-50%)",

          borderRadius:
            "50%",

          backgroundColor:
            isAbandoned
              ? "#FF8A00"
              : Theme.Colors.primary,

          border:
            "3px solid #FFFFFF",

          boxSizing:
            "border-box",

          zIndex: 3,

          boxShadow:
            isAbandoned
              ? "0 0 9px rgba(255,138,0,0.30)"
              : "0 0 9px rgba(255,0,122,0.30)",
        }}
      />
    </div>
  );
}