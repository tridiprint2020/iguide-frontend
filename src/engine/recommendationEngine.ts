import { catalog } from "../data/catalog";
import type { Experience } from "../types/experience";
import type { ExplorerContext } from "../types/explorerContext";
import { isExpedition } from "../types/experience";
import {
  getExplicitIntentScore,
  getProfilePreferenceScore,
  isEligibleForExplicitIntents,
} from "./experienceIntentEngine";
import {
  getSafeCandidates,
} from "./experienceSafetyEngine";
import {
  canCompleteVisitNow,
  hasRecommendableSchedule,
} from "./experienceScheduleEngine";
import {
  getHaversineDistanceKm,
} from "./itineraryTravelEngine";
import type {
  WeatherStatus,
} from "./weatherEngine";

export interface RecommendationOptions {
  experiences?: Experience[];
  weather?: WeatherStatus | null;
  currentDate?: Date;
}

function createPlanningDate(
  context: ExplorerContext,
  fallback: Date
): Date {
  const answers = context.answers;

  if (!answers) return fallback;

  const match = answers.selectedDate.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return fallback;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    answers.selectedHour,
    0,
    0,
    0
  );

  return Number.isNaN(date.getTime())
    ? fallback
    : date;
}

function getDistanceKm(
  experience: Experience,
  context: ExplorerContext
): number {
  if (!context.location) {
    return Number.POSITIVE_INFINITY;
  }

  return getHaversineDistanceKm(
    context.location,
    {
      latitude: experience.latitude,
      longitude: experience.longitude,
    }
  );
}

/**
 * Ranking compartido por las superficies de Hospes.
 *
 * El orden siempre es:
 * categoría explícita -> datos/horario -> seguridad -> preferencia -> cercanía.
 * Ningún puntaje puede recuperar un candidato que falló un filtro duro.
 */
function rankExperiences(
  context: ExplorerContext,
  options: RecommendationOptions = {}
) {
  const { profile, answers } = context;
  const priorities = answers?.priorities ?? [];
  const currentDate = createPlanningDate(
    context,
    options.currentDate ?? new Date()
  );
  const source = options.experiences ?? catalog;
  const intentCandidates = source.filter(
    (experience) =>
      experience.isActive !== false &&
      experience.type !== "hotel" &&
      hasRecommendableSchedule(experience) &&
      (
        priorities.length === 0 ||
        isEligibleForExplicitIntents(
          experience,
          priorities
        )
      )
  );
  const openCandidates = intentCandidates.filter(
    (experience) =>
      canCompleteVisitNow(
        experience,
        currentDate
      )
  );
  const candidates = getSafeCandidates(
    openCandidates,
    {
      profile,
      weather: options.weather ?? null,
      currentDate,
    }
  );

  return candidates
    .map((experience, index) => {
      let score = getExplicitIntentScore(
        experience,
        priorities
      ).score;

      if (isExpedition(experience)) {
        const affinity = experience.affinity;

        score +=
          affinity.firstTimeVisitor *
          (profile.firstVisit ? 1 : 0);
        score +=
          affinity.family *
          (profile.travelMode === "family" ? 1 : 0);
        score +=
          affinity.couples *
          (profile.travelMode === "couple" ? 1 : 0);
      }

      score += getProfilePreferenceScore(
        experience,
        profile.interests
      );

      if (
        profile.visitedExperiences.includes(
          experience.experienceId
        )
      ) {
        score -= 100;
      }

      return {
        experience,
        score,
        distanceKm: getDistanceKm(
          experience,
          context
        ),
        index,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.distanceKm - b.distanceKm ||
        a.index - b.index
    );
}

export function getRecommendations(
  context: ExplorerContext,
  options: RecommendationOptions = {}
): Experience[] {
  return rankExperiences(
    context,
    options
  ).map((result) => result.experience);
}

export function getBestExperience(
  context: ExplorerContext,
  options: RecommendationOptions = {}
): Experience | null {
  return (
    rankExperiences(context, options)[0]
      ?.experience ?? null
  );
}
