import { catalog } from "../data/catalog";
import type { Experience } from "../types/experience";
import { isExpedition } from "../types/experience";
import type { Interest } from "../types/interest";
import type { ExplorerContext } from "../types/explorerContext";

function parseMinutes(text?: string): number {
  if (!text) return Infinity;
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
}

/**
 * Calcula cuántas horas reales de exploración tiene el usuario
 * a partir del día y la hora que eligió en el calendario.
 *
 * Si el día elegido es hoy, se resta la hora actual del cierre
 * habitual de actividades (21:00). Si es un día futuro, se asume
 * jornada completa disponible desde las 8am.
 *
 * Reemplaza la antigua pregunta "¿Cuánto tiempo tienes?".
 */
function calculateAvailableHours(
  selectedDate: string,
  selectedHour: number
): number {
  const DAY_END_HOUR = 21;
  const FULL_DAY_START_HOUR = 8;

  const todayIso = new Date()
    .toISOString()
    .slice(0, 10);

  if (selectedDate === todayIso) {
    return Math.max(
      1,
      DAY_END_HOUR - selectedHour
    );
  }

  return DAY_END_HOUR - FULL_DAY_START_HOUR;
}

function placesForAvailableHours(
  hours: number
): number {
  if (hours <= 2) return 2;
  if (hours <= 5) return 4;
  if (hours <= 8) return 6;
  return Math.min(8, catalog.length);
}

export function buildItinerary(
  context: ExplorerContext
): Experience[] {
  const { profile, answers } = context;
  if (!answers) return [];

  const candidates = catalog.filter(
    (e) =>
      !profile.visitedExperiences.includes(
        e.experienceId
      )
  );

  const scored = candidates.map(
    (experience) => {
      let score = 0;

      if (isExpedition(experience)) {
        const affinity = experience.affinity;
        const priorityKey =
          answers.priority as Interest;

        if (priorityKey in affinity) {
          score += affinity[priorityKey] * 2;
        }

        if (answers.companions === "family") {
          score += affinity.family;
        }
        if (answers.companions === "couple") {
          score += affinity.couples;
        }
        if (answers.companions === "friends") {
          score += affinity.backpacker;
        }

        const walkMinutes = parseMinutes(
          experience.walkTime
        );

        const movingOnFoot =
          answers.transport === "walking";

        if (movingOnFoot && walkMinutes > 20) {
          score -= 40;
        }
        if (!movingOnFoot && walkMinutes <= 20) {
          score += 10;
        }

        if (
          answers.transport !== "taxi" &&
          !answers.hasCar
        ) {
          const driveMinutes = parseMinutes(
            experience.driveTime
          );
          if (driveMinutes > 20) {
            score -= 30;
          }
        }

        if (
          answers.budget === "budget" &&
          experience.price !== "Gratis"
        ) {
          score -= 25;
        }
      }

      return { experience, score };
    }
  );

  scored.sort((a, b) => b.score - a.score);

  const availableHours =
    calculateAvailableHours(
      answers.selectedDate,
      answers.selectedHour
    );

  const limit =
    placesForAvailableHours(availableHours);

  return scored
    .slice(0, limit)
    .map((s) => s.experience);
}