import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AR_REQUIRED_ACCURACY_METERS,
  AR_REQUIRED_STABLE_GPS_SAMPLES,
  AR_REQUIRED_STABLE_HEADING_SAMPLES,
  getHeadingFromOrientation,
  requestArOrientationPermission,
  requestRearCameraStream,
  smoothArHeading,
  stabilizeArCoordinates,
  stopArCameraStream,
} from "../engine/arSensorEngine";

import {
  getArOrientationSample,
  getRelativeArViewQuaternion,
} from "../engine/arPoseEngine";

import type {
  ArCoordinates,
  ArOrientationSample,
  ArQuaternion,
  ArSensorSnapshot,
} from "../types/ar";

import {
  tx,
} from "../i18n";

const INITIAL_STATE: ArSensorSnapshot = {
  phase: "idle",
  coordinates: null,
  referenceCoordinates: null,
  headingDegrees: null,
  referenceHeadingDegrees: null,
  headingIsAbsolute: false,
  viewQuaternion: null,
  calibrationRevision: 0,
  cameraStream: null,
  errorMessage: null,
};

const IDENTITY_QUATERNION: ArQuaternion = {
  x: 0,
  y: 0,
  z: 0,
  w: 1,
};

export function useArSession() {
  const [snapshot, setSnapshot] =
    useState<ArSensorSnapshot>(
      INITIAL_STATE
    );

  const streamRef =
    useRef<MediaStream | null>(null);

  const watchIdRef =
    useRef<number | null>(null);

  const headingRef =
    useRef<number | null>(null);

  const orientationRef =
    useRef<ArOrientationSample | null>(
      null
    );

  const referenceOrientationRef =
    useRef<ArOrientationSample | null>(
      null
    );

  const referenceHeadingRef =
    useRef<number | null>(null);

  const calibrationRevisionRef =
    useRef(0);

  const coordinatesRef =
    useRef<ArCoordinates | null>(null);

  const referenceCoordinatesRef =
    useRef<ArCoordinates | null>(null);

  const locationReliableRef =
    useRef(false);

  const gpsSampleCountRef =
    useRef(0);

  const headingSampleCountRef =
    useRef(0);

  const orientationEventNameRef =
    useRef<
      | "deviceorientation"
      | "deviceorientationabsolute"
      | null
    >(null);

  const orientationHandlerRef =
    useRef<((
      event: DeviceOrientationEvent
    ) => void) | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(
        watchIdRef.current
      );
      watchIdRef.current = null;
    }

    if (orientationHandlerRef.current) {
      window.removeEventListener(
        orientationEventNameRef.current ??
          "deviceorientation",
        orientationHandlerRef.current as
          EventListener
      );
      orientationHandlerRef.current =
        null;
      orientationEventNameRef.current =
        null;
    }

    stopArCameraStream(
      streamRef.current
    );
    streamRef.current = null;
    headingRef.current = null;
    orientationRef.current = null;
    referenceOrientationRef.current =
      null;
    referenceHeadingRef.current = null;
    calibrationRevisionRef.current = 0;
    coordinatesRef.current = null;
    referenceCoordinatesRef.current =
      null;
    locationReliableRef.current = false;
    gpsSampleCountRef.current = 0;
    headingSampleCountRef.current = 0;
  }, []);

  const recalibrate = useCallback(() => {
    const heading = headingRef.current;
    const orientation =
      orientationRef.current;

    if (
      heading === null ||
      !orientation ||
      !coordinatesRef.current ||
      !locationReliableRef.current
    ) {
      return false;
    }

    referenceHeadingRef.current =
      heading;
    referenceOrientationRef.current =
      orientation;
    referenceCoordinatesRef.current =
      coordinatesRef.current;
    calibrationRevisionRef.current += 1;

    setSnapshot((current) => ({
      ...current,
      referenceHeadingDegrees:
        heading,
      referenceCoordinates:
        referenceCoordinatesRef.current,
      viewQuaternion:
        IDENTITY_QUATERNION,
      calibrationRevision:
        calibrationRevisionRef.current,
      phase: "ready",
    }));

    return true;
  }, []);

  const start = useCallback(async () => {
    stop();

    setSnapshot({
      ...INITIAL_STATE,
      phase: "requesting",
    });

    try {
      if (!window.isSecureContext) {
        throw new Error(
          "secure-context-required"
        );
      }

      if (!navigator.geolocation) {
        throw new Error(
          "location-not-supported"
        );
      }

      const orientationAllowed =
        await requestArOrientationPermission();

      if (!orientationAllowed) {
        throw new Error(
          "orientation-denied"
        );
      }

      const cameraStream =
        await requestRearCameraStream();

      streamRef.current =
        cameraStream;

      const handleOrientation = (
        event: DeviceOrientationEvent
      ) => {
        const orientation =
          getArOrientationSample(event);

        const heading =
          getHeadingFromOrientation(
            event
          );

        if (!heading || !orientation) {
          return;
        }

        const headingIsAbsolute =
          heading.isAbsolute ||
          orientationEventNameRef.current ===
            "deviceorientationabsolute";

        if (!headingIsAbsolute) {
          return;
        }

        const smoothedHeading =
          smoothArHeading(
            headingRef.current,
            heading.degrees
          );

        headingRef.current =
          smoothedHeading;
        orientationRef.current =
          orientation;

        headingSampleCountRef.current +=
          1;

        const headingReliable =
          headingSampleCountRef.current >=
          AR_REQUIRED_STABLE_HEADING_SAMPLES;

        if (
          headingReliable &&
          locationReliableRef.current &&
          referenceHeadingRef.current ===
            null
        ) {
          referenceHeadingRef.current =
            smoothedHeading;
          referenceOrientationRef.current =
            orientation;
          referenceCoordinatesRef.current =
            coordinatesRef.current;
        }

        const referenceOrientation =
          referenceOrientationRef.current;

        const viewQuaternion =
          referenceOrientation
            ? getRelativeArViewQuaternion(
                referenceOrientation,
                orientation
              )
            : null;

        setSnapshot((current) => ({
          ...current,
          headingDegrees:
            smoothedHeading,
          headingIsAbsolute:
            headingIsAbsolute,
          referenceHeadingDegrees:
            referenceHeadingRef.current,
          referenceCoordinates:
            referenceCoordinatesRef.current,
          viewQuaternion,
          calibrationRevision:
            calibrationRevisionRef.current,
          phase:
            locationReliableRef.current &&
            headingReliable &&
            referenceHeadingRef.current !==
              null &&
            viewQuaternion
              ? "ready"
              : "locating",
        }));
      };

      orientationHandlerRef.current =
        handleOrientation;

      const constructor =
        DeviceOrientationEvent as
          typeof DeviceOrientationEvent & {
            requestPermission?: () => Promise<
              "granted" | "denied"
            >;
          };

      const orientationEventName =
        !constructor.requestPermission &&
        "ondeviceorientationabsolute" in
          window
          ? "deviceorientationabsolute"
          : "deviceorientation";

      orientationEventNameRef.current =
        orientationEventName;

      window.addEventListener(
        orientationEventName,
        handleOrientation as
          EventListener
      );

      setSnapshot((current) => ({
        ...current,
        phase: "locating",
        cameraStream,
      }));

      watchIdRef.current =
        navigator.geolocation.watchPosition(
          (position) => {
            const measuredCoordinates = {
              latitude:
                position.coords.latitude,
              longitude:
                position.coords.longitude,
              accuracyMeters:
                position.coords.accuracy,
            };

            if (
              position.coords.accuracy >
              AR_REQUIRED_ACCURACY_METERS
            ) {
              if (
                !locationReliableRef.current
              ) {
                setSnapshot((current) => ({
                  ...current,
                  coordinates:
                    measuredCoordinates,
                  phase: "locating",
                }));
              }
              return;
            }

            const stableCoordinates =
              stabilizeArCoordinates(
                coordinatesRef.current,
                measuredCoordinates
              );

            if (!stableCoordinates) {
              locationReliableRef.current =
                false;

              setSnapshot((current) => ({
                ...current,
                coordinates:
                  measuredCoordinates,
                phase: "locating",
              }));
              return;
            }

            coordinatesRef.current =
              stableCoordinates;

            gpsSampleCountRef.current += 1;

            locationReliableRef.current =
              gpsSampleCountRef.current >=
              AR_REQUIRED_STABLE_GPS_SAMPLES;

            const headingReliable =
              headingSampleCountRef.current >=
              AR_REQUIRED_STABLE_HEADING_SAMPLES;

            if (
              headingReliable &&
              referenceHeadingRef.current ===
                null &&
              headingRef.current !== null &&
              orientationRef.current
            ) {
              referenceHeadingRef.current =
                headingRef.current;
              referenceOrientationRef.current =
                orientationRef.current;
              referenceCoordinatesRef.current =
                stableCoordinates;
            }

            const viewQuaternion =
              referenceOrientationRef.current &&
              orientationRef.current
                ? getRelativeArViewQuaternion(
                    referenceOrientationRef.current,
                    orientationRef.current
                  )
                : null;

            setSnapshot((current) => ({
              ...current,
              coordinates:
                stableCoordinates,
              referenceHeadingDegrees:
                referenceHeadingRef.current,
              referenceCoordinates:
                referenceCoordinatesRef.current,
              viewQuaternion,
              calibrationRevision:
                calibrationRevisionRef.current,
              phase:
                current.headingDegrees !==
                  null &&
                locationReliableRef.current &&
                headingReliable &&
                referenceHeadingRef.current !==
                  null &&
                viewQuaternion
                  ? "ready"
                  : "locating",
            }));
          },
          () => {
            stop();
            setSnapshot({
              ...INITIAL_STATE,
              phase: "error",
              errorMessage: tx(
                "No se pudo obtener tu ubicación. Activa el GPS e inténtalo nuevamente."
              ),
            });
          },
          {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 12000,
          }
        );
    } catch (error) {
      stop();

      const code =
        error instanceof Error
          ? error.message
          : "unknown";

      const errorMessage =
        code === "secure-context-required"
          ? tx(
              "La vista AR necesita una conexión HTTPS segura."
            )
          : code === "orientation-denied"
            ? tx(
                "I.GUIDE necesita permiso de movimiento y orientación para colocar los pines."
              )
            : code === "location-not-supported"
              ? tx(
                  "Tu dispositivo no soporta geolocalización."
                )
              : code === "camera-not-supported"
                ? tx(
                    "Tu dispositivo no permite abrir la cámara AR."
                  )
                : tx(
                    "No se pudo iniciar la vista AR. Revisa los permisos de cámara, ubicación y movimiento."
                  );

      setSnapshot({
        ...INITIAL_STATE,
        phase: "error",
        errorMessage,
      });
    }
  }, [stop]);

  useEffect(
    () => stop,
    [stop]
  );

  return {
    ...snapshot,
    recalibrate,
    start,
    stop,
  };
}
