import { catalog } from "../data/catalog";
import { currentWeather } from "../data/currentWeather";
import type { Experience } from "../types/experience";
import type { ExplorerContext } from "../types/explorerContext";
import { isExpedition } from "../types/experience";

function rankExperiences(context: ExplorerContext) {
  const { profile, answers } = context;

  const ranked = catalog.map((experience) => {
    let score = 0;

    if (isExpedition(experience)) {
      const affinity = experience.affinity;
      const priorities = answers?.priorities ?? [];
      for (const priority of priorities) {
        if (priority in affinity) {
          score +=
            affinity[priority as keyof typeof affinity];
        }
      }

      score += affinity.firstTimeVisitor * (profile.firstVisit ? 1 : 0);
      score += affinity.family * (profile.travelMode === "family" ? 1 : 0);
      score += affinity.couples * (profile.travelMode === "couple" ? 1 : 0);
      score += affinity.photography * (profile.interests.includes("photography") ? 1 : 0);
      score += affinity.gastronomy * (profile.interests.includes("gastronomy") ? 1 : 0);
      score += affinity.adventure * (profile.interests.includes("adventure") ? 1 : 0);
      score += affinity.nightlife * (profile.interests.includes("nightlife") ? 1 : 0);

      if (!currentWeather.isHighMountainSafe && experience.difficulty === "high") {
        score -= 150;
      }
    }

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
