import type { UserProfile } from "../types/user/user";

import {
  getCurrentTimeContext,
  getTimeOfDay,
} from "./timeEngine";

import { currentCity } from "../data/currentCity";

export interface WeatherStatus {
  temperature: number;

  condition:
    | "sunny"
    | "cloudy"
    | "drizzle"
    | "rain"
    | "snow";

  city: string;

  isHighMountainSafe: boolean;

  precipitationMm?: number;

  precipitationProbabilityNext3Hours?: number;

  windSpeedKmh?: number;
}

export interface WeatherForecastDay {
  date: string;
  city: string;
  condition: WeatherStatus["condition"];
  temperatureMin: number;
  temperatureMax: number;
  precipitationProbability: number;
  windSpeedKmh: number;
  isHighMountainSafe: boolean;
}

export interface WeatherForecast {
  city: string;
  timezone: string;
  fetchedAt: number;
  days: WeatherForecastDay[];
}

export interface WeatherVisual {
  icon: string;
  label: string;
  color: string;
}

export function normalizeWeather(
  condition: string
): WeatherStatus["condition"] {
  switch (
    condition
      ?.trim()
      .toLowerCase()
  ) {
    case "clear":
    case "sun":
    case "sunny":
      return "sunny";

    case "cloud":
    case "cloudy":
    case "overcast":
      return "cloudy";

    case "drizzle":
      return "drizzle";

    case "rain":
    case "rainy":
      return "rain";

    case "snow":
      return "snow";

    default:
      return "cloudy";
  }
}

export const weatherVisuals: Record<
  WeatherStatus["condition"],
  WeatherVisual
> = {
  sunny: {
    icon: "☀️",
    label: "Soleado",
    color: "#FDB813",
  },

  cloudy: {
    icon: "☁️",
    label: "Nublado",
    color: "#D1D5DB",
  },

  drizzle: {
    icon: "🌦️",
    label: "Llovizna",
    color: "#7DD3FC",
  },

  rain: {
    icon: "🌧️",
    label: "Lluvia",
    color: "#60A5FA",
  },

  snow: {
    icon: "❄️",
    label: "Nieve",
    color: "#D1D5DB",
  },
};

export function getWeatherVisual(
  condition: string
): WeatherVisual {
  const normalized =
    normalizeWeather(
      condition
    );

  return (
    weatherVisuals[
      normalized
    ] ??
    weatherVisuals.cloudy
  );
}

const greetings: Record<
  ReturnType<
    typeof getTimeOfDay
  >,
  string
> = {
  morning:
    "Buenos días",

  afternoon:
    "Buenas tardes",

  night:
    "Buenas noches",
};

export function getWeatherAlertForHospes(
  user: UserProfile,
  weather: WeatherStatus
): string {
  const timeOfDay =
    getTimeOfDay();

  const timeContext =
    getCurrentTimeContext();

  const greeting =
    `${greetings[timeOfDay]}, ` +
    `${user.name}. ` +
    `Bienvenido a ${currentCity}.`;

  if (
    timeContext.isNight
  ) {
    return (
      `${greeting} ` +
      "El sol ya se ocultó en el Valle. " +
      "Te sugiero revisar experiencias gastronómicas, culturales o urbanas apropiadas para esta hora."
    );
  }

  if (
    weather.condition ===
      "drizzle" ||
    weather.condition ===
      "rain"
  ) {
    return (
      `${greeting} ` +
      "Hay precipitaciones en el entorno. " +
      "No recomiendo rutas de alta montaña; prioricemos experiencias interiores o urbanas."
    );
  }

  if (
    timeContext
      .isGoldenHour &&
    user.interests.includes(
      "photography"
    )
  ) {
    return (
      `${greeting} ` +
      "Estamos en la hora dorada del Valle. " +
      "La luz es favorable para una experiencia fotográfica."
    );
  }

  return (
    `${greeting} ` +
    `Las condiciones actuales en ${weather.city} son favorables para explorar.`
  );
}
