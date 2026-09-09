import type {
  Experience,
} from "../types/experience";
import {
  isExpedition,
} from "../types/experience";
import type {
  Interest,
} from "../types/interest";

export type ExplicitExperienceIntent =
  | "gastronomy"
  | "culture"
  | "adventure"
  | "photography"
  | "crafts"
  | "festivals"
  | "nightlife"
  | "surprise";

const EXPLICIT_INTENTS = new Set<string>([
  "gastronomy",
  "culture",
  "adventure",
  "photography",
  "crafts",
  "festivals",
  "nightlife",
  "surprise",
]);

const CULTURE_TAGS = new Set([
  "arte",
  "cultura",
  "culture",
  "historia",
  "history",
  "museo",
  "patrimonio",
]);

const ADVENTURE_TAGS = new Set([
  "adventure",
  "aventura",
  "mountain",
  "montaña",
  "naturaleza",
  "nature",
  "senderismo",
  "trekking",
]);

const PHOTOGRAPHY_TAGS = new Set([
  "atardecer",
  "fotografía",
  "mirador",
  "mountain",
  "montaña",
  "nature",
  "naturaleza",
  "photography",
]);

function isExplicitIntent(
  value: string
): value is ExplicitExperienceIntent {
  return EXPLICIT_INTENTS.has(value);
}

function getNormalizedTags(
  experience: Experience
): Set<string> {
  return new Set(
    experience.tags.map((tag) =>
      tag.trim().toLowerCase()
    )
  );
}

function hasAnyTag(
  experience: Experience,
  acceptedTags: ReadonlySet<string>
): boolean {
  const tags = getNormalizedTags(experience);

  return Array.from(acceptedTags).some((tag) =>
    tags.has(tag)
  );
}

/**
 * Contrato semántico único de Hospes.
 *
 * La intención elegida por la persona determina primero qué tipos de
 * experiencia son válidos. Los números legacy de afinidad solo pueden
 * ordenar candidatos que ya pasaron este contrato; nunca cambian la
 * naturaleza de un lugar.
 */
export function matchesExplicitIntent(
  experience: Experience,
  intent: ExplicitExperienceIntent
): boolean {
  if (intent === "surprise") {
    return true;
  }

  if (intent === "gastronomy") {
    return [
      "restaurant",
      "cafe",
      "food_route",
    ].includes(experience.type);
  }

  if (intent === "nightlife") {
    return ["bar", "nightclub"].includes(
      experience.type
    );
  }

  if (intent === "culture") {
    return (
      ["museum", "festival", "event"].includes(
        experience.type
      ) || hasAnyTag(experience, CULTURE_TAGS)
    );
  }

  if (intent === "crafts") {
    return experience.type === "craft";
  }

  if (intent === "festivals") {
    return ["festival", "event"].includes(
      experience.type
    );
  }

  if (intent === "adventure") {
    return (
      isExpedition(experience) &&
      hasAnyTag(
        experience,
        ADVENTURE_TAGS
      )
    );
  }

  return (
    experience.interests?.includes(
      "photography"
    ) === true ||
    hasAnyTag(experience, PHOTOGRAPHY_TAGS)
  );
}

export function getMatchedExplicitIntents(
  experience: Experience,
  priorities: readonly string[]
): ExplicitExperienceIntent[] {
  return Array.from(
    new Set(
      priorities
        .filter(isExplicitIntent)
        .filter(
          (intent) =>
            intent !== "surprise" &&
            matchesExplicitIntent(
              experience,
              intent
            )
        )
    )
  );
}

export function isEligibleForExplicitIntents(
  experience: Experience,
  priorities: readonly string[]
): boolean {
  if (priorities.includes("surprise")) {
    return true;
  }

  return (
    getMatchedExplicitIntents(
      experience,
      priorities
    ).length > 0
  );
}

type AffinityIntent = Extract<
  Interest,
  ExplicitExperienceIntent
>;

function isAffinityInterest(
  intent: ExplicitExperienceIntent
): intent is AffinityIntent {
  return [
    "photography",
    "adventure",
    "gastronomy",
    "nightlife",
  ].includes(intent);
}

function isSemanticProfileInterest(
  interest: Interest
): interest is AffinityIntent {
  return [
    "photography",
    "adventure",
    "gastronomy",
    "nightlife",
  ].includes(interest);
}

/**
 * Puntaje explicable para ordenar candidatos ya válidos.
 * Una coincidencia adicional suma valor y la afinidad legacy solo
 * desempata expediciones dentro de la intención que sí cumplen.
 */
export function getExplicitIntentScore(
  experience: Experience,
  priorities: readonly string[]
): {
  score: number;
  matchedIntents: ExplicitExperienceIntent[];
} {
  const matchedIntents =
    getMatchedExplicitIntents(
      experience,
      priorities
    );
  let score =
    matchedIntents.length > 0
      ? 100 +
        Math.max(0, matchedIntents.length - 1) *
          25
      : 0;

  if (isExpedition(experience)) {
    for (const intent of matchedIntents) {
      if (isAffinityInterest(intent)) {
        score += experience.affinity[intent];
      }
    }
  }

  return { score, matchedIntents };
}

/** Preferencias permanentes: ordenan, pero nunca habilitan categorías. */
export function getProfilePreferenceScore(
  experience: Experience,
  interests: readonly Interest[]
): number {
  let score = 0;

  for (const interest of interests) {
    if (
      isSemanticProfileInterest(interest) &&
      !matchesExplicitIntent(
        experience,
        interest
      )
    ) {
      continue;
    }

    if (experience.interests?.includes(interest)) {
      score += 10;
    }

    if (isExpedition(experience)) {
      score += experience.affinity[interest];
    }
  }

  return score;
}
