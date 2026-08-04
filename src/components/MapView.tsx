import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { catalog } from "../data/catalog";
import { loadUserProfile } from "../data/user";
import { loadTrack } from "../engine/trackingEngine";
import { MemoryCardEngine } from "../engine/memoryCardEngine";
import { shareEngine } from "../engine/shareEngine";

import { Theme } from "../styles/theme";

import MemoryCardModal from "./sharing/MemoryCardModal";

import type {
  ExpeditionTrack,
  TimelineItem,
} from "../types/tracking/tracking";
import type { MemoryCardData } from "../types/memoryCard";

interface Props {
  track: ExpeditionTrack | null;
}

// Corrección de iconos Leaflet.
delete (
  L.Icon.Default.prototype as L.Icon.Default & {
    _getIconUrl?: unknown;
  }
)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapView({ track }: Props) {
  const navigate = useNavigate();

  const [selectedCard, setSelectedCard] =
    useState<MemoryCardData | null>(null);

  const user = loadUserProfile();

  const defaultCenter: [number, number] = [
    -12.06513,
    -75.20486,
  ];

  const activePath = track
    ? track.timeline.filter(
        (item: TimelineItem) =>
          item.type !== "memory"
      )
    : [];

  const mapCenter: [number, number] =
    activePath.length > 0
      ? [
          activePath[0].lat,
          activePath[0].lng,
        ]
      : defaultCenter;

  function openMemoryCard(
    data: MemoryCardData
  ) {
    setSelectedCard(data);
  }

  function closeMemoryCard() {
    setSelectedCard(null);
  }
  // CONSTANTES DE COLOR AGREGADAS ANTES DEL RETURN
  const WINE = "#7A123D";
  const ORANGE = "#FF8A00";
  
  return (
    <>
      <div
        style={{
          backgroundColor:
            Theme.Colors.surface,
          borderRadius:
            Theme.Radius.large,
          padding: "10px",
          boxShadow:
            Theme.Shadows.card,
          marginTop:
            Theme.Space.md,
          marginLeft: "-6px",
          marginRight: "-6px",
        }}
      >
        <div
          style={{
            height: "520px",
            borderRadius:
              Theme.Radius.medium,
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* PINES DEL CATÁLOGO */}
            {catalog.map((experience) => {
              const isVisited =
                user.visitedExperiences?.includes(
                  experience.experienceId
                ) ?? false;

              const experienceImage =
                experience.image ||
                experience.coverImage;

              return (
                <Marker
                  key={
                    experience.experienceId
                  }
                  position={[
                    experience.latitude,
                    experience.longitude,
                  ]}
                >
                  <Popup minWidth={260}>
                    <article
                      style={{
                        width: "235px",
                        color: "#161616",
                      }}
                    >
                      {experienceImage && (
                        <img
                          src={experienceImage}
                          alt={experience.title}
                          style={{
                            width: "100%",
                            height: "110px",
                            objectFit: "cover",
                            borderRadius: "11px",
                            marginBottom: "10px",
                            backgroundColor:
                              "#EFEFEF",
                          }}
                        />
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: "8px",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin:
                                "0 0 3px",
                              color:
                                Theme.Colors
                                  .primary,
                              fontSize:
                                "10px",
                              fontWeight: 800,
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.08em",
                            }}
                          >
                            {experience.type}
                          </p>

                          <h3
                            style={{
                              margin: 0,
                              fontSize:
                                "17px",
                            }}
                          >
                            {experience.title}
                          </h3>
                        </div>

                        {isVisited && (
                          <span
                            title="Lugar visitado"
                            style={{
                              fontSize:
                                "17px",
                            }}
                          >
                            ✔️
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          margin:
                            "9px 0 11px",
                          color: "#666666",
                          fontSize: "12px",
                          lineHeight: 1.4,
                        }}
                      >
                        {experience.description}
                      </p>

                      {"openingHours" in
                        experience &&
                        experience.openingHours && (
                          <p
                            style={{
                              margin:
                                "0 0 11px",
                              color:
                                "#444444",
                              fontSize:
                                "11px",
                              fontWeight: 600,
                            }}
                          >
                            🕒{" "}
                            {
                              experience.openingHours
                            }
                          </p>
                        )}

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/expedition/${experience.slug}`
                          )
                        }
                        style={{
                          width: "100%",
                          minHeight: "42px",
                          border: "none",
                          borderRadius:
                            "11px",
                          backgroundColor:
                            Theme.Colors
                              .primary,
                          color: "#FFFFFF",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        Ver plan e iniciar
                      </button>
                    </article>
                  </Popup>
                </Marker>
              );
            })}

            {/* RUTAS GUARDADAS */}
            {catalog.map((experience) => {
              const currentTrack =
                loadTrack(
                  experience.experienceId
                );

              if (!currentTrack) {
                return null;
              }

              const routeNodes =
                currentTrack.timeline.filter(
                  (item) =>
                    item.type ===
                      "start" ||
                    item.type ===
                      "walk" ||
                    item.type ===
                      "abort" ||
                    item.type ===
                      "finish"
                );

              if (routeNodes.length < 2) {
                return null;
              }

              const realPath: [
                number,
                number,
              ][] = routeNodes.map(
                (point) => [
                  point.lat,
                  point.lng,
                ]
              );

       
              const routeColor =
  Theme.Colors.primary;

              return (
                <Polyline
                  key={`track-${experience.experienceId}`}
                  positions={realPath}
                  pathOptions={{
                    color: routeColor,
                    weight: 4,
                    lineCap: "round",
                    lineJoin: "round",
                    opacity: 0.88,
                  }}
                />
              );
            })}

            {/* INICIO, ABANDONO Y FINAL */}
            {catalog.map((experience) => {
              const currentTrack =
                loadTrack(
                  experience.experienceId
                );

              if (!currentTrack) {
                return null;
              }

              const startPoint =
                currentTrack.timeline.find(
                  (item) =>
                    item.type === "start"
                );

              const abortPoint = [
                ...currentTrack.timeline,
              ]
                .reverse()
                .find(
                  (item) =>
                    item.type === "abort"
                );

              const finishPoint = [
                ...currentTrack.timeline,
              ]
                .reverse()
                .find(
                  (item) =>
                    item.type ===
                    "finish"
                );

              const startCardData =
                startPoint
                  ? MemoryCardEngine.buildFromTimelineItem(
                      experience,
                      currentTrack,
                      startPoint
                    )
                  : null;

              const abortCardData =
                abortPoint
                  ? MemoryCardEngine.buildFromTimelineItem(
                      experience,
                      currentTrack,
                      abortPoint
                    )
                  : null;

              const finishCardData =
                finishPoint
                  ? MemoryCardEngine.buildFromTimelineItem(
                      experience,
                      currentTrack,
                      finishPoint
                    )
                  : null;

              return (
                <div
                  key={`edges-${experience.experienceId}`}
                >
                  {startPoint &&
                    startCardData && (
                      <CircleMarker
                        center={[
                          startPoint.lat,
                          startPoint.lng,
                        ]}
                        radius={11}
                        pathOptions={{
                          color: "#FFFFFF",
                          weight: 2,
                          fillColor: WINE,
                          fillOpacity: 1,
                        }}
                      >
                        <Popup minWidth={220}>
                          <div
                            style={{
                              padding: "7px",
                              color:
                                "#161616",
                              textAlign:
                                "center",
                            }}
                          >
                            <strong>
                              🚀 Inicio del
                              recorrido
                            </strong>

                            <p
                              style={{
                                margin:
                                  "7px 0 11px",
                                fontSize:
                                  "12px",
                                color:
                                  "#666666",
                              }}
                            >
                              {
                                experience.title
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                openMemoryCard(
                                  startCardData
                                )
                              }
                              style={{
                                width:
                                  "100%",
                                minHeight:
                                  "38px",
                                border:
                                  "none",
                                borderRadius:
                                  "10px",
                                backgroundColor:
                                  Theme.Colors
                                    .primary,
                                color:
                                  "#FFFFFF",
                                fontWeight:
                                  700,
                                cursor:
                                  "pointer",
                              }}
                            >
                              Ver Memory Card
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )}

                  {abortPoint &&
                    !finishPoint &&
                    abortCardData && (
                      <CircleMarker
                        center={[
                          abortPoint.lat,
                          abortPoint.lng,
                        ]}
                        radius={10}
                        pathOptions={{
                          color: "#FFFFFF",
                          weight: 2,
                        fillColor: ORANGE,
                          fillOpacity: 1,
                        }}
                      >
                        <Popup minWidth={220}>
                          <div
                            style={{
                              padding: "7px",
                              color:
                                "#161616",
                              textAlign:
                                "center",
                            }}
                          >
                            <strong>
                              🟠 Recorrido
                              conservado
                            </strong>

                            <p
                              style={{
                                margin:
                                  "7px 0 11px",
                                fontSize:
                                  "12px",
                                color:
                                  "#666666",
                              }}
                            >
                              {
                                experience.title
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                openMemoryCard(
                                  abortCardData
                                )
                              }
                              style={{
                                width:
                                  "100%",
                                minHeight:
                                  "38px",
                                border:
                                  "none",
                                borderRadius:
                                  "10px",
                                backgroundColor: ORANGE,
                                color:
                                  "#FFFFFF",
                                fontWeight:
                                  700,
                                cursor:
                                  "pointer",
                              }}
                            >
                              Ver Memory Card
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )}

                  {finishPoint &&
                    finishCardData && (
                      <CircleMarker
                        center={[
                          finishPoint.lat,
                          finishPoint.lng,
                        ]}
                        radius={12}
                        pathOptions={{
                          color: "#FFFFFF",
                          weight: 2,
                         fillColor: WINE,
                          fillOpacity: 1,
                        }}
                      >
                        <Popup minWidth={220}>
                          <div
                            style={{
                              padding: "7px",
                              color:
                                "#161616",
                              textAlign:
                                "center",
                            }}
                          >
                            <strong>
                              🏁 Expedición
                              completada
                            </strong>

                            <p
                              style={{
                                margin:
                                  "7px 0 11px",
                                fontSize:
                                  "12px",
                                color:
                                  "#666666",
                              }}
                            >
                              {
                                experience.title
                              }
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                openMemoryCard(
                                  finishCardData
                                )
                              }
                              style={{
                                width:
                                  "100%",
                                minHeight:
                                  "38px",
                                border:
                                  "none",
                                borderRadius:
                                  "10px",
                                backgroundColor: WINE,
                                color: "#FFFFFF",
                                fontWeight:
                                  800,
                                cursor:
                                  "pointer",
                              }}
                            >
                              Ver Memory Card
                            </button>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )}
                </div>
              );
            })}

            {/* RECUERDOS */}
            {catalog.map((experience) => {
              const currentTrack =
                loadTrack(
                  experience.experienceId
                );

              if (!currentTrack) {
                return null;
              }

              const memoryNodes =
                currentTrack.timeline.filter(
                  (item) =>
                    item.type === "memory"
                );

              return memoryNodes.map(
                (memory, index) => {
                  const cardData =
                    MemoryCardEngine.buildFromTimelineItem(
                      experience,
                      currentTrack,
                      memory
                    );

                  return (
                    <CircleMarker
                      key={
                        memory.id ||
                        `memory-${experience.experienceId}-${index}`
                      }
                      center={[
                        memory.lat,
                        memory.lng,
                      ]}
                      radius={11}
                      pathOptions={{
                        color: "#FFFFFF",
                        weight: 2,
                        fillColor:
                          Theme.Colors
                            .primary,
                        fillOpacity: 1,
                      }}
                    >
                      <Popup minWidth={220}>
                        <div
                          style={{
                            padding: "7px",
                            color:
                              "#161616",
                            textAlign:
                              "center",
                          }}
                        >
                          <strong>
                            📸 Recuerdo
                            guardado
                          </strong>

                          <p
                            style={{
                              margin:
                                "7px 0 11px",
                              fontSize:
                                "12px",
                              color:
                                "#666666",
                            }}
                          >
                            {
                              experience.title
                            }
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              openMemoryCard(
                                cardData
                              )
                            }
                            style={{
                              width: "100%",
                              minHeight:
                                "38px",
                              border:
                                "none",
                              borderRadius:
                                "10px",
                              backgroundColor:
                                Theme.Colors
                                  .primary,
                              color:
                                "#FFFFFF",
                              fontWeight:
                                700,
                              cursor:
                                "pointer",
                            }}
                          >
                            Ver Memory Card
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                }
              );
            })}
          </MapContainer>
        </div>
      </div>

      <MemoryCardModal
        open={selectedCard !== null}
        data={selectedCard}
        onClose={closeMemoryCard}
        onShare={(data) =>
          shareEngine.shareMemory(data)
        }
      />
    </>
  );
}

export default MapView;