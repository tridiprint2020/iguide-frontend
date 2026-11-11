import type { CollectionId } from "./collectibles";

export const guardians = [
  { id: "atoq", name: "Atoq", experienceId: "EXP-0001", collectionId: "mantaro" },
  { id: "picaflor", name: "Picaflor", experienceId: "EXP-0004", collectionId: "mantaro" },
  { id: "condor", name: "Cóndor", experienceId: "EXP-0002", collectionId: "mantaro" },
  { id: "taruka", name: "Taruka", experienceId: "EXP-0003", collectionId: "mantaro" },
] as const;

export type GuardianId = typeof guardians[number]["id"];

/** The completed mission IDs already persisted by the journey are authoritative. */
export function getGuardianCollection(visitedExperiences: readonly string[], collectionId?: CollectionId) {
  const completed = new Set(visitedExperiences);
  return guardians
    .filter((guardian) => !collectionId || guardian.collectionId === collectionId)
    .map((guardian) => ({
      ...guardian,
      collected: completed.has(guardian.experienceId),
    }));
}
