import type {
  Experience,
} from "../types/experience";
import type {
  WeatherStatus,
} from "./weatherEngine";

type RecommendationContext = {
  experiences: Experience[];
  weather: WeatherStatus;
  currentDate?: Date;
};

function isOutdoorExperience(
  experience: Experience
): boolean {
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

export function selectHomeExperience({
  experiences,
  weather,
  currentDate = new Date(),
}: RecommendationContext):
  Experience | null {
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
    weather.condition === "rain" ||
    weather.condition === "drizzle" ||
    weather.condition === "snow";

  let candidates =
    activeExperiences;

  if (hasBadWeather) {
    candidates =
      candidates.filter(
        (experience) =>
          isIndoorFriendly(experience) &&
          !isOutdoorExperience(experience)
      );
  }

  if (isNight) {
    candidates =
      candidates.filter(
        isNightCompatible
      );
  }

  /*
   * Si el filtro fue demasiado estricto,
   * preferimos una experiencia interior
   * antes que volver a recomendar montaña.
   */
  if (candidates.length === 0) {
    candidates =
      activeExperiences.filter(
        isIndoorFriendly
      );
  }

  return candidates[0] ?? null;
}