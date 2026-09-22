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
  WeatherForecastPeriod,
  WeatherStatus,
} from "./weatherEngine";
import {
  estimateTravelMinutes,
} from "./itineraryTravelEngine";
import {
  findNextMealWindow,
  explainMealConstraint,
  getWeatherPeriodKey,
  isOutdoorVisitAfterSunset,
} from "./itineraryTimePolicyEngine";
import type {
  MealSlot,
} from "./itineraryTimePolicyEngine";
import {
  getExperienceOpeningWindow,
  getScheduleReadiness,
  hasRecommendableSchedule,
} from "./experienceScheduleEngine";
import {
  getExplicitIntentScore,
  getProfilePreferenceScore,
  isEligibleForExplicitIntents,
} from "./experienceIntentEngine";

const MAX_STOPS = 5;
const MINUTES_PER_RECOMMENDED_STOP = 150;
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
  previousExperience: Experience | null,
  context: ExplorerContext
): number | null {
  const transport =
    context.answers?.transport ??
    "walking";

  const from = previousExperience
    ? {
        latitude: previousExperience.latitude,
        longitude: previousExperience.longitude,
      }
    : context.location ?? null;

  if (from) {
    return estimateTravelMinutes(
      from,
      {
        latitude: experience.latitude,
        longitude: experience.longitude,
      },
      transport
    );
  }

  if (isExpedition(experience) && transport === "walking") {
    return parseDurationMinutes(
      experience.walkTime
    );
  }

  if (isExpedition(experience)) {
    const driveMinutes = parseDurationMinutes(
      experience.driveTime
    );

    if (driveMinutes === null) return null;

    return transport === "transport"
      ? driveMinutes + 10
      : driveMinutes;
  }

  return estimateTravelMinutes(
    from,
    {
      latitude: experience.latitude,
      longitude: experience.longitude,
    },
    transport
  );
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

function createDateAtMinute(
  reference: Date,
  minuteOfDay: number
): Date {
  const result = new Date(reference);

  result.setHours(
    0,
    minuteOfDay,
    0,
    0
  );

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

function scoreExperience(
  experience: Experience,
  context: ExplorerContext
): {
  score: number;
  hasExplicitMatch: boolean;
} {
  const answers = context.answers;

  if (!answers) {
    return {
      score: 0,
      hasExplicitMatch: false,
    };
  }

  const intentRanking =
    getExplicitIntentScore(
      experience,
      answers.priorities
    );
  let score = intentRanking.score;

  if (isExpedition(experience)) {
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

  score += getProfilePreferenceScore(
    experience,
    context.profile.interests
  );

  return {
    score,
    hasExplicitMatch:
      intentRanking.matchedIntents.length > 0,
  };
}

function isWetForecast(
  forecast: WeatherForecastDay,
  period: WeatherForecastPeriod | null
): boolean {
  return (
    period?.condition === "rain" ||
    period?.condition === "drizzle" ||
    period?.condition === "snow" ||
    (period?.precipitationProbability ??
      forecast.precipitationProbability) >= 40
  );
}

function getRecommendationReason(
  forecast: WeatherForecastDay | null,
  period: WeatherForecastPeriod | null,
  hasExplicitMatch: boolean,
  visitMinutes: number
): ItineraryReasonCode {
  if (visitMinutes >= FULL_DAY_MINUTES) {
    return "full-day-experience";
  }

  if (forecast === null) {
    return "weather-unknown-conservative";
  }

  if (isWetForecast(forecast, period)) {
    return "indoor-priority";
  }

  return hasExplicitMatch
    ? "interest-match"
    : "weather-compatible";
}

function getSelectedForecastPeriod(
  forecast: WeatherForecastDay | null,
  startMinutes: number
): WeatherForecastPeriod | null {
  if (!forecast?.periods) return null;

  return forecast.periods[
    getWeatherPeriodKey(startMinutes)
  ];
}

function isOutdoorSensitive(
  experience: Experience
): boolean {
  if (experience.environment) {
    return experience.environment === "outdoor";
  }

  return (
    isExpedition(experience) ||
    experience.weatherSensitivity === "high" ||
    experience.terrain === "trail" ||
    experience.terrain === "clay" ||
    experience.terrain === "mountain"
  );
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
  const endMinutes = answers.endMinutes;

  if (
    !Number.isInteger(endMinutes) ||
    endMinutes <= startMinutes ||
    endMinutes > 24 * 60
  ) {
    return null;
  }

  const availableMinutes =
    endMinutes - startMinutes;
  const stopLimit = Math.min(
    MAX_STOPS,
    Math.max(
      1,
      Math.ceil(
        availableMinutes /
          MINUTES_PER_RECOMMENDED_STOP
      )
    )
  );
  const forecast =
    options.forecast ?? null;
  const selectedForecastPeriod =
    getSelectedForecastPeriod(
      forecast,
      startMinutes
    );
  const baseWeather =
    forecastToWeatherStatus(forecast);
  const weather: WeatherStatus | null =
    forecast && baseWeather
      ? {
        ...baseWeather,
        condition:
          selectedForecastPeriod?.condition ??
          forecast.condition,
        temperature:
          selectedForecastPeriod?.temperature ??
          Math.round(
            (forecast.temperatureMin +
              forecast.temperatureMax) /
              2
          ),
        precipitationProbabilityNext3Hours:
          selectedForecastPeriod
            ?.precipitationProbability ??
          forecast.precipitationProbability,
        windSpeedKmh:
          selectedForecastPeriod?.windSpeedKmh ??
          forecast.windSpeedKmh,
      }
      : null;
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

  const intentCandidates =
    relevantExperiences.filter(
      (experience) =>
        isEligibleForExplicitIntents(
          experience,
          answers.priorities
        )
    );
  const scheduledCandidates =
    intentCandidates.filter(
      hasRecommendableSchedule
    );
  const scheduledIds = new Set(
    scheduledCandidates.map(
      (experience) => experience.experienceId
    )
  );
  const exclusions: ItineraryExclusion[] =
    intentCandidates
      .filter(
        (experience) =>
          !scheduledIds.has(
            experience.experienceId
          )
      )
      .map((experience) =>
        createExclusion(
          experience,
          getScheduleReadiness(experience) ===
            "variable"
            ? "schedule-variable"
            : "schedule-unverified"
        )
      );

  const safeCandidates =
    getSafeCandidates(
      scheduledCandidates,
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
  for (const experience of
    scheduledCandidates) {
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
    .map((experience, index) => {
      const ranking = scoreExperience(
        experience,
        context
      );

      return {
        experience,
        index,
        ...ranking,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.index - b.index
    );

  const stops: ItineraryStop[] = [];
  const usedMealSlots = new Set<MealSlot>();
  let cursor = startMinutes;
  let previousExperience: Experience | null = null;

  for (const candidate of scored) {
    if (stops.length >= stopLimit) {
      break;
    }

    const {
      experience,
      hasExplicitMatch,
    } =
      candidate;
    const visitMinutes =
      getVisitMinutes(experience);
    const isFullDay =
      visitMinutes >= FULL_DAY_MINUTES;
    const travelMinutes =
      getTravelMinutes(
        experience,
        previousExperience,
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
      getExperienceOpeningWindow(
        experience,
        answers.selectedDate
      );

    if (
      openingWindow.hasSchedule &&
      !openingWindow.isScheduledToday
    ) {
      exclusions.push(
        createExclusion(
          experience,
          "outside-opening-hours",
          { closedToday: true }
        )
      );
      continue;
    }
    let visitStart =
      cursor + travelMinutes;
    let selectedMealSlot: MealSlot | null = null;
    let mealConstraint: string | undefined;

    if (
      experience.type === "restaurant" ||
      experience.type === "cafe" ||
      experience.type === "food_route"
    ) {
      mealConstraint = explainMealConstraint({
        experienceType: experience.type,
        earliestMinutes: visitStart,
        usedSlots: usedMealSlots,
        allowedSlots: experience.mealSlots,
        visitMinutes,
        endMinutes,
        opensAt: openingWindow.hasSchedule ? openingWindow.opensAt : 0,
        closesAt: openingWindow.hasSchedule ? openingWindow.closesAt : 24 * 60,
      });
      const mealWindow = findNextMealWindow(
        experience.type,
        visitStart,
        usedMealSlots,
        experience.mealSlots
      );

      if (!mealWindow) {
        exclusions.push(
          createExclusion(
            experience,
            "meal-window-unavailable",
            mealConstraint ? { mealConstraint } : undefined
          )
        );
        continue;
      }

      visitStart = mealWindow.startMinutes;
      selectedMealSlot = mealWindow.slot;

      if (
        visitStart + visitMinutes >
        mealWindow.endMinutes
      ) {
        exclusions.push(
          createExclusion(
            experience,
            "meal-window-unavailable",
            mealConstraint ? { mealConstraint } : undefined
          )
        );
        continue;
      }
    }

    if (
      openingWindow.hasSchedule &&
      visitStart < openingWindow.opensAt
    ) {
      visitStart = openingWindow.opensAt;
    }

    const visitEnd =
      visitStart + visitMinutes;

    if (
      openingWindow.hasSchedule &&
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

    if (visitEnd > endMinutes) {
      exclusions.push(
        createExclusion(
          experience,
          "not-enough-time",
          {
            ...(mealConstraint ? { mealConstraint } : {}),
            requiredMinutes:
              visitEnd - cursor,
            remainingMinutes:
              Math.max(
                0,
                endMinutes - cursor
              ),
          }
        )
      );
      continue;
    }

    if (
      isOutdoorVisitAfterSunset({
        visitEndMinutes: visitEnd,
        sunset: forecast?.sunset,
        isOutdoorSensitive:
          isOutdoorSensitive(experience),
      })
    ) {
      exclusions.push(
        createExclusion(
          experience,
          "after-sunset-outdoor",
          {
            endsAt: visitEnd,
            sunset:
              forecast?.sunset ?? "18:00",
          }
        )
      );
      continue;
    }

    /*
     * La seguridad también se evalúa durante el último minuto de
     * la parada. Así una actividad diurna no puede atravesar la
     * noche solo porque comenzó antes de las 18:00.
     */
    const endSafetyReason =
      getExperienceSafetyReason(
        experience,
        weather,
        createDateAtMinute(
          selectedDate,
          Math.max(
            visitStart,
            visitEnd - 1
          )
        )
      );

    if (
      endSafetyReason &&
      endSafetyReason !== "inactive"
    ) {
      exclusions.push(
        createExclusion(
          experience,
          safetyReasonToItineraryReason(
            endSafetyReason
          ),
          {
            endsAt: visitEnd,
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
            selectedForecastPeriod,
            hasExplicitMatch,
            visitMinutes
          ),
        params: {
          priorities:
            answers.priorities.join(","),
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
    previousExperience = experience;

    if (selectedMealSlot) {
      usedMealSlots.add(selectedMealSlot);
    }

    if (isFullDay) {
      break;
    }
  }

  return {
    selectedDate: answers.selectedDate,
    selectedHour: answers.selectedHour,
    endMinutes,
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
    selectedForecastPeriod:
      selectedForecastPeriod
        ? { ...selectedForecastPeriod }
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
