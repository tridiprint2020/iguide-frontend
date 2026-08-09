import {
  Fragment,
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
import {
  getTimelineRouteSegments,
} from "../../engine/trackingEngine";
import { tx } from "../../i18n";

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

  variant?:
    | "default"
    | "glass"
    | "full";
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

  compact?: boolean;
};

function FitRoute({
  center,
  path,
  compact = false,
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
            compact
              ? 8
              : 28,
            compact
              ? 8
              : 28,
          ],

          maxZoom: compact ? 18 : 17,

          animate: false,
        }
      );

      return;
    }

    map.setView(
      center,
      compact ? 18 : 16,
      {
        animate: false,
      }
    );
  }, [
    center,
    compact,
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
  variant = "default",
}: Props) {
  const isGlass =
    variant === "glass";

  const rawRouteSegments =
    waypoints.length > 0
      ? getTimelineRouteSegments(
          waypoints
        )
      : [path];

  /*
   * Una MemoryCard intermedia termina visualmente en su recuerdo
   * celeste, sin inventar una llegada magenta. En el recorrido
   * completo la línea continúa normalmente por ambos lados.
   */
  const lastWaypoint =
    waypoints[waypoints.length - 1];

  const routeSegments =
    lastWaypoint?.type === "memory" &&
    rawRouteSegments.length > 0
      ? rawRouteSegments.map((segment, index) =>
          index === rawRouteSegments.length - 1
            ? [
                ...segment,
                [lastWaypoint.lat, lastWaypoint.lng] as [number, number],
              ]
            : segment
        )
      : rawRouteSegments;

  const fitPath = [
    ...routeSegments.flat(),
    ...memories.map(
      (memory) =>
        [memory.lat, memory.lng] as [number, number]
    ),
  ];

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
        : null;

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
          isGlass
            ? "rgba(255,255,255,0.05)"
            : "#F4F3F0",
      }}
    >
      <MapContainer
        className={
          isGlass
            ? "iguide-memory-map iguide-memory-map--glass"
            : "iguide-memory-map"
        }
        center={center}
        zoom={16}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        touchZoom={false}
        attributionControl={false}
        preferCanvas
        style={{
          height: "100%",

          width: "100%",

          background:
            "transparent",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          maxZoom={20}
          crossOrigin="anonymous"
          opacity={
            isGlass
              ? 0.40
              : variant === "full"
                ? 0.96
                : 1
          }
        />

        <FitRoute
          center={center}
          path={fitPath}
          compact={isGlass}
        />

        {routeSegments.map(
          (segment, index) =>
            segment.length >= 2
              ? (
            <Fragment key={`route-segment-${index}`}>
            {/* Contorno blanco para separar la ruta de las calles */}
            <Polyline
              positions={segment}
              pathOptions={{
                color: "#FFFFFF",

                weight:
                  isGlass
                    ? 4.5
                    : 9,

                opacity: 0.92,

                lineCap:
                  "round",

                lineJoin:
                  "round",
              }}
            />

            {/* Línea oficial I.GUIDE */}
            <Polyline
              positions={segment}
              pathOptions={{
                color:
                  Theme.Colors.primary,

                weight:
                  isGlass
                    ? 2.5
                    : 5,

                opacity: 1,

                lineCap:
                  "round",

                lineJoin:
                  "round",
              }}
            />
            </Fragment>
              )
              : null
        )}

        {/* INICIO: MAGENTA GRANDE */}
        {startPosition && (
          <CircleMarker
            center={
              startPosition
            }
            radius={
              isGlass
                ? 6
                : 10
            }
            pathOptions={{
              color:
                "#FFFFFF",

              weight:
                isGlass
                  ? 2
                  : 3,

              fillColor:
                Theme.Colors.primary,

              fillOpacity: 1,
            }}
          />
        )}

        {/* RECUERDOS: CELESTE PEQUEÑO */}
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
                  ? isGlass
                    ? 4
                    : 7
                  : isGlass
                    ? 3
                    : 5
              }
              pathOptions={{
                color:
                  "#FFFFFF",

                weight: 2,

                fillColor: "#42E8F5",

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
            radius={
              isGlass
                ? 7
                : 12
            }
            pathOptions={{
              color:
                "#FFFFFF",

              weight:
                isGlass
                  ? 2
                  : 3,

              fillColor:
                isAbandoned
                  ? "#FF8A00"
                  : Theme.Colors.primary,

              fillOpacity: 1,
            }}
          />
        )}
      </MapContainer>

      {/* Leyenda: solo se usa cuando el mapa es el visual principal. */}
      {variant === "default" && (
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

        {tx("Mi recorrido")}
        </div>
      )}

      <span
        style={{
          position: "absolute",
          right: "4px",
          top: "3px",
          zIndex: 500,
          padding: "2px 4px",
          borderRadius: "5px",
          background:
            "rgba(255,255,255,0.58)",
          color:
            "rgba(0,0,0,0.55)",
          fontSize: "5px",
          lineHeight: 1.2,
          fontWeight: 650,
          pointerEvents: "none",
        }}
      >
        © OpenStreetMap
      </span>

      <style>
        {`
          .iguide-memory-map.leaflet-container {
            background: transparent;
          }

          .iguide-memory-map--glass .leaflet-tile-pane {
            filter: grayscale(0.18) contrast(1.04) saturate(0.82);
          }
        `}
      </style>
    </div>
  );
}

export default MemoryMapCanvas;
