import {
  normalizeDegrees,
} from "./arGeoEngine";

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
    !Number.isFinite(event.alpha)
  ) {
    return null;
  }

  const screenAngle =
    window.screen.orientation?.angle ??
    0;

  return {
    degrees: normalizeDegrees(
      360 - event.alpha + screenAngle
    ),
    isAbsolute: event.absolute === true,
  };
}

export function smoothArHeading(
  previousDegrees: number | null,
  nextDegrees: number,
  strength = 0.2
): number {
  if (previousDegrees === null) {
    return normalizeDegrees(nextDegrees);
  }

  const previousRadians =
    previousDegrees * Math.PI / 180;

  const nextRadians =
    nextDegrees * Math.PI / 180;

  const x =
    (1 - strength) *
      Math.cos(previousRadians) +
    strength * Math.cos(nextRadians);

  const y =
    (1 - strength) *
      Math.sin(previousRadians) +
    strength * Math.sin(nextRadians);

  return normalizeDegrees(
    Math.atan2(y, x) * 180 / Math.PI
  );
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
