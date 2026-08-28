import {
  normalizePilotCohortCommand,
  resolvePilotCohortSourceCode,
  type PilotCohortCommand,
} from "../engine/pilotCohortEngine";

const PILOT_INTERNAL_COHORT_STORAGE_KEY =
  "iguide_internal_tester_v1";

export function syncPilotCohortFromUrl():
  | PilotCohortCommand
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const command =
    normalizePilotCohortCommand(
      new URLSearchParams(
        window.location.search
      ).get("cohort")
    );

  if (!command) {
    return null;
  }

  try {
    if (command === "internal") {
      window.localStorage.setItem(
        PILOT_INTERNAL_COHORT_STORAGE_KEY,
        "1"
      );
    } else {
      window.localStorage.removeItem(
        PILOT_INTERNAL_COHORT_STORAGE_KEY
      );
    }
  } catch {
    // La navegación nunca debe fallar por almacenamiento bloqueado.
  }

  return command;
}

export function isInternalPilotCohort(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(
        PILOT_INTERNAL_COHORT_STORAGE_KEY
      ) === "1"
    );
  } catch {
    return false;
  }
}

export function resolveCurrentPilotSourceCode(
  sourceCode: string | null | undefined
): string | null {
  const command =
    syncPilotCohortFromUrl();

  const isInternal =
    command === "internal" ||
    (command === null &&
      isInternalPilotCohort());

  return resolvePilotCohortSourceCode(
    sourceCode,
    isInternal
  );
}
