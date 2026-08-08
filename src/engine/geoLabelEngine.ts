import { ExperienceEngine } from "./experienceEngine";
import type { Experience } from "../types/experience/experience";
import { tx } from "../i18n";

export interface GeoLabel {
  text: string;
  nearest: Experience | null;
}

function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getGeoLabel(
  lat: number,
  lng: number
): GeoLabel {

  let nearest: Experience | null = null;
  let minDistance = Infinity;

  for (const experience of ExperienceEngine.getAll()) {

    const d = calculateDistanceMeters(
      lat,
      lng,
      experience.latitude,
      experience.longitude
    );

    if (d < minDistance) {
      minDistance = d;
      nearest = experience;
    }
  }

  if (!nearest || minDistance > 3000) {
    return {
      text: tx("Un rincón del Valle del Mantaro"),
      nearest: null,
    };
  }

  const minutes = Math.max(1, Math.round(minDistance / 80));

  return {
    text: tx("A {{minutes}} min de {{title}}", { minutes, title: nearest.title }),
    nearest,
  };
}
