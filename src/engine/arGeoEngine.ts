import type {
  Experience,
} from "../types/experience";

import type {
  ArCoordinates,
  ArGeoPlacement,
} from "../types/ar";

const EARTH_RADIUS_METERS =
  6_371_000;

export const AR_MAXIMUM_DISTANCE_METERS =
  150;

function toRadians(
  degrees: number
): number {
  return degrees * Math.PI / 180;
}

function toDegrees(
  radians: number
): number {
  return radians * 180 / Math.PI;
}

export function normalizeDegrees(
  value: number
): number {
  return ((value % 360) + 360) % 360;
}

export function getSignedAngleDifference(
  targetDegrees: number,
  originDegrees: number
): number {
  return (
    normalizeDegrees(
      targetDegrees -
      originDegrees +
      180
    ) - 180
  );
}

export function calculateArDistanceMeters(
  from: ArCoordinates,
  to: ArCoordinates
): number {
  const fromLatitude =
    toRadians(from.latitude);

  const toLatitude =
    toRadians(to.latitude);

  const latitudeDelta =
    toRadians(
      to.latitude - from.latitude
    );

  const longitudeDelta =
    toRadians(
      to.longitude - from.longitude
    );

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    )
  );
}

export function calculateArBearingDegrees(
  from: ArCoordinates,
  to: ArCoordinates
): number {
  const fromLatitude =
    toRadians(from.latitude);

  const toLatitude =
    toRadians(to.latitude);

  const longitudeDelta =
    toRadians(
      to.longitude - from.longitude
    );

  const y =
    Math.sin(longitudeDelta) *
    Math.cos(toLatitude);

  const x =
    Math.cos(fromLatitude) *
      Math.sin(toLatitude) -
    Math.sin(fromLatitude) *
      Math.cos(toLatitude) *
      Math.cos(longitudeDelta);

  return normalizeDegrees(
    toDegrees(Math.atan2(y, x))
  );
}

export type ArWorldCoordinates = {
  x: number;
  z: number;
};

/**
 * Proyecta una distancia y rumbo sobre el plano local de la escena.
 * No comprime ni aproxima el radio: el origen continúa siendo la
 * coordenada GPS de referencia y el resultado conserva la distancia.
 */
export function projectArDistanceToWorld(
  distanceMeters: number,
  relativeBearingDegrees: number
): ArWorldCoordinates {
  const angle =
    toRadians(
      relativeBearingDegrees
    );
  const distance = Math.max(
    0,
    distanceMeters
  );

  return {
    x: Math.sin(angle) * distance,
    z: -Math.cos(angle) * distance,
  };
}

export function projectArPlacementToWorld(
  placement: ArGeoPlacement
): ArWorldCoordinates {
  return projectArDistanceToWorld(
    placement.spatialDistanceMeters ??
      placement.distanceMeters,
    placement.relativeBearingDegrees
  );
}

export function calculateArViewerWorldPosition(
  referenceCoordinates: ArCoordinates,
  viewerCoordinates: ArCoordinates,
  referenceHeadingDegrees: number
): ArWorldCoordinates {
  const distanceMeters =
    calculateArDistanceMeters(
      referenceCoordinates,
      viewerCoordinates
    );
  const bearingDegrees =
    calculateArBearingDegrees(
      referenceCoordinates,
      viewerCoordinates
    );

  return projectArDistanceToWorld(
    distanceMeters,
    getSignedAngleDifference(
      bearingDegrees,
      referenceHeadingDegrees
    )
  );
}

function hasUsableCoordinates(
  experience: Experience
): boolean {
  return (
    Number.isFinite(
      experience.latitude
    ) &&
    Number.isFinite(
      experience.longitude
    ) &&
    Math.abs(experience.latitude) <= 90 &&
    Math.abs(experience.longitude) <= 180
  );
}

/**
 * Proyección geográfica pura. Usa todo el catálogo activo recibido,
 * limita únicamente el rango visual y nunca certifica llegada.
 */
export function getArGeoPlacements(
  experiences: Experience[],
  userCoordinates: ArCoordinates,
  headingDegrees: number,
  options: {
    maximumDistanceMeters?: number;
    alwaysIncludeExperienceId?:
      string | null;
  } = {}
): ArGeoPlacement[] {
  const maximumDistanceMeters =
    options.maximumDistanceMeters ??
    AR_MAXIMUM_DISTANCE_METERS;

  return experiences
    .filter(
      (experience) =>
        experience.isActive !== false &&
        hasUsableCoordinates(experience)
    )
    .map((experience) => {
      const destination = {
        latitude:
          experience.latitude,
        longitude:
          experience.longitude,
      };

      const distanceMeters =
        calculateArDistanceMeters(
          userCoordinates,
          destination
        );

      const bearingDegrees =
        calculateArBearingDegrees(
          userCoordinates,
          destination
        );

      return {
        experience,
        distanceMeters,
        bearingDegrees,
        relativeBearingDegrees:
          getSignedAngleDifference(
            bearingDegrees,
            headingDegrees
          ),
      };
    })
    /*
     * El destino activo puede orientar desde lejos, pero esta excepción
     * es únicamente visual: nunca certifica una llegada.
     */
    .filter(
      (placement) =>
        placement.distanceMeters <=
          maximumDistanceMeters ||
        placement.experience
          .experienceId ===
          options.alwaysIncludeExperienceId
    )
    .sort(
      (first, second) =>
        first.distanceMeters -
        second.distanceMeters
    );
}

export function formatArDistance(
  distanceMeters: number
): string {
  if (distanceMeters < 1000) {
    return `${Math.max(
      1,
      Math.round(distanceMeters)
    )} m`;
  }

  return `${(
    distanceMeters / 1000
  ).toFixed(1)} km`;
}
