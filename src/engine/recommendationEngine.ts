import { catalog } from "../data/catalog";
import { currentWeather } from "../data/currentWeather";
import type { Experience } from "../types/experience";
import type { ExplorerContext } from "../types/explorerContext";
import { isExpedition } from "../types/experience";
import {
  getExplicitIntentScore,
  getProfilePreferenceScore,
  isEligibleForExplicitIntents,
} from "./experienceIntentEngine";

function rankExperiences(context: ExplorerContext) {
  const { profile, answers } = context;

  const priorities =
    answers?.priorities ?? [];
  const hasExplicitIntent =
    priorities.length > 0;
  const candidates = hasExplicitIntent
    ? catalog.filter((experience) =>
        isEligibleForExplicitIntents(
          experience,
          priorities
        )
      )
    : catalog;

  const ranked = candidates.map((experience) => {
    let score = getExplicitIntentScore(
      experience,
      priorities
    ).score;

    if (isExpedition(experience)) {
      const affinity = experience.affinity;

      score += affinity.firstTimeVisitor * (profile.firstVisit ? 1 : 0);
      score += affinity.family * (profile.travelMode === "family" ? 1 : 0);
      score += affinity.couples * (profile.travelMode === "couple" ? 1 : 0);
      if (!currentWeather.isHighMountainSafe && experience.difficulty === "high") {
        score -= 150;
      }
    }

    score += getProfilePreferenceScore(
      experience,
      profile.interests
    );

    if (profile.visitedExperiences.includes(experience.experienceId)) {
      score -= 100;
    }

    if (currentWeather.condition === "drizzle" || currentWeather.condition === "rain") {
      score += isExpedition(experience) ? -60 : 30;
    }

    return { experience, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

export function getRecommendations(context: ExplorerContext): Experience[] {
  return rankExperiences(context).map((r) => r.experience);
}

export function getBestExperience(context: ExplorerContext): Experience {
  return rankExperiences(context)[0].experience;
}
