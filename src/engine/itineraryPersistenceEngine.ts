import {
  catalog,
} from "../data/catalog";
import type {
  Experience,
} from "../types/experience";
import type {
  ItineraryDecision,
  ItineraryDecisionAction,
  ItineraryExclusion,
  ItineraryPlan,
  ItineraryPlanPreferences,
  ItineraryPlanSnapshot,
  ItineraryPlanSnapshotStop,
  ItineraryReasonCode,
  ItineraryReasonParams,
  ItineraryWeatherSnapshot,
  SavedItineraryPlan,
} from "../types/itinerary";

const STORAGE_KEY =
  "iguide.saved-itineraries.v1";

const MAX_SAVED_PLANS = 20;
const MAX_STOPS = 8;
const MAX_EXCLUSIONS = 64;

const DECISION_ACTIONS = new Set<
  ItineraryDecisionAction
>([
  "recommended",
  "excluded",
  "replaced",
]);

const REASON_CODES = new Set<
  ItineraryReasonCode
>([
  "interest-match",
  "weather-compatible",
  "indoor-priority",
  "weather-unknown-conservative",
  "full-day-experience",
  "weather-wet-risk",
  "weather-unknown-risk",
  "high-mountain-weather",
  "night-incompatible",
  "transport-incompatible",
  "outside-opening-hours",
  "full-day-conflict",
  "not-enough-time",
]);

const TRANSPORTS = new Set<
  ItineraryPlanPreferences["transport"]
>([
  "walking",
  "transport",
  "taxi",
]);

const WEATHER_CONDITIONS = new Set<
  ItineraryWeatherSnapshot["condition"]
>([
  "sunny",
  "cloudy",
  "drizzle",
  "rain",
  "snow",
]);

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isFiniteNumber(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isIsoDate(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  );
}

function parseReasonParams(
  value: unknown
): ItineraryReasonParams | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const entries = Object.entries(value)
    .filter(([, item]) =>
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean"
    )
    .slice(0, 20);

  return Object.fromEntries(
    entries
  ) as ItineraryReasonParams;
}

function parseDecision(
  value: unknown
): ItineraryDecision | null {
  if (!isRecord(value)) {
    return null;
  }

  const action = value.action;
  const reasonCode = value.reasonCode;

  if (
    !DECISION_ACTIONS.has(
      action as ItineraryDecisionAction
    ) ||
    !REASON_CODES.has(
      reasonCode as ItineraryReasonCode
    )
  ) {
    return null;
  }

  const params = parseReasonParams(
    value.params
  );

  return {
    action:
      action as ItineraryDecisionAction,
    reasonCode:
      reasonCode as ItineraryReasonCode,
    ...(params ? { params } : {}),
  };
}

function parseForecast(
  value: unknown
): ItineraryWeatherSnapshot | null | undefined {
  if (value === null) {
    return null;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  if (
    !isIsoDate(value.date) ||
    !isNonEmptyString(value.city) ||
    !WEATHER_CONDITIONS.has(
      value.condition as ItineraryWeatherSnapshot["condition"]
    ) ||
    !isFiniteNumber(value.temperatureMin) ||
    !isFiniteNumber(value.temperatureMax) ||
    !isFiniteNumber(
      value.precipitationProbability
    ) ||
    !isFiniteNumber(value.windSpeedKmh) ||
    typeof value.isHighMountainSafe !==
      "boolean"
  ) {
    return undefined;
  }

  return {
    date: value.date,
    city: value.city,
    condition:
      value.condition as ItineraryWeatherSnapshot["condition"],
    temperatureMin:
      value.temperatureMin,
    temperatureMax:
      value.temperatureMax,
    precipitationProbability:
      value.precipitationProbability,
    windSpeedKmh:
      value.windSpeedKmh,
    isHighMountainSafe:
      value.isHighMountainSafe,
  };
}

function parseSnapshotStop(
  value: unknown
): ItineraryPlanSnapshotStop | null {
  if (!isRecord(value)) {
    return null;
  }

  const explanation = parseDecision(
    value.explanation
  );

  if (
    !isNonEmptyString(value.experienceId) ||
    !isFiniteNumber(value.startMinutes) ||
    !isFiniteNumber(value.endMinutes) ||
    !isFiniteNumber(value.travelMinutes) ||
    !isFiniteNumber(value.visitMinutes) ||
    !explanation
  ) {
    return null;
  }

  return {
    experienceId:
      value.experienceId,
    startMinutes:
      value.startMinutes,
    endMinutes:
      value.endMinutes,
    travelMinutes:
      value.travelMinutes,
    visitMinutes:
      value.visitMinutes,
    explanation,
  };
}

function parseExclusion(
  value: unknown
): ItineraryExclusion | null {
  if (!isRecord(value)) {
    return null;
  }

  const explanation = parseDecision(
    value.explanation
  );

  if (
    !isNonEmptyString(value.experienceId) ||
    !isNonEmptyString(value.title) ||
    !explanation
  ) {
    return null;
  }

  return {
    experienceId:
      value.experienceId,
    title: value.title,
    explanation,
  };
}

export function parseItinerarySnapshot(
  value: unknown
): ItineraryPlanSnapshot | null {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !isIsoDate(value.selectedDate) ||
    !isFiniteNumber(value.selectedHour) ||
    value.selectedHour < 0 ||
    value.selectedHour > 23 ||
    !isFiniteNumber(value.availableMinutes) ||
    !isFiniteNumber(
      value.totalDurationMinutes
    ) ||
    !isRecord(value.preferences) ||
    !isNonEmptyString(
      value.preferences.priority
    ) ||
    !TRANSPORTS.has(
      value.preferences.transport as ItineraryPlanPreferences["transport"]
    ) ||
    !Array.isArray(value.stops) ||
    value.stops.length > MAX_STOPS ||
    !Array.isArray(value.exclusions) ||
    value.exclusions.length > MAX_EXCLUSIONS
  ) {
    return null;
  }

  const forecast = parseForecast(
    value.forecast
  );
  const stops = value.stops.map(
    parseSnapshotStop
  );
  const exclusions = value.exclusions.map(
    parseExclusion
  );

  if (
    forecast === undefined ||
    stops.some((stop) => stop === null) ||
    exclusions.some(
      (exclusion) => exclusion === null
    )
  ) {
    return null;
  }

  return {
    schemaVersion: 1,
    selectedDate:
      value.selectedDate,
    selectedHour:
      value.selectedHour,
    availableMinutes:
      value.availableMinutes,
    totalDurationMinutes:
      value.totalDurationMinutes,
    preferences: {
      priority:
        value.preferences.priority,
      transport:
        value.preferences.transport as ItineraryPlanPreferences["transport"],
    },
    forecast,
    stops:
      stops as ItineraryPlanSnapshotStop[],
    exclusions:
      exclusions as ItineraryExclusion[],
  };
}

export function createItinerarySnapshot(
  plan: ItineraryPlan,
  preferences: ItineraryPlanPreferences
): ItineraryPlanSnapshot {
  return {
    schemaVersion: 1,
    selectedDate:
      plan.selectedDate,
    selectedHour:
      plan.selectedHour,
    availableMinutes:
      plan.availableMinutes,
    totalDurationMinutes:
      plan.totalDurationMinutes,
    preferences: {
      ...preferences,
    },
    forecast: plan.forecast
      ? { ...plan.forecast }
      : null,
    stops: plan.stops.map((stop) => ({
      experienceId:
        stop.experience.experienceId,
      startMinutes:
        stop.startMinutes,
      endMinutes:
        stop.endMinutes,
      travelMinutes:
        stop.travelMinutes,
      visitMinutes:
        stop.visitMinutes,
      explanation: {
        ...stop.explanation,
        ...(stop.explanation.params
          ? {
              params: {
                ...stop.explanation.params,
              },
            }
          : {}),
      },
    })),
    exclusions: plan.exclusions.map(
      (exclusion) => ({
        ...exclusion,
        explanation: {
          ...exclusion.explanation,
          ...(exclusion.explanation.params
            ? {
                params: {
                  ...exclusion.explanation.params,
                },
              }
            : {}),
        },
      })
    ),
  };
}

export type ItineraryHydrationResult = {
  plan: ItineraryPlan | null;
  omittedStopCount: number;
};

export function hydrateItinerarySnapshotWithReport(
  snapshot: ItineraryPlanSnapshot,
  experiences: Experience[] = catalog
): ItineraryHydrationResult {
  const experienceById = new Map(
    experiences
      .filter(
        (experience) =>
          experience.isActive
      )
      .map((experience) => [
        experience.experienceId,
        experience,
      ])
  );

  const stops = snapshot.stops
    .map((stop) => {
      const experience =
        experienceById.get(
          stop.experienceId
        );

      return experience
        ? {
            experience,
            startMinutes:
              stop.startMinutes,
            endMinutes:
              stop.endMinutes,
            travelMinutes:
              stop.travelMinutes,
            visitMinutes:
              stop.visitMinutes,
            explanation: {
              ...stop.explanation,
              ...(stop.explanation.params
                ? {
                    params: {
                      ...stop.explanation.params,
                    },
                  }
                : {}),
            },
          }
        : null;
    })
    .filter(
      (
        stop
      ): stop is NonNullable<
        typeof stop
      > => stop !== null
    );

  const omittedStopCount =
    snapshot.stops.length -
    stops.length;

  if (
    snapshot.stops.length > 0 &&
    stops.length === 0
  ) {
    return {
      plan: null,
      omittedStopCount,
    };
  }

  return {
    plan: {
      selectedDate:
        snapshot.selectedDate,
      selectedHour:
        snapshot.selectedHour,
      availableMinutes:
        snapshot.availableMinutes,
      totalDurationMinutes:
        snapshot.totalDurationMinutes,
      forecast: snapshot.forecast
        ? { ...snapshot.forecast }
        : null,
      stops,
      exclusions:
        snapshot.exclusions.map(
          (exclusion) => ({
            ...exclusion,
            explanation: {
              ...exclusion.explanation,
              ...(exclusion.explanation.params
                ? {
                    params: {
                      ...exclusion.explanation.params,
                    },
                  }
                : {}),
            },
          })
        ),
    },
    omittedStopCount,
  };
}

/**
 * Contrato compatible para consumidores que solo necesitan el plan.
 * La UI usa la variante con reporte cuando debe explicar omisiones.
 */
export function hydrateItinerarySnapshot(
  snapshot: ItineraryPlanSnapshot,
  experiences: Experience[] = catalog
): ItineraryPlan | null {
  return hydrateItinerarySnapshotWithReport(
    snapshot,
    experiences
  ).plan;
}

function getSnapshotIdentity(
  snapshot: ItineraryPlanSnapshot
): string {
  return [
    snapshot.selectedDate,
    snapshot.selectedHour,
    ...snapshot.stops.map(
      (stop) => stop.experienceId
    ),
  ].join("::");
}

function parseSavedPlan(
  value: unknown
): SavedItineraryPlan | null {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isFiniteNumber(value.savedAt)
  ) {
    return null;
  }

  const snapshot =
    parseItinerarySnapshot(
      value.snapshot
    );

  return snapshot
    ? {
        id: value.id,
        savedAt:
          value.savedAt,
        snapshot,
      }
    : null;
}

export function loadSavedItineraries(): SavedItineraryPlan[] {
  try {
    const raw = localStorage.getItem(
      STORAGE_KEY
    );

    if (!raw) return [];

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(parseSavedPlan)
      .filter(
        (
          plan
        ): plan is SavedItineraryPlan =>
          plan !== null
      )
      .sort(
        (a, b) =>
          b.savedAt - a.savedAt
      )
      .slice(0, MAX_SAVED_PLANS);
  } catch {
    return [];
  }
}

export function saveItineraryPlan(
  plan: ItineraryPlan,
  preferences: ItineraryPlanPreferences
): SavedItineraryPlan {
  const snapshot =
    createItinerarySnapshot(
      plan,
      preferences
    );
  const identity =
    getSnapshotIdentity(snapshot);
  const savedAt = Date.now();
  const existing =
    loadSavedItineraries();
  const samePlan = existing.find(
    (item) =>
      getSnapshotIdentity(
        item.snapshot
      ) === identity
  );
  const savedPlan: SavedItineraryPlan = {
    id:
      samePlan?.id ??
      `plan-${savedAt.toString(36)}`,
    savedAt,
    snapshot,
  };
  const next = [
    savedPlan,
    ...existing.filter(
      (item) =>
        item.id !== savedPlan.id
    ),
  ].slice(0, MAX_SAVED_PLANS);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(next)
  );

  return savedPlan;
}

export function deleteSavedItinerary(
  id: string
): SavedItineraryPlan[] {
  const next = loadSavedItineraries()
    .filter((item) => item.id !== id);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(next)
  );

  return next;
}
