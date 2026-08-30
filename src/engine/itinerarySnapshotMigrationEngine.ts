import type {
  ItineraryDecision,
  ItineraryDecisionAction,
  ItineraryExclusion,
  ItineraryPlanSnapshotStop,
  ItineraryReasonCode,
  ItineraryReasonParams,
  ItineraryTransport,
  ItineraryWeatherPeriodSnapshot,
  ItineraryWeatherSnapshot,
  NormalizedItineraryPlanSnapshot,
} from "../types/itinerary";

const MAX_STOPS = 8;
const MAX_EXCLUSIONS = 64;
const MAX_PRIORITIES = 8;

const DECISION_ACTIONS = new Set<
  ItineraryDecisionAction
>(["recommended", "excluded", "replaced"]);

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
  "after-sunset-outdoor",
  "meal-window-unavailable",
  "full-day-conflict",
  "not-enough-time",
]);

const TRANSPORTS = new Set<ItineraryTransport>([
  "walking",
  "transport",
  "taxi",
]);

const WEATHER_CONDITIONS = new Set<
  ItineraryWeatherSnapshot["condition"]
>(["sunny", "cloudy", "drizzle", "rain", "snow"]);

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

function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  );
}

function optionalFiniteNumber(
  value: unknown
): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

function optionalString(
  value: unknown
): string | undefined {
  return isNonEmptyString(value) ? value : undefined;
}

function parseReasonParams(
  value: unknown
): ItineraryReasonParams | undefined {
  if (!isRecord(value)) return undefined;

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([, item]) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
      )
      .slice(0, 20)
  ) as ItineraryReasonParams;
}

function parseDecision(
  value: unknown
): ItineraryDecision | null {
  if (!isRecord(value)) return null;

  const action = value.action as ItineraryDecisionAction;
  const reasonCode = value.reasonCode as ItineraryReasonCode;

  if (
    !DECISION_ACTIONS.has(action) ||
    !REASON_CODES.has(reasonCode)
  ) {
    return null;
  }

  const params = parseReasonParams(value.params);

  return {
    action,
    reasonCode,
    ...(params ? { params } : {}),
  };
}

function parseWeatherPeriod(
  value: unknown
): ItineraryWeatherPeriodSnapshot | null {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.hour) ||
    !isFiniteNumber(value.temperature) ||
    !WEATHER_CONDITIONS.has(
      value.condition as ItineraryWeatherSnapshot["condition"]
    )
  ) {
    return null;
  }

  return {
    hour: value.hour,
    temperature: value.temperature,
    condition:
      value.condition as ItineraryWeatherSnapshot["condition"],
    ...(optionalFiniteNumber(value.apparentTemperature) !== undefined
      ? {
          apparentTemperature: value.apparentTemperature as number,
        }
      : {}),
    ...(optionalFiniteNumber(value.precipitationProbability) !== undefined
      ? {
          precipitationProbability:
            value.precipitationProbability as number,
        }
      : {}),
    ...(optionalFiniteNumber(value.windSpeedKmh) !== undefined
      ? { windSpeedKmh: value.windSpeedKmh as number }
      : {}),
  };
}

function parseForecast(
  value: unknown
): ItineraryWeatherSnapshot | null | undefined {
  if (value === null) return null;

  if (
    !isRecord(value) ||
    !isIsoDate(value.date) ||
    !isNonEmptyString(value.city) ||
    !WEATHER_CONDITIONS.has(
      value.condition as ItineraryWeatherSnapshot["condition"]
    ) ||
    !isFiniteNumber(value.temperatureMin) ||
    !isFiniteNumber(value.temperatureMax) ||
    !isFiniteNumber(value.precipitationProbability) ||
    !isFiniteNumber(value.windSpeedKmh) ||
    typeof value.isHighMountainSafe !== "boolean"
  ) {
    return undefined;
  }

  let periods:
    | ItineraryWeatherSnapshot["periods"]
    | undefined;

  if (isRecord(value.periods)) {
    const morning = parseWeatherPeriod(value.periods.morning);
    const afternoon = parseWeatherPeriod(
      value.periods.afternoon
    );
    const night = parseWeatherPeriod(value.periods.night);

    if (morning && afternoon && night) {
      periods = { morning, afternoon, night };
    }
  }

  return {
    date: value.date,
    city: value.city,
    condition:
      value.condition as ItineraryWeatherSnapshot["condition"],
    temperatureMin: value.temperatureMin,
    temperatureMax: value.temperatureMax,
    precipitationProbability: value.precipitationProbability,
    windSpeedKmh: value.windSpeedKmh,
    isHighMountainSafe: value.isHighMountainSafe,
    ...(periods ? { periods } : {}),
    ...(optionalFiniteNumber(value.apparentTemperature) !== undefined
      ? { apparentTemperature: value.apparentTemperature as number }
      : {}),
    ...(optionalFiniteNumber(value.uvIndexMax) !== undefined
      ? { uvIndexMax: value.uvIndexMax as number }
      : {}),
    ...(optionalString(value.sunrise)
      ? { sunrise: value.sunrise as string }
      : {}),
    ...(optionalString(value.sunset)
      ? { sunset: value.sunset as string }
      : {}),
    ...(optionalFiniteNumber(value.daylightDurationSeconds) !== undefined
      ? {
          daylightDurationSeconds:
            value.daylightDurationSeconds as number,
        }
      : {}),
    ...(optionalFiniteNumber(value.precipitationHours) !== undefined
      ? { precipitationHours: value.precipitationHours as number }
      : {}),
  };
}

function parseStop(
  value: unknown
): ItineraryPlanSnapshotStop | null {
  if (!isRecord(value)) return null;

  const explanation = parseDecision(value.explanation);

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
    experienceId: value.experienceId,
    startMinutes: value.startMinutes,
    endMinutes: value.endMinutes,
    travelMinutes: value.travelMinutes,
    visitMinutes: value.visitMinutes,
    explanation,
  };
}

function parseExclusion(
  value: unknown
): ItineraryExclusion | null {
  if (!isRecord(value)) return null;

  const explanation = parseDecision(value.explanation);

  if (
    !isNonEmptyString(value.experienceId) ||
    !isNonEmptyString(value.title) ||
    !explanation
  ) {
    return null;
  }

  return {
    experienceId: value.experienceId,
    title: value.title,
    explanation,
  };
}

function parsePriorities(
  value: unknown
): string[] | null {
  if (!Array.isArray(value)) return null;

  const priorities = Array.from(
    new Set(value.filter(isNonEmptyString).map((item) => item.trim()))
  ).slice(0, MAX_PRIORITIES);

  return priorities.length > 0 ? priorities : null;
}

export function migrateItinerarySnapshot(
  value: unknown
): NormalizedItineraryPlanSnapshot | null {
  if (
    !isRecord(value) ||
    (value.schemaVersion !== 1 && value.schemaVersion !== 2) ||
    !isIsoDate(value.selectedDate) ||
    !isFiniteNumber(value.selectedHour) ||
    value.selectedHour < 0 ||
    value.selectedHour > 23 ||
    !isFiniteNumber(value.availableMinutes) ||
    !isFiniteNumber(value.totalDurationMinutes) ||
    !isRecord(value.preferences) ||
    !TRANSPORTS.has(
      value.preferences.transport as ItineraryTransport
    ) ||
    !Array.isArray(value.stops) ||
    value.stops.length > MAX_STOPS ||
    !Array.isArray(value.exclusions) ||
    value.exclusions.length > MAX_EXCLUSIONS
  ) {
    return null;
  }

  const priorities =
    value.schemaVersion === 1
      ? isNonEmptyString(value.preferences.priority)
        ? [value.preferences.priority]
        : null
      : parsePriorities(value.preferences.priorities);
  const startMinutes = value.selectedHour * 60;
  const endMinutes =
    value.schemaVersion === 2 &&
    isFiniteNumber(value.endMinutes)
      ? value.endMinutes
      : startMinutes + value.availableMinutes;
  const forecast = parseForecast(value.forecast);
  const stops = value.stops.map(parseStop);
  const exclusions = value.exclusions.map(parseExclusion);

  if (
    !priorities ||
    endMinutes <= startMinutes ||
    endMinutes > 24 * 60 ||
    forecast === undefined ||
    stops.some((stop) => stop === null) ||
    exclusions.some((exclusion) => exclusion === null)
  ) {
    return null;
  }

  const selectedForecastPeriod =
    value.schemaVersion === 2
      ? parseWeatherPeriod(value.selectedForecastPeriod)
      : forecast?.periods
        ? selectedHourPeriod(forecast, startMinutes)
        : null;

  return {
    schemaVersion: 2,
    selectedDate: value.selectedDate,
    selectedHour: value.selectedHour,
    endMinutes,
    availableMinutes: endMinutes - startMinutes,
    totalDurationMinutes: value.totalDurationMinutes,
    preferences: {
      priorities,
      transport:
        value.preferences.transport as ItineraryTransport,
    },
    forecast,
    selectedForecastPeriod,
    stops: stops as ItineraryPlanSnapshotStop[],
    exclusions: exclusions as ItineraryExclusion[],
  };
}

function selectedHourPeriod(
  forecast: ItineraryWeatherSnapshot,
  startMinutes: number
): ItineraryWeatherPeriodSnapshot | null {
  if (!forecast.periods) return null;

  if (startMinutes < 12 * 60) {
    return forecast.periods.morning;
  }

  if (startMinutes < 18 * 60) {
    return forecast.periods.afternoon;
  }

  return forecast.periods.night;
}
