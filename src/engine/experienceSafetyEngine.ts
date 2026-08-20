import type {
  Experience,
} from "../types/experience";
import type {
  UserProfile,
} from "../types/user/user";
import type {
  WeatherStatus,
} from "./weatherEngine";

export type ExperienceSafetyReason =
  | "inactive"
  | "weather-wet-risk"
  | "weather-unknown-risk"
  | "high-mountain-weather"
  | "night-incompatible";

function isOutdoorExperience(
  experience: Experience
): boolean {
  if (experience.environment) {
    return experience.environment === "outdoor";
  }

  const searchableText = [
    experience.type,
    experience.title,
    experience.description,
    ...(experience.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return [
    "expedition",
    "montaña",
    "nevado",
    "mirador",
    "trekking",
    "senderismo",
    "naturaleza",
    "arqueológico",
    "torre torre",
    "huaytapallana",
  ].some((term) =>
    searchableText.includes(term)
  );
}

function isIndoorFriendly(
  experience: Experience
): boolean {
  if (experience.environment) {
    return (
      experience.environment === "indoor" ||
      experience.environment === "mixed"
    );
  }

  return [
    "restaurant",
    "cafe",
    "museum",
    "culture",
    "gastronomy",
  ].includes(
    String(experience.type).toLowerCase()
  );
}

function isNightCompatible(
  experience: Experience
): boolean {
  return [
    "restaurant",
    "cafe",
    "bar",
    "nightclub",
    "nightlife",
    "gastronomy",
  ].includes(
    String(experience.type).toLowerCase()
  );
}

/**
 * Riesgo por humedad compartido por Inicio e Itinerario.
 * Se usa tanto con lluvia real como con clima desconocido.
 */
export function isWetRisky(
  experience: Experience
): boolean {
  return (
    experience.weatherSensitivity === "high" ||
    experience.avoidWhenWet === true ||
    experience.terrain === "clay" ||
    experience.terrain === "trail" ||
    experience.terrain === "mountain"
  );
}

function hasWetWeather(
  weather: WeatherStatus
): boolean {
  return (
    weather.condition === "rain" ||
    weather.condition === "drizzle" ||
    weather.condition === "snow" ||
    (weather.precipitationProbabilityNext3Hours ??
      0) >= 40
  );
}

/**
 * Expone el mismo veredicto que usa el filtro para que la UI y
 * Hospes puedan explicar una exclusión sin duplicar reglas.
 */
export function getExperienceSafetyReason(
  experience: Experience,
  weather: WeatherStatus | null,
  currentDate: Date
): ExperienceSafetyReason | null {
  if (experience.isActive === false) {
    return "inactive";
  }

  if (
    weather !== null &&
    hasWetWeather(weather) &&
    (!isIndoorFriendly(experience) ||
      isOutdoorExperience(experience) ||
      isWetRisky(experience))
  ) {
    return "weather-wet-risk";
  }

  if (
    weather === null &&
    isWetRisky(experience)
  ) {
    return "weather-unknown-risk";
  }

  if (
    weather !== null &&
    !weather.isHighMountainSafe &&
    experience.terrain === "mountain"
  ) {
    return "high-mountain-weather";
  }

  const hour = currentDate.getHours();
  const isNight =
    hour >= 18 || hour < 6;

  if (
    isNight &&
    !isNightCompatible(experience)
  ) {
    return "night-incompatible";
  }

  return null;
}

/**
 * Política neutral de seguridad para experiencias.
 * Nunca recupera candidatos que hayan fallado un filtro.
 */
export function filterSafeExperiences(
  experiences: Experience[],
  weather: WeatherStatus | null,
  currentDate: Date
): Experience[] {
  return experiences.filter(
    (experience) =>
      getExperienceSafetyReason(
        experience,
        weather,
        currentDate
      ) === null
  );
}

/**
 * Devuelve candidatos seguros sin importar el catálogo global.
 * El perfil solo reordena: experiencias no visitadas primero.
 */
export function getSafeCandidates(
  experiences: Experience[],
  context: {
    profile: UserProfile;
    weather: WeatherStatus | null;
    currentDate?: Date;
  }
): Experience[] {
  const {
    profile,
    weather,
    currentDate = new Date(),
  } = context;

  const candidates =
    filterSafeExperiences(
      experiences,
      weather,
      currentDate
    );

  if (candidates.length === 0) {
    return [];
  }

  const visited = new Set(
    profile.visitedExperiences
  );

  return [...candidates].sort(
    (a, b) =>
      Number(
        visited.has(a.experienceId)
      ) -
      Number(
        visited.has(b.experienceId)
      )
  );
}
