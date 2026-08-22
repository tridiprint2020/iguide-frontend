import {
  calculateArDistanceMeters,
  getSignedAngleDifference,
  normalizeDegrees,
} from "./arGeoEngine";

import type {
  ArCoordinates,
} from "../types/ar";

export const AR_REQUIRED_ACCURACY_METERS =
  25;

export const AR_REQUIRED_STABLE_GPS_SAMPLES =
  3;

export const AR_REQUIRED_STABLE_HEADING_SAMPLES =
  6;

type OrientationPermissionConstructor =
  typeof DeviceOrientationEvent & {
    requestPermission?: () => Promise<
      "granted" | "denied"
    >;
  };

type CompassOrientationEvent =
  DeviceOrientationEvent & {
    webkitCompassHeading?: number;
    webkitCompassAccuracy?: number;
  };

export type NormalizedHeading = {
  degrees: number;
  isAbsolute: boolean;
};

export function calculateArCompassHeading(
  alphaDegrees: number,
  betaDegrees: number,
  gammaDegrees: number
): number {
  const toRadians = Math.PI / 180;
  const alpha =
    alphaDegrees * toRadians;
  const beta =
    betaDegrees * toRadians;
  const gamma =
    gammaDegrees * toRadians;

  const cosineGamma = Math.cos(gamma);
  const cosineAlpha = Math.cos(alpha);
  const sineBeta = Math.sin(beta);
  const sineGamma = Math.sin(gamma);
  const sineAlpha = Math.sin(alpha);

  const vectorX =
    -cosineAlpha * sineGamma -
    sineAlpha * sineBeta *
      cosineGamma;

  const vectorY =
    -sineAlpha * sineGamma +
    cosineAlpha * sineBeta *
      cosineGamma;

  return normalizeDegrees(
    Math.atan2(
      vectorX,
      vectorY
    ) *
      180 /
      Math.PI
  );
}

export async function requestArOrientationPermission(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    typeof DeviceOrientationEvent ===
      "undefined"
  ) {
    return false;
  }

  const constructor =
    DeviceOrientationEvent as
      OrientationPermissionConstructor;

  if (!constructor.requestPermission) {
    return true;
  }

  return (
    await constructor.requestPermission()
  ) === "granted";
}

export function getHeadingFromOrientation(
  event: DeviceOrientationEvent
): NormalizedHeading | null {
  const compassEvent =
    event as CompassOrientationEvent;

  if (
    typeof compassEvent.webkitCompassHeading ===
      "number" &&
    Number.isFinite(
      compassEvent.webkitCompassHeading
    )
  ) {
    return {
      degrees: normalizeDegrees(
        compassEvent.webkitCompassHeading
      ),
      isAbsolute: true,
    };
  }

  if (
    typeof event.alpha !== "number" ||
    typeof event.beta !== "number" ||
    typeof event.gamma !== "number" ||
    !Number.isFinite(event.alpha) ||
    !Number.isFinite(event.beta) ||
    !Number.isFinite(event.gamma)
  ) {
    return null;
  }

  return {
    degrees: calculateArCompassHeading(
      event.alpha,
      event.beta,
      event.gamma
    ),
    isAbsolute: event.absolute === true,
  };
}

export function smoothArHeading(
  previousDegrees: number | null,
  nextDegrees: number,
  strength = 0.1
): number {
  if (previousDegrees === null) {
    return normalizeDegrees(nextDegrees);
  }

  const difference =
    getSignedAngleDifference(
      nextDegrees,
      previousDegrees
    );

  /*
   * El magnetómetro suele oscilar incluso con el teléfono quieto.
   * Conservamos un pequeño punto muerto y limitamos cada corrección
   * para que la escena no salte de lado a lado.
   */
  if (Math.abs(difference) < 1.5) {
    return normalizeDegrees(
      previousDegrees
    );
  }

  const step = Math.max(
    -4,
    Math.min(4, difference * strength)
  );

  return normalizeDegrees(
    previousDegrees + step
  );
}

export function stabilizeArCoordinates(
  previous: ArCoordinates | null,
  next: ArCoordinates
): ArCoordinates | null {
  const nextAccuracy =
    next.accuracyMeters ??
    Number.POSITIVE_INFINITY;

  if (
    !Number.isFinite(nextAccuracy) ||
    nextAccuracy >
      AR_REQUIRED_ACCURACY_METERS
  ) {
    return previous;
  }

  if (!previous) {
    return next;
  }

  const previousAccuracy =
    previous.accuracyMeters ??
    AR_REQUIRED_ACCURACY_METERS;

  const displacement =
    calculateArDistanceMeters(
      previous,
      next
    );

  if (
    nextAccuracy >
      previousAccuracy * 1.6 &&
    displacement <= nextAccuracy
  ) {
    return previous;
  }

  if (displacement < 1.25) {
    return {
      ...previous,
      accuracyMeters: Math.min(
        previousAccuracy,
        nextAccuracy
      ),
    };
  }

  const strength =
    displacement >
    Math.max(
      previousAccuracy,
      nextAccuracy
    )
      ? 0.5
      : 0.14;

  return {
    latitude:
      previous.latitude +
      (next.latitude -
        previous.latitude) *
        strength,
    longitude:
      previous.longitude +
      (next.longitude -
        previous.longitude) *
        strength,
    accuracyMeters: Math.min(
      previousAccuracy,
      nextAccuracy
    ),
  };
}

export async function requestRearCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "camera-not-supported"
    );
  }

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: {
        ideal: "environment",
      },
      width: {
        ideal: 1280,
      },
      height: {
        ideal: 720,
      },
    },
  });
}

export function stopArCameraStream(
  stream: MediaStream | null
) {
  stream?.getTracks().forEach(
    (track) => track.stop()
  );
}
