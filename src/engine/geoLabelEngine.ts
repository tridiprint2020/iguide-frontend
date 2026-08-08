import { tx } from "../i18n";

export interface GeoLandmark {
  name: string;
  lat: number;
  lng: number;
}

export interface GeoLabel {
  text: string;
  nearest: GeoLandmark | null;
}

const HUANCAYO_LANDMARKS: GeoLandmark[] = [
  {
    name: "Plaza Constitución",
    lat: -12.0681,
    lng: -75.21,
  },
  {
    name: "Parque de la Identidad Wanka",
    lat: -12.049,
    lng: -75.1975,
  },
  {
    name: "Cerrito de la Libertad",
    lat: -12.0623,
    lng: -75.1958,
  },
  {
    name: "Torre Torre",
    lat: -12.0597,
    lng: -75.181,
  },
];

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

  let nearest: GeoLandmark | null = null;
  let minDistance = Infinity;

  for (const landmark of HUANCAYO_LANDMARKS) {

    const d = calculateDistanceMeters(
      lat,
      lng,
      landmark.lat,
      landmark.lng
    );

    if (d < minDistance) {
      minDistance = d;
      nearest = landmark;
    }
  }

  if (!nearest || minDistance > 3000) {
    return {
      text: tx("Un rincón del Valle del Mantaro"),
      nearest: null,
    };
  }

  if (minDistance < 100) {
    return {
      text: tx("En {{title}}", { title: nearest.name }),
      nearest,
    };
  }

  const minutes = Math.max(1, Math.round(minDistance / 80));

  return {
    text: tx("A {{minutes}} min a pie de {{title}}", {
      minutes,
      title: nearest.name,
    }),
    nearest,
  };
}
