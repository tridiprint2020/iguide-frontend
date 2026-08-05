import {
  useEffect,
} from "react";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

import {
  latLngBounds,
} from "leaflet";

import "leaflet/dist/leaflet.css";

import {
  Theme,
} from "../../styles/theme";

import type {
  TimelineItem,
} from "../../types/tracking/tracking";

type Props = {
  center: [
    number,
    number,
  ];

  path: [
    number,
    number,
  ][];

  memories:
    TimelineItem[];

  waypoints?:
    TimelineItem[];
};

type FitRouteProps = {
  center: [
    number,
    number,
  ];

  path: [
    number,
    number,
  ][];
};

function FitRoute({
  center,
  path,
}: FitRouteProps) {
  const map =
    useMap();

  useEffect(() => {
    /*
     * Con dos o más coordenadas mostramos
     * el recorrido completo, no solo el centro.
     */
    if (path.length >= 2) {
      const bounds =
        latLngBounds(path);

      map.fitBounds(
        bounds,
        {
          padding: [
            28,
            28,
          ],

          maxZoom: 17,

          animate: false,
        }
      );

      return;
    }

    map.setView(
      center,
      16,
      {
        animate: false,
      }
    );
  }, [
    center,
    map,
    path,
  ]);

  return null;
}

function MemoryMapCanvas({
  center,
  path,
  memories,
  waypoints = [],
}: Props) {
  const startNode =
    waypoints.find(
      (item) =>
        item.type === "start"
    );

  const finishNode =
    [...waypoints]
      .reverse()
      .find(
        (item) =>
          item.type === "finish"
      );

  const abortNode =
    [...waypoints]
      .reverse()
      .find(
        (item) =>
          item.type === "abort"
      );

  const fallbackStart =
    path[0];

  const fallbackEnd =
    path[path.length - 1];

  const startPosition:
    [number, number] | null =
    startNode
      ? [
          startNode.lat,
          startNode.lng,
        ]
      : fallbackStart ?? null;

  const endPosition:
    [number, number] | null =
    finishNode
      ? [
          finishNode.lat,
          finishNode.lng,
        ]
      : abortNode
        ? [
            abortNode.lat,
            abortNode.lng,
          ]
        : fallbackEnd ?? null;

  const isAbandoned =
    Boolean(
      abortNode &&
      !finishNode
    );

  return (
    <div
      style={{
        position: "absolute",

        inset: 0,

        width: "100%",

        height: "100%",

        zIndex: 0,

        backgroundColor:
          "#F4F3F0",
      }}
    >
      <MapContainer
        center={center}
        zoom={16}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
        attributionControl
        preferCanvas
        style={{
          height: "100%",

          width: "100%",

          /*
           * Leve aumento de claridad.
           * No oscurecemos las calles.
           */
          filter:
            "brightness(1.08) contrast(1.06) saturate(0.82)",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <FitRoute
          center={center}
          path={path}
        />

        {path.length >= 2 && (
          <>
            {/* Contorno blanco para separar la ruta de las calles */}
            <Polyline
              positions={path}
              pathOptions={{
                color:
                  "#FFFFFF",

                weight: 9,

                opacity: 0.92,

                lineCap:
                  "round",

                lineJoin:
                  "round",
              }}
            />

            {/* Línea oficial I.GUIDE */}
            <Polyline
              positions={path}
              pathOptions={{
                color:
                  Theme.Colors.primary,

                weight: 5,

                opacity: 1,

                lineCap:
                  "round",

                lineJoin:
                  "round",
              }}
            />
          </>
        )}

        {/* INICIO: MAGENTA GRANDE */}
        {startPosition && (
          <CircleMarker
            center={
              startPosition
            }
            radius={10}
            pathOptions={{
              color:
                "#FFFFFF",

              weight: 3,

              fillColor:
                Theme.Colors.primary,

              fillOpacity: 1,
            }}
          />
        )}

        {/* RECUERDOS: MAGENTA PEQUEÑO */}
        {memories.map(
          (
            memory,
            index
          ) => (
            <CircleMarker
              key={
                memory.id ||
                `memory-${index}`
              }
              center={[
                memory.lat,
                memory.lng,
              ]}
              radius={
                memory.photo
                  ? 7
                  : 5
              }
              pathOptions={{
                color:
                  "#FFFFFF",

                weight: 2,

                fillColor:
                  Theme.Colors.primary,

                fillOpacity: 1,
              }}
            />
          )
        )}

        {/* LLEGADA MAGENTA O ABANDONO NARANJA */}
        {endPosition && (
          <CircleMarker
            center={
              endPosition
            }
            radius={12}
            pathOptions={{
              color:
                "#FFFFFF",

              weight: 3,

              fillColor:
                isAbandoned
                  ? "#FF8A00"
                  : Theme.Colors.primary,

              fillOpacity: 1,
            }}
          />
        )}
      </MapContainer>

      {/* Leyenda mínima */}
      <div
        style={{
          position: "absolute",

          left: "10px",

          bottom: "20px",

          zIndex: 500,

          display: "flex",

          alignItems: "center",

          gap: "7px",

          padding:
            "6px 9px",

          borderRadius:
            "10px",

          background:
            "rgba(255,255,255,0.92)",

          border:
            "1px solid rgba(0,0,0,0.08)",

          boxShadow:
            "0 5px 16px rgba(0,0,0,0.12)",

          color:
            "#222222",

          fontSize:
            "9px",

          fontWeight:
            750,

          pointerEvents:
            "none",
        }}
      >
        <span
          style={{
            width: "20px",

            height: "4px",

            borderRadius:
              "999px",

            backgroundColor:
              Theme.Colors.primary,
          }}
        />

        Mi recorrido
      </div>
    </div>
  );
}

export default MemoryMapCanvas;