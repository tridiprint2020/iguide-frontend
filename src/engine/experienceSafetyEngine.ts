import type {
  Experience,
} from "../types/experience";
import type {
  UserProfile,
} from "../types/user/user";
import type {
  WeatherStatus,
} from "./weatherEngine";

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

/**
 * Política neutral de seguridad para experiencias.
 * Nunca recupera candidatos que hayan fallado un filtro.
 */
export function filterSafeExperiences(
  experiences: Experience[],
  weather: WeatherStatus | null,
  currentDate: Date
): Experience[] {
  const activeExperiences =
    experiences.filter(
      (experience) =>
        experience.isActive !== false
    );

  const hour =
    currentDate.getHours();

  const isNight =
    hour >= 18 || hour < 6;

  const hasBadWeather =
    weather !== null &&
    (weather.condition === "rain" ||
      weather.condition === "drizzle" ||
      weather.condition === "snow" ||
      (weather.precipitationProbabilityNext3Hours ?? 0) >= 40);

  const weatherUnknown =
    weather === null;

  let candidates =
    activeExperiences;

  if (hasBadWeather) {
    candidates =
      candidates.filter(
        (experience) =>
          isIndoorFriendly(experience) &&
          !isOutdoorExperience(experience) &&
          !isWetRisky(experience)
      );
  }

  if (weatherUnknown) {
    candidates =
      candidates.filter(
        (experience) =>
          !isWetRisky(experience)
      );
  }

  if (isNight) {
    candidates =
      candidates.filter(
        isNightCompatible
      );
  }

  return candidates;
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
