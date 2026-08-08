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
              ? 14
              : 28,
            compact
              ? 14
              : 28,
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

  const isDark =
    variant === "glass";

  const routeSegments =
    waypoints.length > 0
      ? getTimelineRouteSegments(
          waypoints
        )
      : [path];

  const fitPath =
    routeSegments.flat();

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
          isGlass
            ? "rgba(5,7,13,0.24)"
            : "#F4F3F0",
      }}
    >
      <MapContainer
        className={
          isGlass
            ? "iguide-memory-map iguide-memory-map--glass"
            : isDark
              ? "iguide-memory-map iguide-memory-map--dark"
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
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          crossOrigin="anonymous"
          opacity={
            isGlass
              ? 0.72
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
                color:
                  isDark
                    ? "#160216"
                    : "#FFFFFF",

                weight:
                  isGlass
                    ? 7
                    : 9,

                opacity:
                  isDark
                    ? 0.82
                    : 0.92,

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
                    ? 4
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
            isDark
              ? "rgba(4,6,10,0.48)"
              : "rgba(255,255,255,0.74)",
          color:
            isDark
              ? "rgba(255,255,255,0.56)"
              : "rgba(0,0,0,0.55)",
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
            filter: grayscale(0.9) brightness(0.56) contrast(1.22) saturate(0.5);
          }

          .iguide-memory-map--dark .leaflet-tile-pane {
            filter: grayscale(0.72) brightness(0.64) contrast(1.18) saturate(0.62);
          }
        `}
      </style>
    </div>
  );
}

export default MemoryMapCanvas;
