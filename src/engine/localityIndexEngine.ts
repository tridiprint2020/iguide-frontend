import type {
  UserProfile,
} from "../types/user/user";

export type LocalityTierId =
  | "visitor"
  | "curious"
  | "explorer"
  | "neighbor"
  | "honorary";

export type LocalityTier = {
  id: LocalityTierId;
  label: string;
  minimumLevel: number;
  minimumXp: number;
};

export type LocalityProgress = {
  currentTier: LocalityTier;
  nextTier: LocalityTier | null;

  tierProgressPercent: number;
  globalProgressPercent: number;

  currentXp: number;
  xpForNextTier: number;
  remainingXp: number;
  remainingMissions: number;
};

const XP_PER_LEVEL = 300;
const XP_PER_MISSION = 150;

const LOCALITY_TIERS: LocalityTier[] = [
  {
    id: "visitor",
    label: "Visitante",
    minimumLevel: 1,
    minimumXp: 0,
  },
  {
    id: "curious",
    label: "Curioso",
    minimumLevel: 2,
    minimumXp: XP_PER_LEVEL,
  },
  {
    id: "explorer",
    label: "Explorador",
    minimumLevel: 3,
    minimumXp: XP_PER_LEVEL * 2,
  },
  {
    id: "neighbor",
    label: "Vecino",
    minimumLevel: 5,
    minimumXp: XP_PER_LEVEL * 4,
  },
  {
    id: "honorary",
    label: "Wanka Honorario",
    minimumLevel: 8,
    minimumXp: XP_PER_LEVEL * 7,
  },
];

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

export function getAllLocalityTiers():
  LocalityTier[] {
  return [...LOCALITY_TIERS];
}

export function getLocalityProgress(
  profile: UserProfile
): LocalityProgress {
  const currentXp =
    Math.max(
      profile.experience,
      0
    );

  const currentTier =
    [...LOCALITY_TIERS]
      .reverse()
      .find(
        (tier) =>
          currentXp >=
          tier.minimumXp
      ) ??
    LOCALITY_TIERS[0];

  const currentTierIndex =
    LOCALITY_TIERS.findIndex(
      (tier) =>
        tier.id ===
        currentTier.id
    );

  const nextTier =
    LOCALITY_TIERS[
      currentTierIndex + 1
    ] ?? null;

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,

      tierProgressPercent: 100,
      globalProgressPercent: 100,

      currentXp,
      xpForNextTier: 0,
      remainingXp: 0,
      remainingMissions: 0,
    };
  }

  const tierXpRange =
    nextTier.minimumXp -
    currentTier.minimumXp;

  const xpInsideTier =
    currentXp -
    currentTier.minimumXp;

  const tierProgressPercent =
    Math.round(
      clamp(
        xpInsideTier /
          Math.max(
            tierXpRange,
            1
          ) *
          100,
        0,
        100
      )
    );

  const maximumXp =
    LOCALITY_TIERS[
      LOCALITY_TIERS.length - 1
    ].minimumXp;

  const globalProgressPercent =
    Math.round(
      clamp(
        currentXp /
          Math.max(
            maximumXp,
            1
          ) *
          100,
        0,
        100
      )
    );

  const remainingXp =
    Math.max(
      nextTier.minimumXp -
        currentXp,
      0
    );

  const remainingMissions =
    Math.ceil(
      remainingXp /
        XP_PER_MISSION
    );

  return {
    currentTier,
    nextTier,

    tierProgressPercent,
    globalProgressPercent,

    currentXp,
    xpForNextTier:
      nextTier.minimumXp,

    remainingXp,
    remainingMissions,
  };
}