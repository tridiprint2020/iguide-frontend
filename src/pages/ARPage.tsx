import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Camera,
  Footprints,
  Info,
  LocateFixed,
  RotateCw,
  ShieldCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArMissionDirectionGuide,
} from "../components/ar/ArMissionDirectionGuide";

import {
  ArPinScene,
} from "../components/ar/ArPinScene";

import {
  catalog,
} from "../data/catalog";

import {
  loadUserProfile,
} from "../data/user";

import {
  AR_MAXIMUM_DISTANCE_METERS,
  calculateArBearingDegrees,
  calculateArDistanceMeters,
  getArGeoPlacements,
  getSignedAngleDifference,
} from "../engine/arGeoEngine";

import {
  AR_REQUIRED_ACCURACY_METERS,
} from "../engine/arSensorEngine";

import {
  getMemoryCardDescriptor,
} from "../engine/experiencePresentation";

import {
  getExperienceMarkerState,
} from "../engine/placeMarkerVisualEngine";

import {
  useArSession,
} from "../hooks/useArSession";

import {
  useJourney,
} from "../context/JourneyContext";

import type {
  ArGeoPlacement,
} from "../types/ar";

import {
  tx,
} from "../i18n";

function isJourneyActive(
  state: string
): boolean {
  return (
    state === "WALKING" ||
    state === "CAMERA_OPEN" ||
    state === "POINT_SAVED"
  );
}

const MISSION_DIRECTION_THRESHOLD_DEGREES =
  24;

function ARPage() {
  const navigate = useNavigate();

  const {
    journey,
    startWalking,
  } = useJourney();

  const {
    phase,
    coordinates,
    referenceCoordinates,
    headingDegrees,
    referenceHeadingDegrees,
    headingIsAbsolute,
    viewQuaternion,
    calibrationRevision,
    cameraStream,
    errorMessage,
    recalibrate,
    start,
  } = useArSession();

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const [selectedExperienceId,
    setSelectedExperienceId] =
    useState<string | null>(null);

  const [calibrationMessage,
    setCalibrationMessage] =
    useState<string | null>(null);

  const visitedIds = useMemo(
    () =>
      new Set(
        loadUserProfile()
          .visitedExperiences
      ),
    []
  );

  const activeMissionId =
    journey.experience &&
    isJourneyActive(journey.state)
      ? journey.experience.experienceId
      : null;

  const placements = useMemo(() => {
    if (
      !referenceCoordinates ||
      referenceHeadingDegrees === null
    ) {
      return [];
    }

    const anchoredPlacements =
      getArGeoPlacements(
        catalog,
        referenceCoordinates,
        referenceHeadingDegrees,
        {
          maximumDistanceMeters:
            AR_MAXIMUM_DISTANCE_METERS,
          alwaysIncludeExperienceId:
            activeMissionId,
        }
      );

    if (!coordinates) {
      return anchoredPlacements;
    }

    return anchoredPlacements.map(
      (placement) => ({
        ...placement,
        distanceMeters:
          calculateArDistanceMeters(
            coordinates,
            {
              latitude:
                placement.experience
                  .latitude,
              longitude:
                placement.experience
                  .longitude,
            }
          ),
      })
    );
  },
    [
      activeMissionId,
      coordinates,
      referenceCoordinates,
      referenceHeadingDegrees,
    ]
  );

  const nearbyPlacementCount = useMemo(
    () =>
      placements.filter(
        (placement) =>
          placement.distanceMeters <=
          AR_MAXIMUM_DISTANCE_METERS
      ).length,
    [placements]
  );

  const activeMissionPlacement =
    activeMissionId
      ? placements.find(
          (placement) =>
            placement.experience
              .experienceId ===
            activeMissionId
        ) ?? null
      : null;

  const missionRelativeBearing =
    activeMissionPlacement &&
    coordinates &&
    headingDegrees !== null
      ? getSignedAngleDifference(
          calculateArBearingDegrees(
            coordinates,
            {
              latitude:
                activeMissionPlacement
                  .experience.latitude,
              longitude:
                activeMissionPlacement
                  .experience.longitude,
            }
          ),
          headingDegrees
        )
      : null;

  const missionTurnDirection =
    missionRelativeBearing !== null &&
    Math.abs(missionRelativeBearing) >
      MISSION_DIRECTION_THRESHOLD_DEGREES
      ? missionRelativeBearing < 0
        ? "left"
        : "right"
      : null;

  const markerStates = useMemo(
    () =>
      new Map(
        placements.map((placement) => [
          placement.experience
            .experienceId,
          getExperienceMarkerState(
            placement.experience,
            {
              activeMissionId,
              visitedExperienceIds:
                visitedIds,
            }
          ),
        ])
      ),
    [
      activeMissionId,
      placements,
      visitedIds,
    ]
  );

  const selectedPlacement =
    placements.find(
      (placement) =>
        placement.experience
          .experienceId ===
        selectedExperienceId
    ) ?? null;

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !cameraStream) {
      return;
    }

    video.srcObject = cameraStream;
    void video.play().catch(
      () => undefined
    );

    return () => {
      video.srcObject = null;
    };
  }, [cameraStream]);

  function handleSelect(
    placement: ArGeoPlacement
  ) {
    setSelectedExperienceId(
      placement.experience.experienceId
    );
  }

  function handleMissionAction() {
    if (!selectedPlacement) return;

    const experience =
      selectedPlacement.experience;

    if (
      activeMissionId ===
      experience.experienceId
    ) {
      navigate("/journey");
      return;
    }

    const started =
      startWalking(experience);

    if (started) {
      setSelectedExperienceId(
        experience.experienceId
      );
    }
  }

  function handleRecalibrate() {
    const calibrated = recalibrate();

    setCalibrationMessage(
      calibrated
        ? tx(
            "Escena fijada desde este punto."
          )
        : tx(
            "Espera una ubicación precisa antes de fijar la escena."
          )
    );
  }

  const sessionReady =
    phase === "ready";

  const isStarting =
    phase === "requesting" ||
    phase === "locating";

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#05060B",
        color: "#FFFFFF",
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label={tx(
          "Cámara de realidad aumentada"
        )}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: cameraStream ? 1 : 0,
          transition: "opacity 240ms ease",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(4,5,12,0.68), transparent 24%, transparent 66%, rgba(4,5,12,0.78))",
          pointerEvents: "none",
        }}
      />

      {sessionReady && (
        <ArPinScene
          placements={placements}
          markerStates={markerStates}
          selectedExperienceId={
            selectedExperienceId
          }
          viewQuaternion={
            viewQuaternion
          }
          calibrationRevision={
            calibrationRevision
          }
          onSelect={handleSelect}
        />
      )}

      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "10px",
          padding:
            "max(12px, env(safe-area-inset-top)) 12px 10px",
          pointerEvents: "none",
        }}
      >
        <button
          type="button"
          aria-label={tx("Volver")}
          onClick={() => navigate(-1)}
          style={{
            width: "42px",
            height: "42px",
            display: "grid",
            placeItems: "center",
            borderRadius: "14px",
            border:
              "1px solid rgba(255,255,255,0.18)",
            background:
              "rgba(7,8,17,0.76)",
            color: "#FFFFFF",
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        >
          <ArrowLeft
            size={20}
            aria-hidden="true"
          />
        </button>

        <div
          style={{
            minWidth: 0,
            flex: 1,
            textAlign: "center",
            textShadow:
              "0 2px 9px rgba(0,0,0,0.85)",
          }}
        >
          <strong
            style={{
              display: "block",
              fontSize: "14px",
              letterSpacing: "0.08em",
            }}
          >
            I.GUIDE AR
          </strong>
          <span
            style={{
              display: "block",
              marginTop: "2px",
              color:
                "rgba(255,255,255,0.68)",
              fontSize: "9px",
            }}
          >
            {sessionReady
              ? tx(
                  "{{count}} lugares en 150 m",
                  {
                    count:
                      nearbyPlacementCount,
                  }
                )
              : tx(
                  "Pines urbanos de 7 metros"
                )}
          </span>
        </div>

        <div
          title={tx("Precisión GPS")}
          style={{
            minWidth: "42px",
            height: "42px",
            display: "grid",
            placeItems: "center",
            borderRadius: "14px",
            border:
              "1px solid rgba(57,231,255,0.24)",
            background:
              "rgba(7,8,17,0.76)",
            color: "#39E7FF",
            fontSize: "9px",
            fontWeight: 900,
            pointerEvents: "auto",
          }}
        >
          {coordinates?.accuracyMeters
            ? `±${Math.round(
                coordinates.accuracyMeters
              )}m`
            : (
                <LocateFixed
                  size={18}
                  aria-hidden="true"
                />
              )}
        </div>
      </header>

      {sessionReady && (
        <div
          style={{
            position: "absolute",
            top:
              "max(70px, calc(env(safe-area-inset-top) + 58px))",
            right: "12px",
            zIndex: 19,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
          }}
        >
          <button
            type="button"
            onClick={handleRecalibrate}
            aria-label={tx(
              "Fijar la escena desde este punto"
            )}
            style={{
              minHeight: "34px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 10px",
              borderRadius: "11px",
              border:
                "1px solid rgba(57,231,255,0.38)",
              background:
                "rgba(7,8,17,0.82)",
              color: "#8AF4FF",
              fontSize: "10px",
              fontWeight: 900,
              cursor: "pointer",
              backdropFilter: "blur(10px)",
            }}
          >
            <LocateFixed
              size={15}
              aria-hidden="true"
            />
            {tx("Fijar escena")}
          </button>

          {calibrationMessage && (
            <span
              role="status"
              style={{
                maxWidth: "210px",
                padding: "6px 8px",
                borderRadius: "9px",
                background:
                  "rgba(7,8,17,0.78)",
                color:
                  "rgba(255,255,255,0.78)",
                fontSize: "9px",
                lineHeight: 1.35,
                textAlign: "right",
              }}
            >
              {calibrationMessage}
            </span>
          )}
        </div>
      )}

      {!sessionReady && (
        <section
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 15,
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background:
              "radial-gradient(circle at 50% 30%, rgba(0,230,255,0.11), transparent 31%), rgba(5,6,11,0.94)",
          }}
        >
          <div
            style={{
              width: "min(100%, 390px)",
              padding: "26px 22px",
              borderRadius: "26px",
              border:
                "1px solid rgba(57,231,255,0.18)",
              background:
                "rgba(12,13,27,0.92)",
              boxShadow:
                "0 0 42px rgba(0,230,255,0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "76px",
                height: "76px",
                margin: "0 auto 16px",
                display: "grid",
                placeItems: "center",
                borderRadius: "25px",
                border:
                  "1px solid rgba(255,0,255,0.42)",
                background:
                  "linear-gradient(145deg, rgba(255,0,255,0.17), rgba(0,230,255,0.08))",
                color: "#FF62F1",
                boxShadow:
                  "0 0 28px rgba(255,0,255,0.16)",
              }}
            >
              {isStarting
                ? (
                    <RotateCw
                      size={34}
                      aria-hidden="true"
                      style={{
                        animation:
                          "iguide-ar-spin 1.1s linear infinite",
                      }}
                    />
                  )
                : (
                    <Camera
                      size={34}
                      aria-hidden="true"
                    />
                  )}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "22px",
              }}
            >
              {tx(
                "Explora Huancayo en realidad aumentada"
              )}
            </h1>

            <p
              style={{
                margin: "11px 0 18px",
                color:
                  "rgba(255,255,255,0.64)",
                fontSize: "12px",
                lineHeight: 1.55,
              }}
            >
              {tx(
                "I.GUIDE mostrará pines 3D de siete metros para lugares a 150 metros. Si tienes una misión activa, su faro podrá verse desde más lejos. La cámara no se graba."
              )}
            </p>

            {errorMessage && (
              <p
                role="alert"
                style={{
                  margin: "0 0 14px",
                  padding: "10px",
                  borderRadius: "12px",
                  background:
                    "rgba(255,138,0,0.1)",
                  color: "#FFBC72",
                  fontSize: "11px",
                }}
              >
                {errorMessage}
              </p>
            )}

            {phase === "locating" &&
              coordinates?.accuracyMeters &&
              coordinates.accuracyMeters >
                AR_REQUIRED_ACCURACY_METERS && (
                <p
                  role="status"
                  style={{
                    margin: "0 0 14px",
                    color: "#FFBC72",
                    fontSize: "11px",
                    lineHeight: 1.45,
                  }}
                >
                  {tx(
                    "Precisión actual ±{{accuracy}} m. Esperando una lectura de {{required}} m o mejor para no colocar pines en ubicaciones falsas.",
                    {
                      accuracy: Math.round(
                        coordinates.accuracyMeters
                      ),
                      required:
                        AR_REQUIRED_ACCURACY_METERS,
                    }
                  )}
                </p>
              )}

            <button
              type="button"
              disabled={isStarting}
              onClick={() => void start()}
              style={{
                width: "100%",
                minHeight: "48px",
                borderRadius: "15px",
                border:
                  "1px solid rgba(57,231,255,0.48)",
                background:
                  "linear-gradient(135deg, rgba(0,230,255,0.2), rgba(255,0,255,0.15))",
                color: "#FFFFFF",
                fontWeight: 900,
                cursor: isStarting
                  ? "wait"
                  : "pointer",
                opacity: isStarting
                  ? 0.64
                  : 1,
              }}
            >
              {isStarting
                ? tx(
                    "Preparando cámara y sensores…"
                  )
                : tx("Activar vista AR")}
            </button>

            <p
              style={{
                margin: "13px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                color:
                  "rgba(255,255,255,0.42)",
                fontSize: "9px",
              }}
            >
              <ShieldCheck
                size={13}
                aria-hidden="true"
              />
              {tx(
                "Requiere cámara, ubicación y orientación."
              )}
            </p>
          </div>
        </section>
      )}

      {sessionReady &&
        !headingIsAbsolute && (
          <p
            role="status"
            style={{
              position: "absolute",
              top:
                "max(76px, calc(env(safe-area-inset-top) + 64px))",
              left: "50%",
              zIndex: 18,
              margin: 0,
              padding: "7px 10px",
              transform:
                "translateX(-50%)",
              borderRadius: "10px",
              background:
                "rgba(255,138,0,0.82)",
              color: "#130A00",
              fontSize: "9px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {tx(
              "Brújula aproximada · gira el teléfono para calibrar"
            )}
          </p>
        )}

      {sessionReady &&
        activeMissionPlacement &&
        missionTurnDirection && (
          <ArMissionDirectionGuide
            direction={
              missionTurnDirection
            }
            distanceMeters={
              activeMissionPlacement
                .distanceMeters
            }
            onSelect={() =>
              setSelectedExperienceId(
                activeMissionPlacement
                  .experience.experienceId
              )
            }
          />
        )}

      {sessionReady &&
        selectedPlacement && (
          <section
            style={{
              position: "absolute",
              right: "12px",
              bottom:
                "max(58px, calc(env(safe-area-inset-bottom) + 12px))",
              left: "12px",
              zIndex: 22,
              padding: "14px",
              borderRadius: "19px",
              border:
                "1px solid rgba(57,231,255,0.22)",
              background:
                "rgba(7,8,17,0.9)",
              boxShadow:
                "0 14px 38px rgba(0,0,0,0.42)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <strong
                  style={{
                    display: "block",
                    fontSize: "15px",
                  }}
                >
                  {
                    selectedPlacement
                      .experience.title
                  }
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: "3px",
                    color: "#39E7FF",
                    fontSize: "9px",
                    fontWeight: 900,
                  }}
                >
                  {getMemoryCardDescriptor(
                    selectedPlacement
                      .experience
                      .placeCategory ??
                      selectedPlacement
                        .experience.type,
                    selectedPlacement
                      .experience
                      .listingStatus
                  )}
                </span>
              </div>

              <Info
                size={18}
                color="#FF62F1"
                aria-hidden="true"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/expedition/${selectedPlacement.experience.slug}`
                  )
                }
                style={{
                  minHeight: "42px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(255,255,255,0.16)",
                  background:
                    "rgba(255,255,255,0.06)",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {tx("Ver detalles")}
              </button>

              <button
                type="button"
                onClick={handleMissionAction}
                style={{
                  minHeight: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  gap: "6px",
                  borderRadius: "12px",
                  border:
                    "1px solid rgba(255,0,255,0.42)",
                  background:
                    "rgba(255,0,255,0.13)",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                <Footprints
                  size={15}
                  aria-hidden="true"
                />
                {activeMissionId ===
                selectedPlacement
                  .experience.experienceId
                  ? tx("Abrir misión")
                  : tx("Iniciar misión")}
              </button>
            </div>
          </section>
        )}

      {sessionReady && (
        <p
          style={{
            position: "absolute",
            right: "12px",
            bottom:
              "max(12px, env(safe-area-inset-bottom))",
            left: "12px",
            zIndex: 18,
            margin: 0,
            color:
              "rgba(255,255,255,0.62)",
            fontSize: "9px",
            textAlign: "center",
            textShadow:
              "0 2px 6px rgba(0,0,0,0.9)",
          }}
        >
          {tx(
            "Detente para mirar la pantalla. Los pines orientan; la llegada se certifica por GPS."
          )}
        </p>
      )}

      <style>
        {`
          @keyframes iguide-ar-spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </main>
  );
}

export default ARPage;
