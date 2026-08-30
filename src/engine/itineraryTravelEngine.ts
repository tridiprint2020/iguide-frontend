export type ItineraryTravelMode =
  | "walking"
  | "transport"
  | "taxi";

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export const WALKING_SPEED_KMH = 4.5;
export const ROUTE_DISTANCE_FACTOR = 1.3;

export const TRAVEL_SPEED_KMH: Record<
  ItineraryTravelMode,
  number
> = {
  walking: WALKING_SPEED_KMH,
  transport: 15,
  taxi: 24,
};

export const FALLBACK_TRAVEL_MINUTES: Record<
  ItineraryTravelMode,
  number
> = {
  walking: 15,
  transport: 12,
  taxi: 8,
};

const EARTH_RADIUS_KM = 6371;

function isValidPoint(
  point: GeoPoint | null | undefined
): point is GeoPoint {
  return Boolean(
    point &&
      Number.isFinite(point.latitude) &&
      Number.isFinite(point.longitude) &&
      Math.abs(point.latitude) <= 90 &&
      Math.abs(point.longitude) <= 180
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function getHaversineDistanceKm(
  from: GeoPoint,
  to: GeoPoint
): number {
  const latitudeDelta = toRadians(
    to.latitude - from.latitude
  );
  const longitudeDelta = toRadians(
    to.longitude - from.longitude
  );
  const fromLatitude = toRadians(
    from.latitude
  );
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.asin(Math.min(1, Math.sqrt(haversine)))
  );
}

export function estimateTravelMinutes(
  from: GeoPoint | null | undefined,
  to: GeoPoint | null | undefined,
  mode: ItineraryTravelMode
): number {
  if (!isValidPoint(from) || !isValidPoint(to)) {
    return FALLBACK_TRAVEL_MINUTES[mode];
  }

  const distanceKm =
    getHaversineDistanceKm(from, to) *
    ROUTE_DISTANCE_FACTOR;
  const rawMinutes =
    (distanceKm / TRAVEL_SPEED_KMH[mode]) * 60;

  return Math.max(2, Math.round(rawMinutes));
}
