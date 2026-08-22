import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getHeadingFromOrientation,
  requestArOrientationPermission,
  requestRearCameraStream,
  smoothArHeading,
  stopArCameraStream,
} from "../engine/arSensorEngine";

import type {
  ArSensorSnapshot,
} from "../types/ar";

import {
  tx,
} from "../i18n";

const INITIAL_STATE: ArSensorSnapshot = {
  phase: "idle",
  coordinates: null,
  headingDegrees: null,
  headingIsAbsolute: false,
  cameraStream: null,
  errorMessage: null,
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
        "deviceorientation",
        orientationHandlerRef.current
      );
      window.removeEventListener(
        "deviceorientationabsolute",
        orientationHandlerRef.current as
          EventListener
      );
      orientationHandlerRef.current =
        null;
    }

    stopArCameraStream(
      streamRef.current
    );
    streamRef.current = null;
    headingRef.current = null;
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
        const heading =
          getHeadingFromOrientation(
            event
          );

        if (!heading) return;

        const smoothedHeading =
          smoothArHeading(
            headingRef.current,
            heading.degrees
          );

        headingRef.current =
          smoothedHeading;

        setSnapshot((current) => ({
          ...current,
          headingDegrees:
            smoothedHeading,
          headingIsAbsolute:
            heading.isAbsolute,
          phase:
            current.coordinates
              ? "ready"
              : "locating",
        }));
      };

      orientationHandlerRef.current =
        handleOrientation;

      window.addEventListener(
        "deviceorientation",
        handleOrientation
      );
      window.addEventListener(
        "deviceorientationabsolute",
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
            setSnapshot((current) => ({
              ...current,
              coordinates: {
                latitude:
                  position.coords.latitude,
                longitude:
                  position.coords.longitude,
                accuracyMeters:
                  position.coords.accuracy,
              },
              phase:
                current.headingDegrees !== null
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
    start,
    stop,
  };
}
