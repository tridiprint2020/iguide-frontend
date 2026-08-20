import type {
  Experience,
} from "../types/experience";
import type {
  WeatherStatus,
} from "./weatherEngine";
import {
  filterSafeExperiences,
} from "./experienceSafetyEngine";

export {
  getSafeCandidates,
} from "./experienceSafetyEngine";

type RecommendationContext = {
  experiences: Experience[];
  weather: WeatherStatus;
  currentDate?: Date;
};

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
