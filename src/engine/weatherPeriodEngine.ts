import {
  hasWetWeather,
} from "./experienceSafetyEngine";
import {
  getWeatherVisual,
} from "./weatherEngine";
import type {
  WeatherForecastDay,
  WeatherForecastPeriod,
  WeatherStatus,
} from "./weatherEngine";

export type WeatherPeriodKey =
  | "morning"
  | "afternoon"
  | "night";

export type WeatherPeriodAction =
  | "recommended"
  | "adapted"
  | "unknown";

export type WeatherPeriodReasonCode =
  | "weather-favorable"
  | "wet-weather"
  | "high-mountain-risk"
  | "forecast-unavailable";

export type WeatherPeriodDecision = {
  action: WeatherPeriodAction;
  reasonCode: WeatherPeriodReasonCode;
  params: Record<
    string,
    string | number | boolean
  >;
};

export type WeatherPeriodDefinition = {
  key: WeatherPeriodKey;
  label: string;
  forecastHour: number;
  selectedHour: number;
  endMinutes: number;
};

export type WeatherPeriodViewModel = {
  definition: WeatherPeriodDefinition;
  temperature: number | null;
  icon: string;
  conditionLabel: string;
  statusLabel: string;
  decision: WeatherPeriodDecision;
};

export type WeatherItineraryHandoff = {
  date: string;
  period: WeatherPeriodKey;
  selectedHour: number;
  endMinutes: number;
};

export const WEATHER_PERIOD_DEFINITIONS: readonly WeatherPeriodDefinition[] = [
  {
    key: "morning",
    label: "Mañana",
    forecastHour: 9,
    selectedHour: 9,
    endMinutes: 12 * 60,
  },
  {
    key: "afternoon",
    label: "Tarde",
    forecastHour: 15,
    selectedHour: 15,
    endMinutes: 18 * 60,
  },
  {
    key: "night",
    label: "Noche",
    forecastHour: 21,
    selectedHour: 19,
    endMinutes: 21 * 60,
  },
] as const;

const PERIOD_KEYS = new Set<WeatherPeriodKey>(
  WEATHER_PERIOD_DEFINITIONS.map(
    (definition) => definition.key
  )
);

function isIsoDate(date: string): boolean {
  const match = date.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(
    year,
    month - 1,
    day,
    12
  );

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function getWeatherPeriodDefinition(
  key: WeatherPeriodKey
): WeatherPeriodDefinition {
  const definition =
    WEATHER_PERIOD_DEFINITIONS.find(
      (item) => item.key === key
    );

  if (!definition) {
    throw new Error(
      `Franja climática desconocida: ${key}`
    );
  }

  return definition;
}

function getPeriod(
  day: WeatherForecastDay | null,
  key: WeatherPeriodKey
): WeatherForecastPeriod | null {
  return day?.periods?.[key] ?? null;
}

function toWeatherStatus(
  day: WeatherForecastDay,
  period: WeatherForecastPeriod
): WeatherStatus {
  return {
    city: day.city,
    temperature: period.temperature,
    condition: period.condition,
    isHighMountainSafe:
      day.isHighMountainSafe,
    precipitationProbabilityNext3Hours:
      period.precipitationProbability ??
      day.precipitationProbability,
    windSpeedKmh:
      period.windSpeedKmh ??
      day.windSpeedKmh,
  };
}

function createParams(
  day: WeatherForecastDay,
  period: WeatherForecastPeriod
): WeatherPeriodDecision["params"] {
  return {
    temperature: period.temperature,
    precipitationProbability:
      period.precipitationProbability ??
      day.precipitationProbability,
    windSpeedKmh:
      period.windSpeedKmh ??
      day.windSpeedKmh,
    highMountainSafe:
      day.isHighMountainSafe,
    ...(period.apparentTemperature !==
    undefined
      ? {
          apparentTemperature:
            period.apparentTemperature,
        }
      : {}),
  };
}

export function qualifyWeatherPeriod(
  day: WeatherForecastDay | null,
  key: WeatherPeriodKey
): WeatherPeriodViewModel {
  const definition =
    getWeatherPeriodDefinition(key);
  const period = getPeriod(day, key);

  if (!day || !period) {
    return {
      definition,
      temperature: null,
      icon: "❔",
      conditionLabel: "Pronóstico no disponible",
      statusLabel:
        "Sin pronóstico: Hospes preparará un plan conservador",
      decision: {
        action: "unknown",
        reasonCode: "forecast-unavailable",
        params: {},
      },
    };
  }

  const visual = getWeatherVisual(
    period.condition
  );
  const weather = toWeatherStatus(
    day,
    period
  );
  const params = createParams(day, period);

  if (hasWetWeather(weather)) {
    return {
      definition,
      temperature: period.temperature,
      icon: visual.icon,
      conditionLabel: visual.label,
      statusLabel:
        "Hospes priorizará lugares bajo techo",
      decision: {
        action: "adapted",
        reasonCode: "wet-weather",
        params,
      },
    };
  }

  if (!day.isHighMountainSafe) {
    return {
      definition,
      temperature: period.temperature,
      icon: visual.icon,
      conditionLabel: visual.label,
      statusLabel:
        "Hospes evitará la alta montaña",
      decision: {
        action: "adapted",
        reasonCode: "high-mountain-risk",
        params,
      },
    };
  }

  return {
    definition,
    temperature: period.temperature,
    icon: visual.icon,
    conditionLabel: visual.label,
    statusLabel: "Buen momento para explorar",
    decision: {
      action: "recommended",
      reasonCode: "weather-favorable",
      params,
    },
  };
}

export function getWeatherPeriodViewModels(
  day: WeatherForecastDay | null
): WeatherPeriodViewModel[] {
  return WEATHER_PERIOD_DEFINITIONS.map(
    (definition) =>
      qualifyWeatherPeriod(
        day,
        definition.key
      )
  );
}

export function createWeatherItinerarySearch(
  date: string,
  period: WeatherPeriodKey
): string {
  if (!isIsoDate(date)) {
    throw new Error(
      `Fecha climática inválida: ${date}`
    );
  }

  return new URLSearchParams({
    source: "weather",
    date,
    period,
  }).toString();
}

export function readWeatherItineraryHandoff(
  search: string
): WeatherItineraryHandoff | null {
  const params = new URLSearchParams(
    search.startsWith("?")
      ? search.slice(1)
      : search
  );

  if (params.get("source") !== "weather") {
    return null;
  }

  const date = params.get("date") ?? "";
  const periodValue = params.get("period");

  if (
    !isIsoDate(date) ||
    !periodValue ||
    !PERIOD_KEYS.has(
      periodValue as WeatherPeriodKey
    )
  ) {
    return null;
  }

  const period =
    periodValue as WeatherPeriodKey;
  const definition =
    getWeatherPeriodDefinition(period);

  return {
    date,
    period,
    selectedHour:
      definition.selectedHour,
    endMinutes: definition.endMinutes,
  };
}
