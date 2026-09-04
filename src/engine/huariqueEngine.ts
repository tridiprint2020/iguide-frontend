import type {
  Experience,
  HuariqueProfile,
  VenueExperience,
} from "../types/experience";

const VENUE_TYPES = new Set<Experience["type"]>([
  "restaurant",
  "cafe",
  "bar",
  "nightclub",
]);

export type VerifiedHuariqueExperience =
  VenueExperience & {
    huarique: HuariqueProfile;
  };

function hasText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export function getVerifiedHuariqueProfile(
  experience: Experience
): HuariqueProfile | null {
  if (
    !VENUE_TYPES.has(experience.type) ||
    experience.isActive !== true
  ) {
    return null;
  }

  const profile = (
    experience as VenueExperience
  ).huarique;

  if (
    !profile ||
    profile.verified !== true ||
    !hasText(profile.reason) ||
    !hasText(profile.verifiedAt) ||
    !hasText(profile.evidenceSource) ||
    (
      profile.signatureDish !== undefined &&
      !hasText(profile.signatureDish)
    )
  ) {
    return null;
  }

  return profile;
}

export function isVerifiedHuarique(
  experience: Experience
): experience is VerifiedHuariqueExperience {
  return getVerifiedHuariqueProfile(experience) !== null;
}

export function getVerifiedHuariques(
  experiences: Experience[]
): VerifiedHuariqueExperience[] {
  return experiences.filter(isVerifiedHuarique);
}
