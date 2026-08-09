import { tx } from "../i18n";

type Landmark = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
};

export interface GeoLabel {
  text: string;
  nearest: Landmark | null;
}

/*
 * Referencias editoriales de Hospes. Esta lista es intencionalmente
 * cerrada: restaurantes, bares, hoteles y comercios nunca deben usarse
 * para explicar dónde ocurrió un recuerdo.
 */
const HUANCAYO_LANDMARKS: Landmark[] = [
  {
    id: "plaza-constitucion",
    title: "Plaza Constitución",
    latitude: -12.0681,
    longitude: -75.21,
  },
  {
    id: "catedral-huancayo",
    title: "Catedral de Huancayo",
    latitude: -12.06872,
    longitude: -75.21042,
  },
  {
    id: "municipalidad-huancayo",
    title: "Municipalidad Provincial de Huancayo",
    latitude: -12.07082,
    longitude: -75.20892,
  },
  {
    id: "parque-identidad",
    title: "Parque de la Identidad Wanka",
    latitude: -12.049023174423558,
    longitude: -75.19757160263275,
  },
  {
    id: "cerrito-libertad",
    title: "Cerrito de la Libertad",
    latitude: -12.062310384184709,
    longitude: -75.19583169502478,
  },
];

function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earthRadiusMeters = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

export function getGeoLabel(
  lat: number,
  lng: number
): GeoLabel {
  let nearest: Landmark | null = null;
  let minDistance = Infinity;

  for (const landmark of HUANCAYO_LANDMARKS) {
    const distance = calculateDistanceMeters(
      lat,
      lng,
      landmark.latitude,
      landmark.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = landmark;
    }
  }

  if (!nearest || minDistance > 3000) {
    return {
      text: tx("Un rincón del Valle del Mantaro"),
      nearest: null,
    };
  }

  if (minDistance < 80) {
    return {
      text: tx("Junto a {{title}}", { title: nearest.title }),
      nearest,
    };
  }

  const minutes = Math.max(1, Math.round(minDistance / 80));

  return {
    text: tx("A {{minutes}} min de {{title}}", {
      minutes,
      title: nearest.title,
    }),
    nearest,
  };
}
