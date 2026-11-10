export const guardians = [
  { id: "atoq", name: "Atoq", experienceId: "EXP-0001" },
  { id: "picaflor", name: "Picaflor", experienceId: "EXP-0004" },
  { id: "condor", name: "Cóndor", experienceId: "EXP-0002" },
  { id: "taruka", name: "Taruka", experienceId: "EXP-0003" },
] as const;

export type GuardianId = typeof guardians[number]["id"];

/** The completed mission IDs already persisted by the journey are authoritative. */
export function getGuardianCollection(visitedExperiences: readonly string[]) {
  const completed = new Set(visitedExperiences);
  return guardians.map((guardian) => ({
    ...guardian,
    collected: completed.has(guardian.experienceId),
  }));
}
