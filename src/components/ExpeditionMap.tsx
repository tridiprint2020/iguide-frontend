import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";

import {
  Camera,
} from "lucide-react";

import "leaflet/dist/leaflet.css";

import type {
  Experience,
} from "../types/experience";

import {
  Theme,
} from "../styles/theme";

import type {
  ExpeditionTrack,
  TimelineItem,
} from "../types/tracking/tracking";

import {
  getGeoLabel,
} from "../engine/geoLabelEngine";

import {
  currentCity,
} from "../data/currentCity";

import type {
  MemoryCardData,
} from "../types/memoryCard";

import {
  getJourneyStats,
} from "../engine/trackingEngine";

import {
  useJourney,
} from "../context/JourneyContext";

import UserLocationLayer from "./maps/UserLocationLayer";

type Props = {
  expedition: Experience;
  track: ExpeditionTrack | null;
  onSelectShare: (
    memoryData: MemoryCardData
  ) => void;
  onCaptureMemory?: () => void;
};

const MAGENTA = "#FF00FF";

function ExpeditionMap({
  expedition,
  track: propTrack,
  onSelectShare,
  onCaptureMemory,
}: Props) {
  const center: [number, number] = [
    expedition.latitude,
    expedition.longitude,
  ];

  const {
    journey,
  } = useJourney();

  const activeTimeline: TimelineItem[] =
    propTrack
      ? propTrack.timeline ?? []
      : journey.timeline ?? [];

  const activeStartedAt =
    propTrack
      ? propTrack.startedAt
      : journey.startedAt;

  const path: [number, number][] =
    activeTimeline
      .filter(
        (point) =>
          point.type === "start" ||
          point.type === "walk" ||
          point.type === "finish"
      )
      .map(
        (point) => [
          point.lat,
          point.lng,
        ] as [number, number]
      );

  const stats =
    activeTimeline.length > 0
      ? getJourneyStats(
          activeTimeline,
          activeStartedAt ?? Date.now()
        )
      : {
          totalPhotos: 0,
          totalNotes: 0,
          totalMemories: 0,
          totalDistanceKm: 0,
          durationSeconds: 0,
        };

  const {
    durationSeconds,
    totalDistanceKm,
    totalMemories,
    totalPhotos,
    totalNotes,
  } = stats;

  return (
    <div
      style={{
        position: "relative",
        marginTop: Theme.Space.md,
        height: "380px",
        width: "100%",
        borderRadius: "18px",
        overflow: "hidden",
        border:
          "1px solid rgba(255,0,255,0.22)",
        boxShadow:
          "0 16px 38px rgba(0,0,0,0.34), 0 0 28px rgba(255,0,255,0.08)",
      }}
    >
      {onCaptureMemory && (
        <button
          type="button"
          onClick={onCaptureMemory}
          aria-label="Tomar una fotografía y guardarla en el timeline"
          title="Guardar recuerdo"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 1100,
            width: "58px",
            height: "58px",
            display: "grid",
            placeItems: "center",
            borderRadius: "19px",
            border:
              "2px solid rgba(255,255,255,0.94)",
            background:
              "linear-gradient(145deg, #FF3DE8, #D4008D)",
            color: "#FFFFFF",
            boxShadow:
              "0 10px 28px rgba(255,0,184,0.42)",
            cursor: "pointer",
          }}
        >
          <Camera
            size={28}
            strokeWidth={2.1}
          />
        </button>
      )}

      <MapContainer
        center={center}
        zoom={18}
        preferCanvas
        zoomControl
        scrollWheelZoom
        doubleClickZoom
        touchZoom
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <UserLocationLayer
          initialZoom={18}
          radiusMeters={200}
        />

        <CircleMarker
          center={center}
          radius={15}
          pathOptions={{
            color: MAGENTA,
            weight: 4,
            fillColor: MAGENTA,
            fillOpacity: 0.20,
          }}
        >
          <Popup>
            <div
              style={{
                minWidth: "180px",
                textAlign: "center",
                color: "#161616",
              }}
            >
              <strong>
                Destino · {expedition.title}
              </strong>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "11px",
                  color: "#666666",
                }}
              >
                Sigue el recorrido hasta este punto.
              </p>
            </div>
          </Popup>
        </CircleMarker>

        {activeTimeline.map(
          (point, index) => {
            if (point.type === "walk") {
              return (
                <CircleMarker
                  key={`walk-node-${point.id ?? index}`}
                  center={[
                    point.lat,
                    point.lng,
                  ]}
                  radius={3.5}
                  pathOptions={{
                    color: MAGENTA,
                    fillColor: MAGENTA,
                    fillOpacity: 1,
                    weight: 1,
                  }}
                />
              );
            }

            if (point.type === "memory") {
              return (
                <CircleMarker
                  key={`memory-node-${point.id ?? index}`}
                  center={[
                    point.lat,
                    point.lng,
                  ]}
                  radius={11}
                  pathOptions={{
                    color: MAGENTA,
                    weight: 4,
                    fillColor: "#0A0A0A",
                    fillOpacity: 0.88,
                  }}
                >
                  <Popup className="clean-popup">
                    <div
                      style={{
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#161616",
                        }}
                      >
                        Recuerdo registrado
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          const computedData:
                            MemoryCardData = {
                            photo: point.photo,
                            placeLabel:
                              getGeoLabel(
                                point.lat,
                                point.lng
                              ).text,
                            city: currentCity,
                            date: new Date(
                              point.timestamp
                            ).toLocaleDateString(
                              "es-PE"
                            ),
                            note:
                              point.note ?? "",
                            title:
                              expedition.title,
                            stats: {
                              durationSeconds,
                              totalDistanceKm,
                              totalMemories,
                              totalPhotos,
                              totalNotes,
                            },
                            center: [
                              point.lat,
                              point.lng,
                            ],
                            path,
                          };

                          onSelectShare(
                            computedData
                          );
                        }}
                        style={{
                          minHeight: "36px",
                          padding: "7px 12px",
                          border: "none",
                          borderRadius: "9px",
                          backgroundColor:
                            MAGENTA,
                          color: "#FFFFFF",
                          fontSize: "11px",
                          fontWeight: 750,
                          cursor: "pointer",
                        }}
                      >
                        Ver MemoryCard
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            }

            const isStart =
              point.type === "start";

            const isFinish =
              point.type === "finish";

            if (!isStart && !isFinish) {
              return null;
            }

            return (
              <CircleMarker
                key={`edge-node-${point.id ?? index}`}
                center={[
                  point.lat,
                  point.lng,
                ]}
                radius={
                  isFinish ? 15 : 9
                }
                pathOptions={{
                  color: "#FFFFFF",
                  fillColor: MAGENTA,
                  fillOpacity: 1,
                  weight:
                    isFinish ? 4 : 2,
                }}
              >
                <Popup>
                  <div
                    style={{
                      width: 190,
                      textAlign: "center",
                    }}
                  >
                    <h4
                      style={{
                        margin: "4px 0 10px",
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "#161616",
                      }}
                    >
                      {isStart
                        ? "Inicio de misión"
                        : "Llegada certificada"}
                    </h4>

                    <button
                      type="button"
                      style={{
                        width: "100%",
                        minHeight: 36,
                        border: "none",
                        borderRadius: 10,
                        background: MAGENTA,
                        color: "#FFFFFF",
                        fontWeight: 750,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        onSelectShare({
                          photo: undefined,
                          placeLabel:
                            expedition.title,
                          city:
                            expedition.city,
                          date: new Date(
                            point.timestamp
                          ).toLocaleDateString(
                            "es-PE"
                          ),
                          note: isStart
                            ? "Comencé esta misión con I.GUIDE."
                            : "Completé esta misión con I.GUIDE.",
                          title:
                            expedition.title,
                          stats: {
                            durationSeconds,
                            totalDistanceKm,
                            totalMemories,
                            totalPhotos,
                            totalNotes,
                          },
                          center: [
                            point.lat,
                            point.lng,
                          ],
                          path,
                        });
                      }}
                    >
                      Compartir
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          }
        )}

        {path.length >= 2 && (
          <Polyline
            positions={path}
            pathOptions={{
              color: MAGENTA,
              weight: 5,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default ExpeditionMap;
