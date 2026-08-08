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
  getTimelineRouteSegments,
} from "../engine/trackingEngine";

import {
  useJourney,
} from "../context/JourneyContext";

import UserLocationLayer from "./maps/UserLocationLayer";
import { getAppLanguage, tx } from "../i18n";

type Props = {
  expedition: Experience;
  track: ExpeditionTrack | null;
  onSelectShare: (
    memoryData: MemoryCardData
  ) => void;
  onCaptureMemory?: () => void;
};

const MAGENTA = "#FF00FF";
const CYAN = "#42E8F5";

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

  const pathSegments =
    getTimelineRouteSegments(
      activeTimeline
    );

  const path: [number, number][] =
    pathSegments.flat();

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
          aria-label={tx("Tomar una fotografía y guardarla en el timeline")}
          title={tx("Guardar recuerdo")}
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
                {tx("Destino")} · {expedition.title}
              </strong>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "11px",
                  color: "#666666",
                }}
              >
                {tx("Sigue el recorrido hasta este punto.")}
              </p>
            </div>
          </Popup>
        </CircleMarker>

        {activeTimeline.map(
          (point, index) => {
            if (point.type === "walk") {
              return null;
            }

            if (point.type === "memory") {
              return (
                <CircleMarker
                  key={`memory-node-${point.id ?? index}`}
                  center={[
                    point.lat,
                    point.lng,
                  ]}
                  radius={5}
                  pathOptions={{
                    color: "#FFFFFF",
                    weight: 2,
                    fillColor: CYAN,
                    fillOpacity: 1,
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
                        {tx("Recuerdo registrado")}
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
                              getAppLanguage() === "en" ? "en-US" : "es-PE"
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
                            waypoints:
                              activeTimeline,
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
                        {tx("Ver MemoryCard")}
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
                  isFinish ? 13 : 12
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
                        ? tx("Inicio de misión")
                        : tx("Llegada certificada")}
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
                            getAppLanguage() === "en" ? "en-US" : "es-PE"
                          ),
                          note: isStart
                            ? tx("Comencé esta misión con I.GUIDE.")
                            : tx("Completé esta misión con I.GUIDE."),
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
                      {tx("Compartir")}
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          }
        )}

        {pathSegments.map(
          (segment, index) =>
            segment.length >= 2 ? (
              <Polyline
                key={`active-route-${index}`}
                positions={segment}
                pathOptions={{
                  color: MAGENTA,
                  weight: 5,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            ) : null
        )}
      </MapContainer>
    </div>
  );
}

export default ExpeditionMap;
