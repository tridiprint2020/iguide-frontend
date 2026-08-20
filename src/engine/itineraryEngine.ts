import { catalog } from "../data/catalog";
import type {
  Experience,
} from "../types/experience";
import {
  isExpedition,
} from "../types/experience";
import type {
  ExplorerContext,
} from "../types/explorerContext";
import type {
  Interest,
} from "../types/interest";
import type {
  ItineraryDecisionAction,
  ItineraryExclusion,
  ItineraryPlan,
  ItineraryReasonCode,
  ItineraryStop,
} from "../types/itinerary";
import {
  getExperienceSafetyReason,
  getSafeCandidates,
} from "./experienceSafetyEngine";
import type {
  ExperienceSafetyReason,
} from "./experienceSafetyEngine";
import type {
  WeatherForecastDay,
  WeatherStatus,
} from "./weatherEngine";

const DAY_END_MINUTES = 21 * 60;
const MAX_STOPS = 8;
const FULL_DAY_MINUTES = 6 * 60;

export interface ItineraryBuildOptions {
  forecast?: WeatherForecastDay | null;
  experiences?: Experience[];
  excludedExperienceIds?: string[];
  action?: Exclude<
    ItineraryDecisionAction,
    "excluded"
  >;
}

function parseDurationMinutes(
  text?: string
): number | null {
  if (!text) return null;

  const match = text.match(/(\d+(?:[.,]\d+)?)/);

  if (!match) return null;

  const value = Number(
    match[1].replace(",", ".")
  );

  if (!Number.isFinite(value)) {
    return null;
  }

  if (/hora|hour/i.test(text)) {
    return Math.round(value * 60);
  }

  return Math.round(value);
}

function getVisitMinutes(
  experience: Experience
): number {
  const expeditionDuration =
    isExpedition(experience)
      ? parseDurationMinutes(
          experience.duration
        )
      : null;

  return Math.max(
    30,
    expeditionDuration ??
      experience.estimatedVisitMinutes ??
      90
  );
}

function getTravelMinutes(
  experience: Experience,
  context: ExplorerContext
): number | null {
  const transport =
    context.answers?.transport ??
    "walking";

  if (!isExpedition(experience)) {
    if (transport === "taxi") return 8;
    if (transport === "transport") return 12;
    return 15;
  }

  if (transport === "walking") {
    return parseDurationMinutes(
      experience.walkTime
    );
  }

  const driveMinutes =
    parseDurationMinutes(
      experience.driveTime
    );

  if (driveMinutes === null) {
    return null;
  }

  return transport === "transport"
    ? driveMinutes + 10
    : driveMinutes;
}

function getOpeningWindow(
  experience: Experience
): {
  opensAt: number;
  closesAt: number;
} | null {
  if (
    !("openingHours" in experience) ||
    typeof experience.openingHours !==
      "string"
  ) {
    return null;
  }

  const match =
    experience.openingHours.match(
      /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/
    );

  if (!match) return null;

  const opensAt =
    Number(match[1]) * 60 +
    Number(match[2]);

  let closesAt =
    Number(match[3]) * 60 +
    Number(match[4]);

  if (closesAt <= opensAt) {
    closesAt += 24 * 60;
  }

  return {
    opensAt,
    closesAt,
  };
}

function createSelectedDate(
  selectedDate: string,
  selectedHour: number
): Date | null {
  const match =
    selectedDate.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (
    !match ||
    !Number.isInteger(selectedHour) ||
    selectedHour < 0 ||
    selectedHour > 23
  ) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const result = new Date(
    year,
    month - 1,
    day,
    selectedHour,
    0,
    0,
    0
  );

  if (
    result.getFullYear() !== year ||
    result.getMonth() !== month - 1 ||
    result.getDate() !== day ||
    result.getHours() !== selectedHour
  ) {
    return null;
  }

  return result;
}

function forecastToWeatherStatus(
  forecast: WeatherForecastDay | null
): WeatherStatus | null {
  if (!forecast) return null;

  return {
    city: forecast.city,
    condition: forecast.condition,
    temperature: Math.round(
      (forecast.temperatureMin +
        forecast.temperatureMax) /
        2
    ),
    precipitationProbabilityNext3Hours:
      forecast.precipitationProbability,
    windSpeedKmh:
      forecast.windSpeedKmh,
    isHighMountainSafe:
      forecast.isHighMountainSafe,
  };
}

function matchesPriority(
  experience: Experience,
  priority: string
): boolean {
  const knownInterest = [
    "photography",
    "adventure",
    "gastronomy",
    "family",
    "couples",
    "backpacker",
    "nightlife",
  ].includes(priority)
    ? (priority as Interest)
    : null;

  if (
    knownInterest &&
    experience.interests?.includes(
      knownInterest
    )
  ) {
    return true;
  }

  if (isExpedition(experience)) {
    return (
      knownInterest !== null &&
      experience.affinity[
        knownInterest
      ] > 50
    );
  }

  if (priority === "gastronomy") {
    return ["restaurant", "cafe"].includes(
      experience.type
    );
  }

  if (priority === "nightlife") {
    return ["bar", "nightclub"].includes(
      experience.type
    );
  }

  if (priority === "photography") {
    return experience.tags.some((tag) =>
      [
        "fotografía",
        "photography",
        "mirador",
        "atardecer",
      ].includes(tag.toLowerCase())
    );
  }

  return priority === "surprise";
}

function scoreExperience(
  experience: Experience,
  context: ExplorerContext
): number {
  const answers = context.answers;

  if (!answers) return 0;

  let score = matchesPriority(
    experience,
    answers.priority
  )
    ? 100
    : 0;

  if (isExpedition(experience)) {
    const priority =
      answers.priority as Interest;

    if (priority in experience.affinity) {
      score +=
        experience.affinity[priority] * 2;
    }

    if (answers.companions === "family") {
      score += experience.affinity.family;
    }

    if (answers.companions === "couple") {
      score += experience.affinity.couples;
    }

    if (answers.companions === "friends") {
      score +=
        experience.affinity.backpacker;
    }

    const walkingMinutes =
      parseDurationMinutes(
        experience.walkTime
      );

    if (
      answers.transport === "walking" &&
      (walkingMinutes === null ||
        walkingMinutes > 20)
    ) {
      score -= 40;
    }

    if (
      answers.transport !== "taxi" &&
      !answers.hasCar
    ) {
      const driveMinutes =
        parseDurationMinutes(
          experience.driveTime
        );

      if (
        driveMinutes === null ||
        driveMinutes > 20
      ) {
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

  for (const interest of context.profile
    .interests) {
    if (
      experience.interests?.includes(
        interest
      )
    ) {
      score += 10;
    }
  }

  return score;
}

function isWetForecast(
  forecast: WeatherForecastDay
): boolean {
  return (
    forecast.condition === "rain" ||
    forecast.condition === "drizzle" ||
    forecast.condition === "snow" ||
    forecast.precipitationProbability >= 40
  );
}

function getRecommendationReason(
  forecast: WeatherForecastDay | null,
  score: number,
  visitMinutes: number
): ItineraryReasonCode {
  if (visitMinutes >= FULL_DAY_MINUTES) {
    return "full-day-experience";
  }

  if (forecast === null) {
    return "weather-unknown-conservative";
  }

  if (isWetForecast(forecast)) {
    return "indoor-priority";
  }

  return score > 0
    ? "interest-match"
    : "weather-compatible";
}

function safetyReasonToItineraryReason(
  reason: Exclude<
    ExperienceSafetyReason,
    "inactive"
  >
): ItineraryReasonCode {
  return reason;
}

function createExclusion(
  experience: Experience,
  reasonCode: ItineraryReasonCode,
  params?: Record<
    string,
    string | number | boolean
  >
): ItineraryExclusion {
  return {
    experienceId:
      experience.experienceId,
    title: experience.title,
    explanation: {
      action: "excluded",
      reasonCode,
      params,
    },
  };
}

/**
 * Itinerary Engine v2.
 *
 * Recibe una fotografía del pronóstico ya resuelta, aplica el motor
 * neutral de seguridad, acumula traslado + visita + horarios reales
 * disponibles y devuelve razones estructuradas para UI y Hospes.
 */
export function buildItineraryPlan(
  context: ExplorerContext,
  options: ItineraryBuildOptions = {}
): ItineraryPlan | null {
  const answers = context.answers;

  if (!answers) return null;

  const selectedDate =
    createSelectedDate(
      answers.selectedDate,
      answers.selectedHour
    );

  if (!selectedDate) return null;

  const startMinutes =
    answers.selectedHour * 60;
  const availableMinutes = Math.max(
    0,
    DAY_END_MINUTES - startMinutes
  );
  const forecast =
    options.forecast ?? null;
  const weather =
    forecastToWeatherStatus(forecast);
  const excludedIds = new Set(
    options.excludedExperienceIds ?? []
  );
  const visitedIds = new Set(
    context.profile.visitedExperiences
  );
  const source =
    options.experiences ?? catalog;

  const relevantExperiences =
    source.filter(
      (experience) =>
        experience.isActive !== false &&
        experience.type !== "hotel" &&
        !visitedIds.has(
          experience.experienceId
        ) &&
        !excludedIds.has(
          experience.experienceId
        )
    );

  const safeCandidates =
    getSafeCandidates(
      relevantExperiences,
      {
        profile: context.profile,
        weather,
        currentDate: selectedDate,
      }
    );
  const safeIds = new Set(
    safeCandidates.map(
      (experience) =>
        experience.experienceId
    )
  );
  const exclusions: ItineraryExclusion[] =
    [];

  for (const experience of
    relevantExperiences) {
    if (safeIds.has(experience.experienceId)) {
      continue;
    }

    const reason =
      getExperienceSafetyReason(
        experience,
        weather,
        selectedDate
      );

    if (reason && reason !== "inactive") {
      exclusions.push(
        createExclusion(
          experience,
          safetyReasonToItineraryReason(
            reason
          ),
          forecast
            ? {
                precipitationProbability:
                  forecast.precipitationProbability,
                windSpeedKmh:
                  forecast.windSpeedKmh,
              }
            : undefined
        )
      );
    }
  }

  const scored = safeCandidates
    .map((experience, index) => ({
      experience,
      index,
      score: scoreExperience(
        experience,
        context
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.index - b.index
    );

  const stops: ItineraryStop[] = [];
  let cursor = startMinutes;

  for (const candidate of scored) {
    if (stops.length >= MAX_STOPS) {
      break;
    }

    const { experience, score } =
      candidate;
    const visitMinutes =
      getVisitMinutes(experience);
    const isFullDay =
      visitMinutes >= FULL_DAY_MINUTES;
    const travelMinutes =
      getTravelMinutes(
        experience,
        context
      );

    if (travelMinutes === null) {
      exclusions.push(
        createExclusion(
          experience,
          "transport-incompatible"
        )
      );
      continue;
    }

    if (isFullDay && stops.length > 0) {
      exclusions.push(
        createExclusion(
          experience,
          "full-day-conflict",
          { visitMinutes }
        )
      );
      continue;
    }

    const openingWindow =
      getOpeningWindow(experience);
    let visitStart =
      cursor + travelMinutes;

    if (
      openingWindow &&
      visitStart < openingWindow.opensAt
    ) {
      visitStart = openingWindow.opensAt;
    }

    const visitEnd =
      visitStart + visitMinutes;

    if (
      openingWindow &&
      (visitStart >=
        openingWindow.closesAt ||
        visitEnd >
          openingWindow.closesAt)
    ) {
      exclusions.push(
        createExclusion(
          experience,
          "outside-opening-hours",
          {
            opensAt:
              openingWindow.opensAt,
            closesAt:
              openingWindow.closesAt,
          }
        )
      );
      continue;
    }

    if (visitEnd > DAY_END_MINUTES) {
      exclusions.push(
        createExclusion(
          experience,
          "not-enough-time",
          {
            requiredMinutes:
              visitEnd - cursor,
            remainingMinutes:
              Math.max(
                0,
                DAY_END_MINUTES - cursor
              ),
          }
        )
      );
      continue;
    }

    stops.push({
      experience,
      startMinutes: visitStart,
      endMinutes: visitEnd,
      travelMinutes,
      visitMinutes,
      explanation: {
        action:
          options.action ??
          "recommended",
        reasonCode:
          getRecommendationReason(
            forecast,
            score,
            visitMinutes
          ),
        params: {
          priority: answers.priority,
          visitMinutes,
          ...(forecast
            ? {
                precipitationProbability:
                  forecast.precipitationProbability,
                windSpeedKmh:
                  forecast.windSpeedKmh,
              }
            : {}),
        },
      },
    });

    cursor = visitEnd;

    if (isFullDay) {
      break;
    }
  }

  return {
    selectedDate: answers.selectedDate,
    selectedHour: answers.selectedHour,
    availableMinutes,
    totalDurationMinutes:
      stops.length > 0
        ? stops[
            stops.length - 1
          ].endMinutes - startMinutes
        : 0,
    forecast: forecast
      ? { ...forecast }
      : null,
    stops,
    exclusions,
  };
}

/**
 * Adaptador temporal para consumidores legacy. La interfaz nueva debe
 * usar buildItineraryPlan para conservar horarios y explicaciones.
 */
export function buildItinerary(
  context: ExplorerContext
): Experience[] {
  return (
    buildItineraryPlan(context)?.stops.map(
      (stop) => stop.experience
    ) ?? []
  );
}
