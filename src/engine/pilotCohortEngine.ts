import {
  normalizePilotSourceCode,
} from "./pilotAttributionEngine";

export const PILOT_INTERNAL_SOURCE_CODE =
  "test-internal";

export type PilotCohortCommand =
  | "internal"
  | "public";

export function normalizePilotCohortCommand(
  value: string | null | undefined
): PilotCohortCommand | null {
  const normalized = value
    ?.trim()
    .toLowerCase();

  if (
    normalized === "internal" ||
    normalized === "public"
  ) {
    return normalized;
  }

  return null;
}

export function resolvePilotCohortSourceCode(
  sourceCode: string | null | undefined,
  isInternal: boolean
): string | null {
  if (isInternal) {
    return PILOT_INTERNAL_SOURCE_CODE;
  }

  return normalizePilotSourceCode(
    sourceCode
  );
}
