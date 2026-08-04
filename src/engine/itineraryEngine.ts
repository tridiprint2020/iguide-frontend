import { catalog } from "../data/catalog";
import type { Experience } from "../types/experience";
import { isExpedition } from "../types/experience";
import type { Interest } from "../types/interest";
import type { ExplorerContext } from "../types/explorerContext";

function parseMinutes(text?: string): number {
  if (!text) return Infinity;
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
}

export function buildItinerary(context: ExplorerContext): Experience[] {
  const { profile, answers } = context;
  if (!answers) return [];

  const candidates = catalog.filter((e) => !profile.visitedExperiences.includes(e.experienceId));

  const scored = candidates.map((experience) => {
    let score = 0;

    if (isExpedition(experience)) {
      const affinity = experience.affinity;
      const priorityKey = answers.priority as Interest;
      if (priorityKey in affinity) score += affinity[priorityKey] * 2;

      if (answers.companions === "family") score += affinity.family;
      if (answers.companions === "couple") score += affinity.couples;
      if (answers.companions === "friends") score += affinity.backpacker;

      const walkMinutes = parseMinutes(experience.walkTime);
      if (answers.pace === "low" && walkMinutes > 20) score -= 40;
      if (answers.pace === "high" && walkMinutes <= 20) score += 10;

      if (!answers.hasCar) {
        const driveMinutes = parseMinutes(experience.driveTime);
        if (driveMinutes > 20) score -= 30;
      }

      if (answers.budget === "budget" && experience.price !== "Gratis") {
        score -= 25;
      }
    }

    return { experience, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const placesPerDay: Record<string, number> = { today: 2, "2days": 4, "3days": 6, week: catalog.length };
  const limit = placesPerDay[answers.duration] ?? 2;

  return scored.slice(0, limit).map((s) => s.experience);
}