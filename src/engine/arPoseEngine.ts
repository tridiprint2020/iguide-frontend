import * as THREE from "three";

import type {
  ArOrientationSample,
  ArQuaternion,
} from "../types/ar";

const DEVICE_CAMERA_ALIGNMENT =
  new THREE.Quaternion(
    -Math.sqrt(0.5),
    0,
    0,
    Math.sqrt(0.5)
  );

const DEVICE_AXIS_Z =
  new THREE.Vector3(0, 0, 1);

function toRadians(
  degrees: number
): number {
  return degrees * Math.PI / 180;
}

function toPlainQuaternion(
  quaternion: THREE.Quaternion
): ArQuaternion {
  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w,
  };
}

export function getScreenOrientationDegrees(): number {
  const modernAngle =
    window.screen.orientation?.angle;

  if (
    typeof modernAngle === "number" &&
    Number.isFinite(modernAngle)
  ) {
    return modernAngle;
  }

  const legacyWindow = window as
    typeof window & {
      orientation?: number;
    };

  return typeof legacyWindow.orientation ===
    "number"
    ? legacyWindow.orientation
    : 0;
}

export function getArOrientationSample(
  event: DeviceOrientationEvent
): ArOrientationSample | null {
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
    alphaDegrees: event.alpha,
    betaDegrees: event.beta,
    gammaDegrees: event.gamma,
    screenOrientationDegrees:
      getScreenOrientationDegrees(),
  };
}

/**
 * Convierte la orientación W3C del dispositivo a la misma convención
 * de cámara que usa Three.js. Mantener alpha, beta y gamma completos
 * evita que el video se incline mientras la escena permanece pegada
 * artificialmente al centro de la pantalla.
 */
export function getArDeviceQuaternion(
  sample: ArOrientationSample
): ArQuaternion {
  const euler = new THREE.Euler(
    toRadians(sample.betaDegrees),
    toRadians(sample.alphaDegrees),
    -toRadians(sample.gammaDegrees),
    "YXZ"
  );

  const quaternion =
    new THREE.Quaternion()
      .setFromEuler(euler)
      .multiply(DEVICE_CAMERA_ALIGNMENT)
      .multiply(
        new THREE.Quaternion()
          .setFromAxisAngle(
            DEVICE_AXIS_Z,
            -toRadians(
              sample.screenOrientationDegrees
            )
          )
      )
      .normalize();

  return toPlainQuaternion(quaternion);
}

/**
 * El heading absoluto se usa una sola vez para orientar el marco local.
 * Desde allí la vista sigue cambios relativos del teléfono, que son mucho
 * más estables que recolocar todos los objetos con cada lectura magnética.
 */
export function getRelativeArViewQuaternion(
  reference: ArOrientationSample,
  current: ArOrientationSample
): ArQuaternion {
  const referenceQuaternion =
    getArDeviceQuaternion(reference);

  const currentQuaternion =
    getArDeviceQuaternion(current);

  const relative =
    new THREE.Quaternion(
      referenceQuaternion.x,
      referenceQuaternion.y,
      referenceQuaternion.z,
      referenceQuaternion.w
    )
      .invert()
      .multiply(
        new THREE.Quaternion(
          currentQuaternion.x,
          currentQuaternion.y,
          currentQuaternion.z,
          currentQuaternion.w
        )
      )
      .normalize();

  return toPlainQuaternion(relative);
}

export function getArQuaternionAngleDegrees(
  quaternion: ArQuaternion
): number {
  const normalized = new THREE.Quaternion(
    quaternion.x,
    quaternion.y,
    quaternion.z,
    quaternion.w
  ).normalize();

  return normalized.angleTo(
    new THREE.Quaternion()
  ) * 180 / Math.PI;
}
