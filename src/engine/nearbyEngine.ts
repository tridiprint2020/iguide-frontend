import type { Experience } from "../types/experience";
import { getHaversineDistanceKm } from "./itineraryTravelEngine";
export function withinNearbyRadius(experiences: Experience[], origin: { latitude: number; longitude: number }, radiusKm: number) {
  return experiences.map(experience => ({ experience, distance: getHaversineDistanceKm(origin, experience) }))
    .filter(item => Number.isFinite(item.distance) && item.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}
