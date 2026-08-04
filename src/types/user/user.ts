import type { Interest } from "../interest";

export type FavoriteReaction =
  | "saved"
  | "recommended"
  | "loved"
  | "must_try";

export interface UserFavorite {
  experienceId: string;
  reaction: FavoriteReaction;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  name: string;

  firstVisit: boolean;

  travelMode:
    | "solo"
    | "couple"
    | "family"
    | "friends";

  interests: Interest[];

  level: number;

  experience: number;

  visitedExperiences: string[];

  achievements: string[];

  favorites: UserFavorite[];
}