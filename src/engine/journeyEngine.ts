import type { ActiveJourney } from "../types/journeyFlow";
import type { UserProfile } from "../types/user/user";
// 🏛️ Importación del motor de rastreo puro para obtener estadísticas del Timeline
import { getJourneyStats } from "./trackingEngine";

/**
 * Calcula los segundos transcurridos desde el inicio de la expedición
 */
export function calculateDuration(startedAt: number | null): number {
  if (!startedAt) return 0;
  return Math.floor((Date.now() - startedAt) / 1000);
}

/**
 * Incrementa de forma determinista la distancia basada en un factor de ritmo simulado
 */
export function simulateDistance(startedAt: number | null): number {
  if (!startedAt) return 0;
  const totalSeconds = calculateDuration(startedAt);
  // Simulación: un explorador camina aproximadamente 1.4 metros por segundo (0.0014 km)
  const simulatedKm = totalSeconds * 0.0014;
  return Math.round(simulatedKm * 100) / 100;
}

/**
 * Formatea los segundos transcurridos en una cadena legible de cronómetro (HH:MM:SS)
 */
export function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Genera de forma segura el payload base para la tarjeta Leica extrayendo
 * los datos calculados dinámicamente desde el Timeline de trackingEngine.
 */
export function buildBaseCardPayload(journey: ActiveJourney, currentNote: string) {
  const totalSeconds = calculateDuration(journey.startedAt);
  
  // 🏛️ Extraer métricas reales desde el único contenedor persistente del Timeline
 const stats =
  journey.timeline && journey.startedAt
    ? getJourneyStats(
        journey.timeline,
        journey.startedAt
      )
    : null;
  return {
    experienceTitle: journey.experience?.title || "Secreto del Valle",
    totalPhotos: stats?.totalPhotos ?? 0,
finalDistanceLabel:`${(stats?.totalDistanceKm ?? 0).toFixed(2)} km`,
    finalDurationLabel:
formatTimer(    stats?.durationSeconds ?? totalSeconds),
    latestPhrase: currentNote.trim() || "Un rincón que no aparece en los mapas.",
  };
}

/**
 * Compatibilidad con Hospes.
 * Calcula el porcentaje de exploración del usuario.
 */
export function getExplorationProgress(
  user: UserProfile,
  totalExperiences: number
): number {
  if (totalExperiences <= 0) {
    return 0;
  }

  const uniqueVisitedExperiences =
    new Set(user.visitedExperiences).size;

  const progress = Math.round(
    (uniqueVisitedExperiences /
      totalExperiences) *
      100
  );

  return Math.min(progress, 100);
}