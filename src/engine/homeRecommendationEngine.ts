import type {
  Experience,
} from "../types/experience";
import type {
  WeatherStatus,
} from "./weatherEngine";
import type {
  UserProfile,
} from "../types/user/user";

type RecommendationContext = {
  experiences: Experience[];
  weather: WeatherStatus;
  currentDate?: Date;
};

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
 * R1 v2 — Riesgo por humedad: un solo predicado para
 * lluvia real Y clima desconocido (conservador).
 * Incluye terreno arcilloso/sensible: mojado es peligroso.
 */
function isWetRisky(
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
 * R1 — Política de seguridad ÚNICA y compartida.
 *
 * Aplica los mismos predicados existentes (clima, noche,
 * terreno) sobre una colección recibida explícitamente.
 * Con clima desconocido (null) actúa de forma conservadora:
 * excluye lo que sería peligroso si lloviera.
 * NUNCA devuelve el catálogo crudo.
 */
function filterSafeExperiences(
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
    /*
     * Sin dato de clima no asumimos cielo despejado:
     * mismo predicado de riesgo por humedad que la lluvia.
     */
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

export function selectHomeExperience({
  experiences,
  weather,
  currentDate = new Date(),
}: RecommendationContext):
  Experience | null {
  const candidates =
    filterSafeExperiences(
      experiences,
      weather,
      currentDate
    );

  /*
   * R1 v2: sin fallback interior. Un interior que no
   * superó isNightCompatible u otra regla NO vuelve.
   */
  return candidates[0] ?? null;
}

/**
 * R1 — Función pura exigida por la revisión de Codex.
 *
 * Recibe la colección explícitamente (no importa catalog),
 * reutiliza la política de seguridad compartida y, si nada
 * es seguro, intenta el subconjunto interior prudente.
 * Si tampoco existe, devuelve [] — jamás el catálogo crudo.
 * El perfil solo reordena: lo no visitado primero, con
 * orden estable para respetar la personalización de entrada.
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

  /*
   * R1 v2: si la política devuelve vacío, es vacío.
   * Ninguna recuperación puede saltarse una regla.
   */
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
