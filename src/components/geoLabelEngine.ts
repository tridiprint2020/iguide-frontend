// Definición de hitos urbanos de Huancayo de referencia para Hospes
const HUANCAYO_LANDMARKS = [
  { name: "Plaza Constitución", lat: -12.0681, lng: -75.2100 },
  { name: "Parque de la Identidad Wanka", lat: -12.0490, lng: -75.1975 },
  { name: "Cerrito de la Libertad", lat: -12.0623, lng: -75.1958 },
  { name: "Torre Torre", lat: -12.0597, lng: -75.1810 }
];

function calculateHaversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Traduce coordenadas matemáticas crudas a una etiqueta humana descriptiva de proximidad urbana.
 */
export function getHumanGeoLabel(lat?: number, lng?: number): string {
  if (lat === undefined || lng === undefined) return "Rincón secreto del Valle";

  let closestLandmark = HUANCAYO_LANDMARKS[0];
  let minDistance = calculateHaversine(lat, lng, closestLandmark.lat, closestLandmark.lng);

  for (let i = 1; i < HUANCAYO_LANDMARKS.length; i++) {
    const dist = calculateHaversine(lat, lng, HUANCAYO_LANDMARKS[i].lat, HUANCAYO_LANDMARKS[i].lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestLandmark = HUANCAYO_LANDMARKS[i];
    }
  }

  // Estimar el tiempo caminando basado en un ritmo urbano estándar (1 km = 12 minutos)
  const minutesWalking = Math.max(1, Math.round(minDistance * 12));

  if (minDistance < 0.1) {
    return `En plena ${closestLandmark.name}`;
  }
  return `A ${minutesWalking} min a pie de la ${closestLandmark.name}`;
}
